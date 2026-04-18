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

  await page.locator('input[name="username"]').fill(username);
  await sleep(800);
  await page.locator('input[name="password"]').fill(password);
  await sleep(800);
  await page.locator('button[type="submit"]').first().click();
  await sleep(1000);

  const dashboardReady = await waitForCondition(async () => ({ ok: page.url().includes('/dashboard') }), { tries: 15, delayMs: 1000 });
  if (!dashboardReady.ok) {
    console.log(JSON.stringify({ stage: 'login', failure: 'did-not-reach-dashboard', url: page.url(), title: await page.title() }, null, 2));
    await context.close();
    return;
  }

  await page.goto('https://panel.pixnet.tw/posts', { waitUntil: 'domcontentloaded' });
  await sleep(1000);

  const postsReady = await waitForCondition(async () => {
    const body = (await page.locator('body').innerText().catch(() => '')).slice(0, 1500);
    return { ok: page.url().startsWith('https://panel.pixnet.tw/posts') && body.includes('我的文章') && body.includes('寫文章') };
  }, { tries: 15, delayMs: 1000 });
  if (!postsReady.ok) {
    console.log(JSON.stringify({ stage: 'posts', failure: 'did-not-reach-posts', url: page.url(), title: await page.title(), body: (await page.locator('body').innerText().catch(() => '')).slice(0, 1500) }, null, 2));
    await context.close();
    return;
  }

  const writeButton = page.getByText('寫文章', { exact: true }).first();
  await writeButton.click();
  await sleep(1000);

  const createReady = await waitForCondition(async () => {
    const start = page.getByRole('button', { name: /開始寫文章/ }).first();
    return { ok: page.url().startsWith('https://panel.pixnet.tw/posts/create') && await start.isVisible().catch(() => false) };
  }, { tries: 20, delayMs: 1000 });
  if (!createReady.ok) {
    console.log(JSON.stringify({ stage: 'create', failure: 'after-write-click', url: page.url(), title: await page.title(), body: (await page.locator('body').innerText().catch(() => '')).slice(0, 1600) }, null, 2));
    await context.close();
    return;
  }

  const startButton = page.getByRole('button', { name: /開始寫文章/ }).first();
  await startButton.click();
  await sleep(1000);

  const editorReady = await waitForCondition(async () => {
    const label = page.locator('label').filter({ hasText: '文章個人分類' }).first();
    return { ok: /^https:\/\/panel\.pixnet\.tw\/posts\/\d+$/.test(page.url()) && await label.isVisible().catch(() => false) };
  }, { tries: 25, delayMs: 1000 });
  if (!editorReady.ok) {
    console.log(JSON.stringify({ stage: 'editor', failure: 'after-start-click', url: page.url(), title: await page.title(), body: (await page.locator('body').innerText().catch(() => '')).slice(0, 2200) }, null, 2));
    await context.close();
    return;
  }

  const categoryLabel = page.locator('label').filter({ hasText: '文章個人分類' }).first();
  const fieldGroup = categoryLabel.locator('xpath=ancestor::*[@role="group"][1]');
  const combo = fieldGroup.getByRole('combobox').first();
  const beforeText = (await combo.innerText()).trim();

  await combo.scrollIntoViewIfNeeded();
  await sleep(1000);
  await combo.click();
  await sleep(1000);

  const searchReady = await waitForCondition(async () => {
    const search = page.getByPlaceholder('搜尋...').last();
    return { ok: await search.isVisible().catch(() => false) };
  }, { tries: 10, delayMs: 1000 });
  if (!searchReady.ok) {
    console.log(JSON.stringify({ stage: 'whisky', failure: 'search-open-fail', beforeText, url: page.url(), title: await page.title(), body: (await page.locator('body').innerText().catch(() => '')).slice(0, 2200) }, null, 2));
    await context.close();
    return;
  }

  const search = page.getByPlaceholder('搜尋...').last();
  await search.fill('Whisky');
  await sleep(1000);

  const optionReady = await waitForCondition(async () => {
    const whisky = page.locator('[role="option"], [cmdk-item]').filter({ hasText: 'Whisky' }).first();
    const visible = await whisky.isVisible().catch(() => false);
    return { ok: visible, text: visible ? (await whisky.innerText()).trim() : null };
  }, { tries: 10, delayMs: 1000 });
  if (!optionReady.ok) {
    console.log(JSON.stringify({ stage: 'whisky', failure: 'search-no-result', beforeText, url: page.url(), title: await page.title(), body: (await page.locator('body').innerText().catch(() => '')).slice(0, 2400) }, null, 2));
    await context.close();
    return;
  }

  const whisky = page.locator('[role="option"], [cmdk-item]').filter({ hasText: 'Whisky' }).first();
  await whisky.scrollIntoViewIfNeeded();
  await sleep(1000);
  await whisky.click();
  await sleep(1000);

  const readback = await waitForCondition(async () => {
    const text = (await combo.innerText().catch(() => '')).trim();
    return { ok: text.length > 0, text, html: await combo.evaluate(el => el.outerHTML).catch(() => null) };
  }, { tries: 10, delayMs: 1000 });

  const afterText = readback.text || '';
  const result = {
    stage: 'whisky',
    beforeText,
    optionText: optionReady.text,
    afterText,
    html: readback.html,
    url: page.url(),
    title: await page.title(),
  };

  if (afterText.includes('Whisky')) {
    result.success = true;
    result.classification = 'selected-and-readback-ok';
  } else if (afterText && afterText !== beforeText) {
    result.success = false;
    result.classification = 'clicked-but-wrong-readback';
  } else if (afterText === beforeText) {
    result.success = false;
    result.classification = 'clicked-but-no-readback-change';
  } else {
    result.success = false;
    result.classification = 'readback-failed';
  }

  console.log(JSON.stringify(result, null, 2));
  await sleep(8000);
  await context.close();
})();
