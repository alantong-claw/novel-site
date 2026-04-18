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

  const loginReady = await waitForCondition(async () => ({
    ok: await page.locator('input[name="username"]').first().isVisible().catch(() => false),
    url: page.url(),
    title: await page.title(),
  }), { tries: 10, delayMs: 1000, label: 'login ready' });
  console.log('[diag] login ready:', JSON.stringify(loginReady, null, 2));
  if (!loginReady.ok) { await context.close(); return; }

  await page.locator('input[name="username"]').fill(username);
  await sleep(800);
  await page.locator('input[name="password"]').fill(password);
  await sleep(800);
  await page.locator('button[type="submit"]').first().click();
  await sleep(1000);

  const dashboardReady = await waitForCondition(async () => ({
    ok: page.url().includes('/dashboard'),
    url: page.url(),
    title: await page.title(),
  }), { tries: 15, delayMs: 1000, label: 'dashboard ready' });
  console.log('[diag] dashboard ready:', JSON.stringify(dashboardReady, null, 2));
  if (!dashboardReady.ok) { await context.close(); return; }

  await page.goto('https://panel.pixnet.tw/posts', { waitUntil: 'domcontentloaded' });
  await sleep(1000);

  const postsReady = await waitForCondition(async () => {
    const url = page.url();
    const body = (await page.locator('body').innerText().catch(() => '')).slice(0, 1500);
    return {
      ok: url.startsWith('https://panel.pixnet.tw/posts') && body.includes('我的文章') && body.includes('寫文章'),
      url,
      title: await page.title(),
      body,
    };
  }, { tries: 15, delayMs: 1000, label: 'posts ready' });
  console.log('[diag] posts ready:', JSON.stringify(postsReady, null, 2));
  if (!postsReady.ok) { await context.close(); return; }

  const writeButton = page.getByText('寫文章', { exact: true }).first();
  const writeVisible = await writeButton.isVisible().catch(() => false);
  console.log('[diag] write button visible:', writeVisible);
  if (!writeVisible) {
    console.log('[diag] fail hop = write-button-not-visible');
    await context.close();
    return;
  }

  await writeButton.scrollIntoViewIfNeeded();
  await sleep(1000);
  await writeButton.click();
  await sleep(1000);

  const createCheck = await waitForCondition(async () => {
    const url = page.url();
    const start = page.getByRole('button', { name: /開始寫文章/ }).first();
    const startVisible = await start.isVisible().catch(() => false);
    const body = (await page.locator('body').innerText().catch(() => '')).slice(0, 1600);
    return {
      ok: url.startsWith('https://panel.pixnet.tw/posts/create') && startVisible,
      url,
      title: await page.title(),
      startVisible,
      body,
    };
  }, { tries: 20, delayMs: 1000, label: 'create check' });
  console.log('[diag] create check:', JSON.stringify(createCheck, null, 2));
  if (!createCheck.ok) {
    console.log('[diag] fail hop = after-write-click');
    await context.close();
    return;
  }

  const startButton = page.getByRole('button', { name: /開始寫文章/ }).first();
  await startButton.scrollIntoViewIfNeeded();
  await sleep(1000);
  await startButton.click();
  await sleep(1000);

  const editorCheck = await waitForCondition(async () => {
    const url = page.url();
    const body = (await page.locator('body').innerText().catch(() => '')).slice(0, 2200);
    const labelVisible = await page.locator('label').filter({ hasText: '文章個人分類' }).first().isVisible().catch(() => false);
    return {
      ok: /^https:\/\/panel\.pixnet\.tw\/posts\/\d+$/.test(url) && labelVisible,
      url,
      title: await page.title(),
      labelVisible,
      body,
    };
  }, { tries: 25, delayMs: 1000, label: 'editor check' });
  console.log('[diag] editor check:', JSON.stringify(editorCheck, null, 2));
  if (!editorCheck.ok) {
    console.log('[diag] fail hop = after-start-click');
    await context.close();
    return;
  }

  console.log('[diag] success hop = editor-ready');
  await sleep(8000);
  await context.close();
})();
