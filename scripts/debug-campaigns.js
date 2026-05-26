require('dotenv').config();
const { chromium } = require('playwright');
const path = require('path');

const USER_DATA_DIR = path.resolve(__dirname, '../.chromium-profile');

(async () => {
  const context = await chromium.launchPersistentContext(USER_DATA_DIR, {
    headless: false,
  });
  const page = await context.newPage();

  const campaignsUrl = `${process.env.BRAZE_BASE_URL}/engagement/campaigns`;
  await page.goto(campaignsUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(4000); // 필터 칩 렌더링 대기

  // 페이지에 있는 모든 버튼 이름 출력
  const buttons = await page.getByRole('button').all();
  console.log(`\n버튼 목록 (총 ${buttons.length}개):`);
  for (const btn of buttons) {
    const name = await btn.getAttribute('aria-label') || await btn.textContent();
    if (name?.trim()) console.log(' -', name.trim().slice(0, 80));
  }

  // 검색창 상태 확인
  const searchVisible = await page.getByRole('textbox', { name: 'Search' }).isVisible().catch(() => false);
  console.log('\n검색창 보임:', searchVisible);

  // Active 필터 칩 확인
  const activeTexts = await page.locator('text=Active').all();
  console.log('Active 텍스트 요소 수:', activeTexts.length);

  console.log('\n→ 10초 후 자동 종료됩니다. 화면 확인하세요.');
  await page.waitForTimeout(10000);
  await context.close();
  process.exit(0);
})();
