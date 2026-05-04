const { chromium } = require('playwright');
const path = require('path');
const pixnetPaths = require('/home/alantong/ai-work/scripts/pixnet_paths');

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

async function setupEditor(page) {
  await page.goto('https://account.pixnet.tw/login', { waitUntil: 'domcontentloaded' });
  await sleep(1000);
  await page.locator('input[name="username"]').fill('alantong');
  await sleep(800);
  await page.locator('input[name="password"]').fill('xxxx3721?!');
  await sleep(800);
  await page.locator('button[type="submit"]').first().click();
  await sleep(1000);

  const dashboardReady = await waitForCondition(async () => ({ ok: page.url().includes('/dashboard') }), { tries: 15, delayMs: 1000 });
  if (!dashboardReady.ok) throw new Error('did-not-reach-dashboard');

  await page.goto('https://panel.pixnet.tw/posts', { waitUntil: 'domcontentloaded' });
  await sleep(1000);
  const postsReady = await waitForCondition(async () => {
    const body = (await page.locator('body').innerText().catch(() => '')).slice(0, 1500);
    return { ok: page.url().startsWith('https://panel.pixnet.tw/posts') && body.includes('我的文章') && body.includes('寫文章') };
  }, { tries: 15, delayMs: 1000 });
  if (!postsReady.ok) throw new Error('did-not-reach-posts');

  await page.getByText('寫文章', { exact: true }).first().click();
  await sleep(1000);
  const createReady = await waitForCondition(async () => {
    const start = page.getByRole('button', { name: /開始寫文章/ }).first();
    return { ok: page.url().startsWith('https://panel.pixnet.tw/posts/create') && await start.isVisible().catch(() => false) };
  }, { tries: 20, delayMs: 1000 });
  if (!createReady.ok) throw new Error('did-not-reach-create');

  await page.getByRole('button', { name: /開始寫文章/ }).first().click();
  await sleep(1000);
  const editorReady = await waitForCondition(async () => {
    const label = page.locator('label').filter({ hasText: '文章個人分類' }).first();
    return { ok: /^https:\/\/panel\.pixnet\.tw\/posts\/\d+$/.test(page.url()) && await label.isVisible().catch(() => false) };
  }, { tries: 25, delayMs: 1000 });
  if (!editorReady.ok) throw new Error('did-not-reach-editor');
}

async function setDropdown(page, { labelText, value, searchable }) {
  const label = page.locator('label').filter({ hasText: labelText }).first();
  const fieldGroup = label.locator('xpath=ancestor::*[@role="group"][1]');
  const combo = fieldGroup.getByRole('combobox').first();
  const beforeText = (await combo.innerText()).trim();

  await combo.scrollIntoViewIfNeeded();
  await sleep(1000);
  await combo.click();
  await sleep(1000);

  if (searchable) {
    const searchReady = await waitForCondition(async () => {
      const search = page.getByPlaceholder('搜尋...').last();
      return { ok: await search.isVisible().catch(() => false) };
    }, { tries: 10, delayMs: 1000, label: 'search-open' });
    if (!searchReady.ok) {
      return { labelText, value, beforeText, success: false, classification: 'search-open-fail' };
    }
    const search = page.getByPlaceholder('搜尋...').last();
    await search.fill(value);
    await sleep(1000);
  }

  const optionReady = await waitForCondition(async () => {
    const option = page.locator('[role="option"], [cmdk-item]').filter({ hasText: value }).first();
    const visible = await option.isVisible().catch(() => false);
    return { ok: visible, optionText: visible ? (await option.innerText()).trim() : null };
  }, { tries: 10, delayMs: 1000, label: 'option-visible' });

  if (!optionReady.ok) {
    return { labelText, value, beforeText, success: false, classification: searchable ? 'search-no-result' : 'option-not-found' };
  }

  const option = page.locator('[role="option"], [cmdk-item]').filter({ hasText: value }).first();
  await option.scrollIntoViewIfNeeded();
  await sleep(1000);
  await option.click();
  await sleep(1000);

  const readback = await waitForCondition(async () => {
    const text = (await combo.innerText().catch(() => '')).trim();
    return { ok: text.length > 0, text, html: await combo.evaluate(el => el.outerHTML).catch(() => null) };
  }, { tries: 10, delayMs: 1000, label: 'readback' });

  const afterText = readback.text || '';
  let classification = 'readback-failed';
  let success = false;
  if (afterText.includes(value)) {
    classification = 'selected-and-readback-ok';
    success = true;
  } else if (afterText && afterText !== beforeText) {
    classification = 'clicked-but-wrong-readback';
  } else if (afterText === beforeText) {
    classification = 'clicked-but-no-readback-change';
  }

  return {
    labelText,
    value,
    beforeText,
    optionText: optionReady.optionText,
    afterText,
    html: readback.html,
    success,
    classification,
  };
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
  await setupEditor(page);

  const results = [];
  results.push(await setDropdown(page, { labelText: '文章個人分類', value: 'Whisky', searchable: true }));
  results.push(await setDropdown(page, { labelText: '文章全站分類 (主要)', value: '美味食記', searchable: true }));
  results.push(await setDropdown(page, { labelText: '文章全站分類 (次要)', value: '生活綜合', searchable: true }));
  results.push(await setDropdown(page, { labelText: '文章閱讀權限', value: '公開', searchable: false }));
  results.push(await setDropdown(page, { labelText: '文章留言權限', value: '可留言，留言公開', searchable: false }));

  console.log(JSON.stringify({ url: page.url(), title: await page.title(), results }, null, 2));
  await sleep(8000);
  await context.close();
})();
