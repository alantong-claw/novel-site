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

async function setTag(page, tagText) {
  const tagInput = page.locator('input[placeholder="+ 新增標籤"]').first();
  const beforeBody = (await page.locator('body').innerText().catch(() => '')).slice(0, 2200);
  const beforePresent = beforeBody.includes(tagText);

  const visible = await tagInput.isVisible().catch(() => false);
  if (!visible) {
    return { success: false, classification: 'tag-input-not-visible', tagText, beforePresent };
  }

  await tagInput.scrollIntoViewIfNeeded();
  await sleep(1000);
  await tagInput.click();
  await sleep(500);
  await tagInput.fill(tagText);
  await sleep(500);
  await page.keyboard.press('Enter');
  await sleep(1000);

  const readback = await waitForCondition(async () => {
    const body = (await page.locator('body').innerText().catch(() => '')).slice(0, 2600);
    const inputValue = await tagInput.inputValue().catch(() => '');
    return {
      ok: body.includes(tagText),
      body,
      inputValue,
    };
  }, { tries: 10, delayMs: 1000, label: 'tag-readback' });

  return {
    tagText,
    beforePresent,
    inputValueAfter: readback.inputValue,
    success: !!readback.ok,
    classification: readback.ok ? 'tag-added-and-visible' : 'tag-enter-no-visible-readback',
    bodySnippet: readback.body,
  };
}

async function publishAndVerify(page, expectedTitle) {
  const publishButton = page.getByText('發布', { exact: true }).first();
  const visible = await publishButton.isVisible().catch(() => false);
  if (!visible) {
    return { success: false, classification: 'publish-button-not-visible', expectedTitle };
  }

  const beforeUrl = page.url();
  await publishButton.scrollIntoViewIfNeeded();
  await sleep(1000);
  await publishButton.click();
  await sleep(1000);

  const result = await waitForCondition(async () => {
    const url = page.url();
    const body = (await page.locator('body').innerText().catch(() => '')).slice(0, 4000);
    const atPosts = url.startsWith('https://panel.pixnet.tw/posts');
    const foundTitle = body.includes(expectedTitle);
    return {
      ok: atPosts && foundTitle,
      url,
      body,
      foundTitle,
    };
  }, { tries: 20, delayMs: 1000, label: 'publish-readback' });

  let classification = 'publish-unknown';
  if (result.ok) classification = 'publish-returned-to-posts-and-title-found';
  else if (result.url && result.url.startsWith('https://panel.pixnet.tw/posts')) classification = 'returned-to-posts-but-title-not-found';
  else classification = 'publish-click-no-return-to-posts';

  return {
    expectedTitle,
    beforeUrl,
    afterUrl: result.url,
    foundTitle: result.foundTitle,
    success: !!result.ok,
    classification,
    bodySnippet: result.body,
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

  const titleText = `OpenClaw tag/publish probe ${Date.now()}`;
  const titleInput = page.locator('textarea[name="title"], #文章標題').first();
  await titleInput.waitFor({ state: 'visible', timeout: 15000 });
  await titleInput.fill(titleText);
  await sleep(1000);

  const tagResult = await setTag(page, 'Whisky');
  const publishResult = await publishAndVerify(page, titleText);

  console.log(JSON.stringify({
    editorUrl: page.url(),
    titleText,
    tagResult,
    publishResult,
  }, null, 2));

  await sleep(8000);
  await context.close();
})();
