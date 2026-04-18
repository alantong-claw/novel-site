const { chromium } = require('playwright');
const path = require('path');

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitForCondition(checkFn, { tries = 15, delayMs = 1000, label = 'check' } = {}) {
  let last = null;
  for (let i = 0; i < tries; i++) {
    last = await checkFn();
    if (last && last.ok) return last;
    await sleep(delayMs);
  }
  return last || { ok: false, label };
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

  const loginReady = await waitForCondition(async () => {
    const user = page.locator('input[name="username"]').first();
    const pass = page.locator('input[name="password"]').first();
    const submit = page.locator('button[type="submit"]').first();
    return {
      ok: await user.isVisible().catch(() => false) && await pass.isVisible().catch(() => false) && await submit.isVisible().catch(() => false),
      stage: 'login-page',
      url: page.url(),
      title: await page.title(),
    };
  }, { tries: 10, delayMs: 1000, label: 'login ready' });
  console.log('[min] login ready:', JSON.stringify(loginReady, null, 2));
  if (!loginReady.ok) { await context.close(); return; }

  await page.locator('input[name="username"]').fill(username);
  await sleep(800);
  await page.locator('input[name="password"]').fill(password);
  await sleep(800);
  await page.locator('button[type="submit"]').first().click();
  await sleep(1000);

  const dashboardReady = await waitForCondition(async () => {
    const url = page.url();
    const body = (await page.locator('body').innerText().catch(() => '')).slice(0, 1200);
    return {
      ok: url.includes('/dashboard'),
      stage: 'dashboard',
      url,
      title: await page.title(),
      body,
    };
  }, { tries: 15, delayMs: 1000, label: 'dashboard ready' });
  console.log('[min] dashboard ready:', JSON.stringify(dashboardReady, null, 2));
  if (!dashboardReady.ok) { await context.close(); return; }

  await page.goto('https://panel.pixnet.tw/posts', { waitUntil: 'domcontentloaded' });
  await sleep(1000);

  const postsReady = await waitForCondition(async () => {
    const url = page.url();
    const body = (await page.locator('body').innerText().catch(() => '')).slice(0, 2000);
    const ok = url.startsWith('https://panel.pixnet.tw/posts') && body.includes('我的文章') && body.includes('寫文章');
    return {
      ok,
      stage: 'posts',
      url,
      title: await page.title(),
      body,
    };
  }, { tries: 15, delayMs: 1000, label: 'posts ready' });
  console.log('[min] posts ready:', JSON.stringify(postsReady, null, 2));

  await sleep(8000);
  await context.close();
})();
