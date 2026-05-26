require('dotenv').config();
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const USER_DATA_DIR = path.resolve(__dirname, '../.chromium-profile');

async function createDraftCampaign(campaignData) {
  if (!campaignData.existingBrazeUrl) {
    await duplicateViaApi(campaignData.campaignName, campaignData.templateCampaignId);
    await new Promise((r) => setTimeout(r, 5000));
  } else {
    console.log('[braze] 기존 복제본 재사용:', campaignData.existingBrazeUrl);
  }

  const url = await editCampaign(campaignData);
  return url;
}

async function duplicateViaApi(campaignName, templateCampaignId) {
  const res = await fetch(`${process.env.BRAZE_API_URL}/campaigns/duplicate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.BRAZE_API_KEY}`,
    },
    body: JSON.stringify({
      campaign_id: templateCampaignId,
      name: campaignName,
    }),
  });

  const body = await res.text();
  if (!res.ok) throw new Error(`복제 API 실패 ${res.status}: ${body}`);
  console.log('[braze] 복제 API 응답:', res.status, body);
}

async function editCampaign(campaignData) {
  if (!fs.existsSync(USER_DATA_DIR)) {
    throw new Error('.chromium-profile 없음. scripts/save-session.js 먼저 실행하세요.');
  }

  const context = await chromium.launchPersistentContext(USER_DATA_DIR, {
    headless: false,
  });
  const page = await context.newPage();

  try {
    // 캠페인 리스트에서 복제된 캠페인 검색
    const campaignsUrl = `${process.env.BRAZE_BASE_URL}/engagement/campaigns`;
    await page.goto(campaignsUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await handleLoginIfNeeded(page, campaignsUrl);

    // Draft 필터
    await page.waitForSelector('#status', { timeout: 15000 });
    await page.locator('#status .bcl-select__control').click();
    await page.getByText('Draft', { exact: true }).click();
    await page.waitForTimeout(500);

    // 캠페인명으로 검색
    const searchInput = page.getByRole('textbox', { name: 'Search' });
    await searchInput.fill(`"${campaignData.campaignName}"`);
    await searchInput.press('Enter');
    await page.getByRole('button', { name: 'Search', exact: true }).click();
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(1000);

    // 캠페인 클릭해서 편집 화면으로 이동
    await page.getByText(campaignData.campaignName, { exact: true }).first().click();
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(1000);

    // 제목: 고정 prefix + 시트 제목
    const formattedTitle = '{{content_blocks.${push_setting}}}(광고) ' + campaignData.title;
    await fillMonaco(page, monacoByTextareaId(page, 'quick-push-title'), formattedTitle);

    // 본문: 광고 표시 + 시트 본문 + 수신거부 문구
    const formattedBody = '(광고) ' + campaignData.body + '\n*수신거부:설정>알림설정';
    await fillMonaco(page, monacoByTextareaId(page, 'quick-push-message'), formattedBody);

    // 딥링크
    if (campaignData.deeplink) {
      await fillMonaco(page, monacoByTextareaId(page, 'onclick-behavior-input'), campaignData.deeplink);
    }

    // iOS 이미지
    if (campaignData.iosImage) {
      await fillMonaco(
        page,
        monacoByTextareaId(page, 'quick-push-ios-notification-image-liquid-url-asset-input'),
        campaignData.iosImage
      );
      // 파일 형식 JPG 선택
      await page.locator('#quick-push-ios-notification-image-asset-format-selector').click();
      await page.getByRole('option', { name: 'PNG', exact: true }).click();
    }

    // Android 이미지
    if (campaignData.androidImage) {
      await fillMonaco(
        page,
        monacoByTextareaId(page, 'quick-push-android-notification-image-liquid-url-asset-input'),
        campaignData.androidImage
      );
    }

    // Schedule 탭
    await page.getByRole('button', { name: 'Step Schedule', exact: true }).click();
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });

    // 발송 시간
    await setTime(page, campaignData.sendTime);

    // 발송 날짜
    const dateInput = page.getByRole('textbox', { name: 'Select Date' });
    await dateInput.fill(campaignData.sendDate.replace(/-/g, '/'));
    await dateInput.press('Enter');

    // Target → Assign → Review → Save Draft
    await page.getByRole('button', { name: 'Step Target', exact: true }).click();
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.getByRole('button', { name: 'Step Assign', exact: true }).click();
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.getByRole('button', { name: 'Step Review', exact: true }).click();
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.getByRole('button', { name: 'Save Draft' }).click();
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });

    return page.url();
  } finally {
    await context.close();
  }
}

async function handleLoginIfNeeded(page, returnUrl) {
  const url = page.url();
  const needsLogin = url.includes('sign_in') || url.includes('/auth') ||
    url.includes('two-factor') || url.includes('/clusters');
  if (!needsLogin) return;

  // Cluster 선택 화면
  const clusterBtn = page.locator('[data-cluster="US Cluster 07"]');
  if (await clusterBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
    await clusterBtn.click();
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
  }

  // 비밀번호 입력
  const passwordInput = page.getByRole('textbox', { name: 'Password' });
  if (await passwordInput.isVisible({ timeout: 5000 }).catch(() => false)) {
    await passwordInput.fill(process.env.BRAZE_PASSWORD);
    await page.getByRole('button', { name: 'Sign In' }).click();
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
  }

  // 로그인 후 원래 페이지로 복귀
  if (returnUrl) {
    await page.goto(returnUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
  }
}

function monacoByTextareaId(page, textareaId) {
  return page.locator('.monaco-editor')
    .filter({ has: page.locator(`textarea#${textareaId}`) })
    .locator('.view-lines');
}

async function fillMonaco(page, locator, text) {
  await locator.dblclick();
  await page.keyboard.press('ControlOrMeta+a');
  await page.keyboard.type(text);
}

async function setTime(page, sendTime) {
  const [hourStr, minuteStr] = sendTime.split(':');
  let hour = parseInt(hourStr, 10);
  const minute = parseInt(minuteStr, 10);
  const isPM = hour >= 12;
  if (hour > 12) hour -= 12;
  if (hour === 0) hour = 12;

  await page.getByRole('textbox', { name: 'h:mm am' }).dblclick();
  await page.locator('.svg-inline--fa.fa-clock').click();
  await page.waitForTimeout(500);

  await page.locator('.bcl-time-picker-list.time-picker-list__hours')
    .locator('div').filter({ hasText: new RegExp(`^${hour}$`) }).first().click();
  await page.waitForTimeout(200);
  await page.locator('.bcl-time-picker-list.time-picker-list__minutes')
    .locator('div').filter({ hasText: new RegExp(`^${minute}$`) }).first().click();
  await page.waitForTimeout(200);
  await page.locator('.bcl-time-picker-list.time-picker-list__am-pm')
    .locator('div').filter({ hasText: isPM ? /^pm$/ : /^am$/ }).first().click();
  await page.waitForTimeout(300);

  // 시간 확정: 날짜 입력 필드 클릭으로 피커 닫기
  await page.getByRole('textbox', { name: 'Select Date' }).click();
  await page.waitForTimeout(300);
}

module.exports = { createDraftCampaign };
