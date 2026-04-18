const { chromium } = require('playwright');
const path = require('path');

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitForCondition(checkFn, { tries = 15, delayMs = 1000 } = {}) {
  let last = null;
  for (let i = 0; i < tries; i++) {
    last = await checkFn();
    if (last && last.ok) return last;
    await sleep(delayMs);
  }
  return last || { ok: false };
}

(async () => {
  const userDataDir = path.join('/home/alantong/ai-work/tmp/pixnet-playwright-test', 'pixnet-user-data');
  const username = 'alantong';
  const password = 'xxxx3721?!';

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
  await sleep(1000);

  const loginPage = await waitForCondition(async () => {
    const u = page.locator('input[name="username"]').first();
    const p = page.locator('input[name="password"]').first();
    const s = page.locator('button[type="submit"]').first();
    return {
      ok: await u.isVisible().catch(() => false) && await p.isVisible().catch(() => false) && await s.isVisible().catch(() => false),
      url: page.url(),
      title: await page.title()
    };
  }, { tries: 10, delayMs: 1000 });

  console.log('[login] page check:', JSON.stringify(loginPage, null, 2));
  if (!loginPage.ok) {
    await context.close();
    return;
  }

  await page.locator('input[name="username"]').fill(username);
  await sleep(800);
  await page.locator('input[name="password"]').fill(password);
  await sleep(800);
  await page.locator('button[type="submit"]').first().click();
  await sleep(1000);

  const afterLogin = await waitForCondition(async () => {
    const url = page.url();
    const title = await page.title();
    const body = (await page.locator('body').innerText().catch(() => '')).slice(0, 1200);
    const inPanel = /panel\.pixnet\.tw/.test(url) || body.includes('我的文章') || body.includes('寫文章');
    return { ok: inPanel, url, title, body };
  }, { tries: 15, delayMs: 1000 });

  console.log('[login] after login:', JSON.stringify(afterLogin, null, 2));
  await sleep(10000);
  await context.close();
})();
