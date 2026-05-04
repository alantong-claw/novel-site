const { chromium } = require('playwright');
const path = require('path');
const pixnetPaths = require('/home/alantong/ai-work/scripts/pixnet_paths');
const { waitForCondition } = require('./pixnet-upload-helper');
const { openExistingPostEditor, sleep } = require('./pixnet-edit-helper');

const postId = process.argv[2];
const currentTitle = process.argv[3];
const desiredTitle = process.argv[4];
const badTag = process.argv[5];
const goodTag = process.argv[6];
const publicUrl = process.argv[7];

if (!postId || !currentTitle || !desiredTitle || !badTag || !goodTag || !publicUrl) {
  console.error('usage: node pixnet-fix-existing-post-title-tags.js <postId> <currentTitle> <desiredTitle> <badTag> <goodTag> <publicUrl>');
  process.exit(1);
}

(async () => {
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
    await openExistingPostEditor(page, `https://panel.pixnet.tw/posts/${postId}`, { expectedTitle: currentTitle });

    const titleInput = page.locator('textarea[name="title"], #文章標題').first();
    await titleInput.fill(desiredTitle);
    await sleep(1000);
    const readback = await titleInput.inputValue();
    if (readback !== desiredTitle) throw new Error(`title-readback-mismatch:${readback}`);

    const badTagChip = page.locator('text=' + badTag).first();
    if (await badTagChip.isVisible().catch(() => false)) {
      const removeButton = badTagChip.locator('xpath=ancestor::*[contains(@class,"tag") or self::*]//*[name()="svg" or @role="button" or self::button]').last();
      await removeButton.click({ force: true }).catch(async () => {
        await badTagChip.click({ force: true });
        await page.keyboard.press('Backspace');
      });
      await sleep(800);
    }

    const tagInput = page.locator('input[placeholder="+ 新增標籤"]').first();
    await tagInput.click();
    await sleep(200);
    await tagInput.fill(goodTag);
    await sleep(200);
    await page.keyboard.press('Enter');
    await sleep(800);

    await page.getByText('發布', { exact: true }).first().click();
    await sleep(1000);
    const published = await waitForCondition(async () => {
      const body = (await page.locator('body').innerText().catch(() => '')).slice(0, 12000);
      return { ok: page.url().startsWith('https://panel.pixnet.tw/posts') && body.includes(desiredTitle) };
    }, { tries: 25, delayMs: 1000 });
    if (!published.ok) throw new Error('retitle-retag-not-verified');

    await page.goto(publicUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await sleep(3000);
    const check = await page.evaluate(() => ({
      body: (document.body.innerText || '').slice(0, 5000)
    }));
    if (!check.body.includes(desiredTitle)) throw new Error('public-title-not-found');
    if (!check.body.includes(goodTag)) throw new Error('public-tag-not-found');
    if (check.body.includes(badTag)) throw new Error('bad-tag-still-present');
    console.log(JSON.stringify({ success: true, publicUrl, desiredTitle, goodTag }, null, 2));
  } finally {
    await context.close();
  }
})();
