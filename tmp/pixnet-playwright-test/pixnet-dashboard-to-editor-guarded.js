const { chromium } = require('playwright');
const path = require('path');
const pixnetPaths = require('/home/alantong/ai-work/scripts/pixnet_paths');

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitForCondition(checkFn, { tries = 15, delayMs = 1000, tag = 'check' } = {}) {
  let last = null;
  for (let i = 0; i < tries; i++) {
    last = await checkFn();
    if (last && last.ok) return last;
    await sleep(delayMs);
  }
  return last || { ok: false, tag };
}

(async () => {
  const userDataDir = pixnetPaths.userDataDir;
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
    const u = page.locator('input[name="username"]').first();
    const p = page.locator('input[name="password"]').first();
    const s = page.locator('button[type="submit"]').first();
    return { ok: await u.isVisible().catch(() => false) && await p.isVisible().catch(() => false) && await s.isVisible().catch(() => false), url: page.url(), title: await page.title() };
  }, { tries: 10, delayMs: 1000, tag: 'login-ready' });
  console.log('[flow] login ready:', JSON.stringify(loginReady, null, 2));
  if (!loginReady.ok) { await context.close(); return; }

  await page.locator('input[name="username"]').fill(username);
  await sleep(800);
  await page.locator('input[name="password"]').fill(password);
  await sleep(800);
  await page.locator('button[type="submit"]').first().click();
  await sleep(1000);

  const dashboardReady = await waitForCondition(async () => {
    const body = (await page.locator('body').innerText().catch(() => '')).slice(0, 1500);
    const ok = page.url().includes('/dashboard') && body.includes('前往部落格後台');
    return { ok, url: page.url(), title: await page.title(), body };
  }, { tries: 15, delayMs: 1000, tag: 'dashboard-ready' });
  console.log('[flow] dashboard ready:', JSON.stringify(dashboardReady, null, 2));
  if (!dashboardReady.ok) { await context.close(); return; }

  const panelLink = page.getByText('前往部落格後台', { exact: true }).first();
  await panelLink.scrollIntoViewIfNeeded();
  await sleep(1000);
  await panelLink.click();
  await sleep(1000);

  const panelReady = await waitForCondition(async () => {
    const body = (await page.locator('body').innerText().catch(() => '')).slice(0, 2000);
    const ok = /panel\.pixnet\.tw/.test(page.url()) && body.includes('文章');
    return { ok, url: page.url(), title: await page.title(), body };
  }, { tries: 20, delayMs: 1000, tag: 'panel-ready' });
  console.log('[flow] panel ready:', JSON.stringify(panelReady, null, 2));
  if (!panelReady.ok) { await context.close(); return; }

  const articleNav = page.getByText('文章', { exact: true }).first();
  await articleNav.scrollIntoViewIfNeeded();
  await sleep(1000);
  await articleNav.click();
  await sleep(1000);

  const writeReady = await waitForCondition(async () => {
    const target = page.getByText('寫文章', { exact: true }).first();
    const visible = await target.isVisible().catch(() => false);
    return {
      ok: visible,
      url: page.url(),
      title: await page.title(),
      body: visible ? undefined : (await page.locator('body').innerText().catch(() => '')).slice(0, 2000)
    };
  }, { tries: 20, delayMs: 1000, tag: 'write-ready' });
  console.log('[flow] write ready:', JSON.stringify(writeReady, null, 2));
  if (!writeReady.ok) { await context.close(); return; }

  const writeButton = page.getByText('寫文章', { exact: true }).first();
  await writeButton.scrollIntoViewIfNeeded();
  await sleep(1000);
  await writeButton.click();
  await sleep(1000);

  const createReady = await waitForCondition(async () => {
    const start = page.getByRole('button', { name: /開始寫文章/ }).first();
    const visible = await start.isVisible().catch(() => false);
    return {
      ok: visible,
      url: page.url(),
      title: await page.title(),
      body: visible ? undefined : (await page.locator('body').innerText().catch(() => '')).slice(0, 2000)
    };
  }, { tries: 20, delayMs: 1000, tag: 'create-ready' });
  console.log('[flow] create ready:', JSON.stringify(createReady, null, 2));
  if (!createReady.ok) { await context.close(); return; }

  const start = page.getByRole('button', { name: /開始寫文章/ }).first();
  await start.scrollIntoViewIfNeeded();
  await sleep(1000);
  await start.click();
  await sleep(1000);

  const editorReady = await waitForCondition(async () => {
    const label = page.locator('label').filter({ hasText: '文章個人分類' }).first();
    const visible = await label.isVisible().catch(() => false);
    return {
      ok: visible,
      url: page.url(),
      title: await page.title(),
      body: visible ? undefined : (await page.locator('body').innerText().catch(() => '')).slice(0, 2200)
    };
  }, { tries: 20, delayMs: 1000, tag: 'editor-ready' });
  console.log('[flow] editor ready:', JSON.stringify(editorReady, null, 2));

  await sleep(10000);
  await context.close();
})();
