const { chromium } = require('playwright');
const path = require('path');
const pixnetPaths = require('/home/alantong/ai-work/scripts/pixnet_paths');

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

(async () => {
  const userDataDir = pixnetPaths.userDataDir;

  const context = await chromium.launchPersistentContext(userDataDir, {
    headless: false,
    executablePath: '/snap/bin/chromium',
    env: {
      ...process.env,
      XDG_RUNTIME_DIR: '/run/user/1000',
      WAYLAND_DISPLAY: 'wayland-0',
      DISPLAY: ':0',
    },
    args: ['--no-sandbox'],
    viewport: { width: 1400, height: 960 },
  });

  const page = context.pages()[0] || await context.newPage();

  console.log('[step1] goto posts');
  await page.goto('https://panel.pixnet.tw/posts', { waitUntil: 'domcontentloaded' });
  await sleep(3000);

  console.log('[step1] click 寫文章');
  const writeLink = page.getByText('寫文章', { exact: true }).first();
  await writeLink.waitFor({ state: 'visible', timeout: 15000 });
  await writeLink.scrollIntoViewIfNeeded();
  await sleep(1000);
  await writeLink.click();
  await sleep(3000);

  console.log('[step1] url after click:', page.url());

  const startButton = page.getByRole('button', { name: /開始寫文章/ }).first();
  const startVisible = await startButton.isVisible().catch(() => false);
  if (!startVisible) {
    console.log('[step1] START_BUTTON_NOT_VISIBLE');
    console.log('[step1] title:', await page.title());
    console.log('[step1] body:', (await page.locator('body').innerText()).slice(0, 2000));
    await sleep(15000);
    await context.close();
    return;
  }

  console.log('[step1] click 開始寫文章');
  await startButton.scrollIntoViewIfNeeded();
  await sleep(1000);
  await startButton.click();
  await sleep(5000);

  console.log('[step1] final url:', page.url());
  console.log('[step1] final title:', await page.title());
  console.log('[step1] body head:', (await page.locator('body').innerText()).slice(0, 2500));

  await sleep(15000);
  await context.close();
})();
