require('dotenv').config();
const { chromium } = require('playwright');
const path = require('path');

const USER_DATA_DIR = path.resolve(__dirname, '../.chromium-profile');
const SESSION_PATH = path.resolve(__dirname, '../session.json');

(async () => {
  const context = await chromium.launchPersistentContext(USER_DATA_DIR, { headless: true });
  await context.storageState({ path: SESSION_PATH });
  await context.close();
  console.log('session.json 내보내기 완료');
  process.exit(0);
})();
