/**
 * 최초 1회 실행: Braze에 수동 로그인 → 세션을 브라우저 프로필에 영구 저장
 * 로그인 완료(URL 변경) 감지 시 자동으로 저장 후 종료
 *
 * 실행: node scripts/save-session.js
 */
require('dotenv').config();
const { chromium } = require('playwright');
const path = require('path');

const USER_DATA_DIR = path.resolve(__dirname, '../.chromium-profile');
const LOGIN_TIMEOUT_MS = 10 * 60 * 1000;

(async () => {
  const context = await chromium.launchPersistentContext(USER_DATA_DIR, {
    headless: false,
  });

  const page = await context.newPage();
  await page.goto(process.env.BRAZE_BASE_URL);

  console.log('브라우저가 열렸습니다. Braze에 로그인해주세요.');
  console.log('로그인 + 이메일 인증까지 완료되면 여기서 Enter를 눌러주세요.');

  await new Promise((resolve) => {
    process.stdin.resume();
    process.stdin.once('data', resolve);
  });

  await context.close();

  console.log('세션 저장 완료! (.chromium-profile/)');
  process.exit(0);
})();
