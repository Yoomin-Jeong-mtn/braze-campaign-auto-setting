require('dotenv').config();
const { createDraftCampaign } = require('../src/braze');

const testCampaign = {
  campaignName: '[테스트] 자동화 Draft 확인용 2',
  title: '테스트 제목입니다',
  body: '테스트 본문입니다. 자동화 확인용.',
  deeplink: 'martinee://deeplink',
  iosImage: 'https://example.com/ios-image.png',
  androidImage: 'https://example.com/android-image.png',
  sendDate: '2026/05/30',
  sendTime: '13:05',
};

(async () => {
  console.log('[test] 캠페인 Draft 생성 시작...');
  try {
    const url = await createDraftCampaign(testCampaign);
    console.log('[test] 완료! URL:', url);
  } catch (err) {
    console.error('[test] 실패:', err.message);
    process.exit(1);
  }
})();
