const { chromium } = require('playwright');
const path = require('path');
const pixnetPaths = require('/home/alantong/ai-work/scripts/pixnet_paths');
const fs = require('fs');
const { openExistingPostEditor, sleep } = require('./pixnet-edit-helper');
const { waitForCondition } = require('./pixnet-upload-helper');

const postId = process.argv[2];
const expectedTitle = process.argv[3];
const imagePath = process.argv[4];
const publicUrl = process.argv[5];

if (!postId || !expectedTitle || !imagePath || !publicUrl) {
  console.error('usage: node pixnet-backfill-image-existing-post.js <postId> <expectedTitle> <imagePath> <publicUrl>');
  process.exit(1);
}
if (!fs.existsSync(imagePath)) {
  console.error(`image not found: ${imagePath}`);
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
    await openExistingPostEditor(page, `https://panel.pixnet.tw/posts/${postId}`, { expectedTitle });
    await sleep(1500);

    const contentArea = page.locator('.jodit-wysiwyg, .jodit-workplace, [contenteditable="true"]').first();
    await contentArea.click();
    await sleep(500);

    const beforeCount = await page.locator('.jodit-wysiwyg img[src*="pimg.1px.tw"], .jodit-workplace img[src*="pimg.1px.tw"], [contenteditable="true"] img[src*="pimg.1px.tw"]').count();

    const imageButton = page.locator('button[aria-label*="圖片"], button[aria-label*="image"], .jodit-toolbar-button[ref="image"]').first();
    await imageButton.click({ force: true });
    await sleep(1500);

    const fileInput = page.locator('input[type="file"]').last();
    await fileInput.setInputFiles(imagePath);
    await sleep(1500);

    const uploaded = await waitForCondition(async () => {
      const count = await page.locator('.jodit-wysiwyg img[src*="pimg.1px.tw"], .jodit-workplace img[src*="pimg.1px.tw"], [contenteditable="true"] img[src*="pimg.1px.tw"]').count();
      return { ok: count > beforeCount, count };
    }, { tries: 40, delayMs: 1000 });
    if (!uploaded.ok) throw new Error(`image-upload-not-confirmed:before=${beforeCount}`);

    await page.getByText('發布', { exact: true }).first().click();
    await page.waitForLoadState('domcontentloaded').catch(() => {});
    await sleep(1500);
    const republished = await waitForCondition(async () => {
      const body = (await page.locator('body').innerText().catch(() => '')).slice(0, 12000);
      return { ok: page.url().startsWith('https://panel.pixnet.tw/posts') && body.includes(expectedTitle) };
    }, { tries: 25, delayMs: 1000 });
    if (!republished.ok) throw new Error('republish-not-verified');

    await page.goto(publicUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await sleep(4000);
    const check = await page.evaluate(() => ({
      pimgs: [...document.querySelectorAll('img')].map(i => i.src).filter(s => s.includes('pimg.1px.tw')),
      html: document.body.innerHTML.slice(0, 15000)
    }));
    console.log(JSON.stringify({ success: true, publicUrl, pimgCount: check.pimgs.length, pimgs: check.pimgs }, null, 2));
  } finally {
    await context.close();
  }
})();
