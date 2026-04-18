const { chromium } = require('playwright');
const path = require('path');

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitForCondition(checkFn, { tries = 15, delayMs = 1000, label = 'condition' } = {}) {
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
  await page.goto('https://panel.pixnet.tw/posts', { waitUntil: 'domcontentloaded' });
  await sleep(1000);

  const writeReady = await waitForCondition(async () => {
    const byText = page.getByText('寫文章', { exact: true }).first();
    const visible = await byText.isVisible().catch(() => false);
    return {
      ok: visible,
      stage: 'posts',
      url: page.url(),
      title: await page.title(),
      visible,
      body: visible ? undefined : (await page.locator('body').innerText().catch(() => '')).slice(0, 1200)
    };
  }, { tries: 20, delayMs: 1000, label: '寫文章 visible' });

  console.log('[step3] posts check:', JSON.stringify(writeReady, null, 2));
  if (!writeReady.ok) {
    await context.close();
    return;
  }

  const writeLink = page.getByText('寫文章', { exact: true }).first();
  await writeLink.scrollIntoViewIfNeeded();
  await sleep(1000);
  await writeLink.click();
  await sleep(1000);

  const createReady = await waitForCondition(async () => {
    const startButton = page.getByRole('button', { name: /開始寫文章/ }).first();
    const visible = await startButton.isVisible().catch(() => false);
    return {
      ok: visible,
      stage: 'create',
      url: page.url(),
      title: await page.title(),
      visible,
      body: visible ? undefined : (await page.locator('body').innerText().catch(() => '')).slice(0, 1200)
    };
  }, { tries: 20, delayMs: 1000, label: '開始寫文章 visible' });

  console.log('[step3] create check:', JSON.stringify(createReady, null, 2));
  if (!createReady.ok) {
    await context.close();
    return;
  }

  const startButton = page.getByRole('button', { name: /開始寫文章/ }).first();
  await startButton.scrollIntoViewIfNeeded();
  await sleep(1000);
  await startButton.click();
  await sleep(1000);

  const editorReady = await waitForCondition(async () => {
    const label = page.locator('label').filter({ hasText: '文章個人分類' }).first();
    const visible = await label.isVisible().catch(() => false);
    return {
      ok: visible,
      stage: 'editor',
      url: page.url(),
      title: await page.title(),
      visible,
      body: visible ? undefined : (await page.locator('body').innerText().catch(() => '')).slice(0, 1600)
    };
  }, { tries: 20, delayMs: 1000, label: '文章個人分類 visible' });

  console.log('[step3] editor check:', JSON.stringify(editorReady, null, 2));
  if (!editorReady.ok) {
    await context.close();
    return;
  }

  const categoryLabel = page.locator('label').filter({ hasText: '文章個人分類' }).first();
  const fieldGroup = categoryLabel.locator('xpath=ancestor::*[@role="group"][1]');
  const combo = fieldGroup.getByRole('combobox').first();

  console.log('[step3] combo before:', (await combo.innerText()).trim());
  await combo.scrollIntoViewIfNeeded();
  await sleep(1000);
  await combo.click();
  await sleep(1000);

  const searchReady = await waitForCondition(async () => {
    const search = page.getByPlaceholder('搜尋...').last();
    const visible = await search.isVisible().catch(() => false);
    return { ok: visible, stage: 'search-open', visible };
  }, { tries: 10, delayMs: 1000, label: '搜尋 input visible' });

  console.log('[step3] search check:', JSON.stringify(searchReady, null, 2));
  if (!searchReady.ok) {
    await context.close();
    return;
  }

  const search = page.getByPlaceholder('搜尋...').last();
  await search.fill('Whisky');
  await sleep(1000);

  const optionReady = await waitForCondition(async () => {
    const whisky = page.locator('[role="option"], [cmdk-item]').filter({ hasText: 'Whisky' }).first();
    const visible = await whisky.isVisible().catch(() => false);
    return {
      ok: visible,
      stage: 'whisky-option',
      visible,
      text: visible ? (await whisky.innerText()).trim() : null
    };
  }, { tries: 10, delayMs: 1000, label: 'Whisky option visible' });

  console.log('[step3] option check:', JSON.stringify(optionReady, null, 2));
  if (!optionReady.ok) {
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
    return {
      ok: text.length > 0,
      stage: 'readback',
      text,
      html: await combo.evaluate(el => el.outerHTML).catch(() => null)
    };
  }, { tries: 10, delayMs: 1000, label: 'combo readback' });

  console.log('[step3] readback:', JSON.stringify(readback, null, 2));
  await sleep(8000);
  await context.close();
})();
