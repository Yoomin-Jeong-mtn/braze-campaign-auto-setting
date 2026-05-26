require('dotenv').config();
const { chromium } = require('playwright');
const path = require('path');

const USER_DATA_DIR = path.resolve(__dirname, '../.chromium-profile');

(async () => {
  const context = await chromium.launchPersistentContext(USER_DATA_DIR, {
    headless: false,
  });

  const page = await context.newPage();
  await page.goto(process.env.BRAZE_TEMPLATE_CAMPAIGN_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });

  const currentUrl = page.url();
  const isLoggedIn =
    !currentUrl.includes('sign_in') &&
    !currentUrl.includes('login') &&
    !currentUrl.includes('two-factor');

  if (isLoggedIn) {
    console.log('✅ 세션 유효! 로그인 상태 확인됨');
    console.log('현재 URL:', currentUrl);
  } else {
    console.log('❌ 세션 만료. npm run save-session 다시 실행 필요');
  }

  await page.waitForTimeout(3000);
  await context.close();
  process.exit(0);
})();
