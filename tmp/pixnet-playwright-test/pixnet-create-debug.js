const { chromium } = require('playwright');
const path = require('path');
const pixnetPaths = require('/home/alantong/ai-work/scripts/pixnet_paths');

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

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
  try {
    await page.goto('https://account.pixnet.tw/login', { waitUntil: 'domcontentloaded' });
    await sleep(1000);
    const username = page.locator('input[name="username"]');
    if (await username.isVisible().catch(() => false)) {
      await username.fill('alantong');
      await page.locator('input[name="password"]').fill('xxxx3721?!');
      await page.locator('button[type="submit"]').first().click();
      await sleep(2500);
    }
    await page.goto('https://panel.pixnet.tw/posts/create', { waitUntil: 'domcontentloaded' });
    await sleep(2500);
    console.log('URL', page.url());
    const body = (await page.locator('body').innerText().catch(() => '')).slice(0, 5000);
    console.log('BODY_START');
    console.log(body);
    console.log('BODY_END');
    const buttons = await page.locator('button').evaluateAll(nodes => nodes.map((n,i) => ({i, text:(n.innerText||'').trim(), aria:n.getAttribute('aria-label'), cls:n.className})).filter(x => x.text || x.aria));
    console.log('BUTTONS', JSON.stringify(buttons, null, 2));
    await sleep(30000);
  } finally {
    await context.close();
  }
})();
