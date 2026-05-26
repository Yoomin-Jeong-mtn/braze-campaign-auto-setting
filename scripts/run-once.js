require('dotenv').config();
const { getCampaignsToProcess, getSegmentTemplates, updateCampaignResult } = require('../src/sheets');
const { createDraftCampaign } = require('../src/braze');

(async () => {
  const [campaigns, segmentTemplates] = await Promise.all([
    getCampaignsToProcess(),
    getSegmentTemplates(),
  ]);

  console.log(`[run] ${campaigns.length}개 캠페인 처리 시작`);

  for (const campaign of campaigns) {
    const templateCampaignId = segmentTemplates[campaign.segment];
    if (!templateCampaignId) {
      console.error(`[run] 세그먼트 "${campaign.segment}" 템플릿 없음`);
      await updateCampaignResult(campaign.rowIndex, {
        status: '세팅 실패',
        errorReason: `세그먼트 "${campaign.segment}" 템플릿 없음`,
      });
      continue;
    }

    console.log(`[run] "${campaign.campaignName}" 처리 중... (세그먼트: ${campaign.segment})`);
    try {
      const brazeUrl = await createDraftCampaign({ ...campaign, templateCampaignId });
      await updateCampaignResult(campaign.rowIndex, { status: '세팅 완료', brazeUrl });
      console.log(`[run] 완료: ${brazeUrl}`);
    } catch (err) {
      console.error(`[run] 실패: ${err.message}`);
      await updateCampaignResult(campaign.rowIndex, { status: '세팅 실패', errorReason: err.message });
    }
  }

  console.log('[run] 전체 완료');
})();
