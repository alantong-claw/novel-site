const { chromium } = require('playwright');
const path = require('path');

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

(async () => {
  const userDataDir = path.join('/home/alantong/ai-work/tmp/pixnet-playwright-test', 'pixnet-user-data');
  const username = process.env.PIXNET_USER;
  const password = process.env.PIXNET_PASS;
  if (!username || !password) throw new Error('Missing PIXNET_USER or PIXNET_PASS');

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
  await page.goto('https://account.pixnet.tw/login', { waitUntil: 'domcontentloaded' });
  await sleep(1500);

  await page.locator('input[name="username"]').fill(username);
  await sleep(800);
  await page.locator('input[name="password"]').fill(password);
  await sleep(800);
  await page.getByRole('button', { name: '登入' }).click();
  await sleep(5000);

  console.log(JSON.stringify({
    url: page.url(),
    title: await page.title(),
    body: (await page.locator('body').innerText()).slice(0, 1500)
  }, null, 2));

  await sleep(10000);
  await context.close();
})();
