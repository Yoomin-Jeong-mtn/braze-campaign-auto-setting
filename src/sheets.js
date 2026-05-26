require('dotenv').config();
const { google } = require('googleapis');
const path = require('path');

const SHEET_NAME = '푸시 세팅';
const SEGMENT_SHEET_NAME = '세그먼트별 템플릿 캠페인 id';

const COL = {
  STATUS: 0,
  SEGMENT: 1,
  CAMPAIGN_NAME: 2,
  TITLE: 3,
  BODY: 4,
  DEEPLINK: 5,
  ANDROID_IMAGE: 6,
  IOS_IMAGE: 7,
  SEND_TIME: 8,
  SEND_DATE: 9,
  BRAZE_URL: 10,
  ERROR_REASON: 11,
  UPDATED_AT: 12,
};

async function getSheets() {
  const keyFile = path.resolve(__dirname, '..', process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH);
  const auth = new google.auth.GoogleAuth({
    keyFile,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  const client = await auth.getClient();
  return google.sheets({ version: 'v4', auth: client });
}

function formatDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}${m}${day}`;
}

function getDatesToProcess() {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0=Sun, 1=Mon, ..., 5=Fri, 6=Sat

  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const dates = [formatDate(tomorrow)];

  // 금요일이면 일요일(모레)도 함께 처리
  if (dayOfWeek === 5) {
    const sunday = new Date(today);
    sunday.setDate(today.getDate() + 2);
    dates.push(formatDate(sunday));
  }

  return dates;
}

function normalizeDate(str) {
  return (str || '').replace(/[^0-9]/g, '');
}

function normalizeTime(str) {
  if (!str) return '';
  const match = str.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)$/);
  if (!match) return str.trim();
  let hour = parseInt(match[1], 10);
  const minute = match[2];
  const isPM = /pm/i.test(match[3]);
  if (isPM && hour !== 12) hour += 12;
  if (!isPM && hour === 12) hour = 0;
  return `${String(hour).padStart(2, '0')}:${minute}`;
}

async function getSegmentTemplates() {
  const sheets = await getSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: `${SEGMENT_SHEET_NAME}!A:B`,
  });

  const rows = res.data.values || [];
  const map = {};
  for (let i = 1; i < rows.length; i++) {
    const segment = rows[i][0]?.trim();
    const campaignId = rows[i][1]?.trim();
    if (segment && campaignId) map[segment] = campaignId;
  }
  return map;
}

async function getCampaignsToProcess() {
  const sheets = await getSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: `${SHEET_NAME}!A:K`,
  });

  const rows = res.data.values || [];
  const targetDates = getDatesToProcess();
  const targetStatuses = ['작성완료', '작성 완료', '세팅 실패'];

  const campaigns = [];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const status = row[COL.STATUS]?.trim();
    const sendDate = normalizeDate(row[COL.SEND_DATE]);

    if (!targetStatuses.includes(status)) continue;
    if (!targetDates.includes(sendDate)) continue;

    campaigns.push({
      rowIndex: i + 1,
      segment: row[COL.SEGMENT]?.trim() || '',
      campaignName: row[COL.CAMPAIGN_NAME]?.trim() || '',
      title: row[COL.TITLE]?.trim() || '',
      body: row[COL.BODY]?.trim() || '',
      deeplink: row[COL.DEEPLINK]?.trim() || '',
      androidImage: row[COL.ANDROID_IMAGE]?.trim() || '',
      iosImage: row[COL.IOS_IMAGE]?.trim() || '',
      sendTime: normalizeTime(row[COL.SEND_TIME]),
      sendDate: row[COL.SEND_DATE]?.trim() || '',
      existingBrazeUrl: row[COL.BRAZE_URL]?.trim() || '',
    });
  }

  return campaigns;
}

async function updateCampaignResult(rowIndex, { status, brazeUrl, errorReason }) {
  const sheets = await getSheets();
  const now = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });

  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    requestBody: {
      valueInputOption: 'USER_ENTERED',
      data: [
        { range: `${SHEET_NAME}!A${rowIndex}`, values: [[status]] },
        { range: `${SHEET_NAME}!K${rowIndex}`, values: [[brazeUrl || '']] },
        { range: `${SHEET_NAME}!L${rowIndex}`, values: [[errorReason || '']] },
        { range: `${SHEET_NAME}!M${rowIndex}`, values: [[now]] },
      ],
    },
  });
}

module.exports = { getCampaignsToProcess, getSegmentTemplates, updateCampaignResult };
