const { chromium } = require('playwright');
const path = require('path');
const pixnetPaths = require('/home/alantong/ai-work/scripts/pixnet_paths');
const { waitForCondition } = require('./pixnet-upload-helper');
const { uploadImageStrict, verifyPublicArticleImage } = require('./pixnet-upload-helper');

function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

async function setDropdown(page, labelText, value, searchable) {
  const label = page.locator('label').filter({ hasText: labelText }).first();
  const fieldGroup = label.locator('xpath=ancestor::*[@role="group"][1]');
  const combo = fieldGroup.getByRole('combobox').first();
  await combo.scrollIntoViewIfNeeded();
  await sleep(300);
  await combo.click();
  await sleep(600);
  if (searchable) {
    const search = page.getByPlaceholder('搜尋...').last();
    await search.waitFor({ state: 'visible', timeout: 10000 });
    await search.fill(value);
    await sleep(600);
  }
  const option = page.locator('[role="option"], [cmdk-item]').filter({ hasText: value }).first();
  await option.waitFor({ state: 'visible', timeout: 10000 });
  await option.click();
  await sleep(800);
}

async function setupEditor(page) {
  await page.goto('https://account.pixnet.tw/login', { waitUntil: 'domcontentloaded' });
  await sleep(1000);
  const username = page.locator('input[name="username"]');
  if (await username.isVisible().catch(() => false)) {
    await username.fill('alantong');
    await sleep(500);
    await page.locator('input[name="password"]').fill('xxxx3721?!');
    await sleep(500);
    await page.locator('button[type="submit"]').first().click();
    await sleep(2500);
  }
  await page.goto('https://panel.pixnet.tw/posts', { waitUntil: 'domcontentloaded' });
  await sleep(1000);
  await page.getByText('寫文章', { exact: true }).first().click();
  await sleep(1000);
  const start = page.getByRole('button', { name: /開始寫文章/ }).first();
  await start.waitFor({ state: 'visible', timeout: 15000 });
  await start.click({ force: true });
  await sleep(2000);
  const titleInput = page.locator('textarea[name="title"], #文章標題').first();
  await titleInput.waitFor({ state: 'visible', timeout: 15000 });
}

(async () => {
  const title = '[Whisky][Scotland/Speyside] Benromach / Contrast/Air Dried Oak(風乾) / 11 Yr';
  const img1 = '/mnt/g/TMP/whisky_photo/100_Benromach_Contrast_1_claw.jpg';
  const img2 = '/mnt/g/TMP/whisky_photo/100_Benromach_Contrast_2_claw.jpg';
  const userDataDir = pixnetPaths.userDataDir;
  const context = await chromium.launchPersistentContext(userDataDir, {
    headless: false,
    executablePath: '/snap/bin/chromium',
    env: { ...process.env, XDG_RUNTIME_DIR: '/run/user/1000', WAYLAND_DISPLAY: 'wayland-0', DISPLAY: ':0' },
    args: ['--no-sandbox'],
    viewport: { width: 1400, height: 960 },
  });
  try {
    const page = context.pages()[0] || await context.newPage();
    await setupEditor(page);

    const titleInput = page.locator('textarea[name="title"], #文章標題').first();
    await titleInput.fill(title);
    await sleep(500);

    await setDropdown(page, '文章個人分類', 'Whisky', true);
    await setDropdown(page, '文章全站分類 (主要)', '美味食記', true);
    await setDropdown(page, '文章全站分類 (次要)', '生活綜合', true);
    await setDropdown(page, '文章閱讀權限', '公開', false);
    await setDropdown(page, '文章留言權限', '可留言，留言公開', false);

    const tagInput = page.locator('input[placeholder="+ 新增標籤"]').first();
    for (const tag of ['Whisky', 'Scotland', 'Speyside', 'Benromach', 'Contrast/Air Dried Oak(風乾)', '11']) {
      await tagInput.click();
      await sleep(150);
      await tagInput.fill(tag);
      await sleep(150);
      await page.keyboard.press('Enter');
      await sleep(400);
    }

    const r1 = await uploadImageStrict(page, img1);
    await sleep(1000);
    await page.locator('.jodit-wysiwyg, .jodit-workplace, [contenteditable="true"]').first().click();
    await page.keyboard.press('Enter');
    await sleep(400);
    const r2 = await uploadImageStrict(page, img2);
    await sleep(1000);

    await page.getByText('發布', { exact: true }).first().click();
    await sleep(1000);
    const published = await waitForCondition(async () => {
      const body = (await page.locator('body').innerText().catch(() => '')).slice(0, 12000);
      return { ok: page.url().startsWith('https://panel.pixnet.tw/posts') && body.includes(title), body };
    }, { tries: 25, delayMs: 1000 });
    if (!published.ok) throw new Error('publish-not-verified');

    const postUrl = await page.locator('a[href^="https://alantong.pixnet.net/blog/posts/"]').first().getAttribute('href');
    const postIdMatch = postUrl.match(/\/blog\/posts\/(\d+)/);
    const postId = postIdMatch ? postIdMatch[1] : '';
    const publicCheck = await verifyPublicArticleImage(page, postUrl, postId, '');
    console.log(JSON.stringify({ success: true, postUrl, r1, r2, publicCheck }, null, 2));
  } finally {
    await context.close();
  }
})();
