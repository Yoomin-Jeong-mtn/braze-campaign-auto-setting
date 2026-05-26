require('dotenv').config();
const cron = require('node-cron');
const { getCampaignsForTomorrow, updateCampaignResult } = require('./sheets');
const { createDraftCampaign } = require('./braze');

async function run() {
  console.log('[run] 시작:', new Date().toLocaleString('ko-KR'));

  const campaigns = await getCampaignsForTomorrow();
  console.log(`[run] 처리 대상: ${campaigns.length}건`);

  for (const campaign of campaigns) {
    try {
      const brazeUrl = await createDraftCampaign(campaign);
      await updateCampaignResult(campaign.rowIndex, {
        status: '세팅 완료',
        brazeUrl,
        errorReason: '',
      });
      console.log(`[run] 완료: ${campaign.campaignName}`);
    } catch (err) {
      await updateCampaignResult(campaign.rowIndex, {
        status: '세팅 실패',
        brazeUrl: '',
        errorReason: err.message,
      });
      console.error(`[run] 실패: ${campaign.campaignName} —`, err.message);
    }
  }

  console.log('[run] 종료');
}

// 매일 오전 10시 실행
cron.schedule('0 10 * * *', run, { timezone: 'Asia/Seoul' });

console.log('스케줄러 시작 (매일 10:00 KST)');
