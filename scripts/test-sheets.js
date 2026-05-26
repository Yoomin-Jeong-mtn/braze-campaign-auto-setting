require('dotenv').config();
const { getCampaignsToProcess, getSegmentTemplates } = require('../src/sheets');

(async () => {
  console.log('[test-sheets] 세그먼트 템플릿 읽기...');
  const segmentTemplates = await getSegmentTemplates();
  console.log('[test-sheets] 세그먼트 템플릿:', segmentTemplates);

  console.log('\n[test-sheets] 처리 대상 캠페인 읽기...');
  const campaigns = await getCampaignsToProcess();
  console.log(`[test-sheets] ${campaigns.length}개 캠페인 발견:`);
  campaigns.forEach((c, i) => {
    console.log(`  [${i + 1}] rowIndex=${c.rowIndex}, segment="${c.segment}", name="${c.campaignName}", date=${c.sendDate}, time=${c.sendTime}`);
  });

  if (campaigns.length === 0) {
    console.log('[test-sheets] 처리 대상 행이 없습니다.');
  }
})();
