const { chromium } = require('playwright');
const path = require('path');
const pixnetPaths = require('/home/alantong/ai-work/scripts/pixnet_paths');
const { waitForCondition } = require('./pixnet-upload-helper');
const { openExistingPostEditor, sleep } = require('./pixnet-edit-helper');

const postId = process.argv[2];
const currentTitle = process.argv[3];
const desiredTitle = process.argv[4];
const publicUrl = process.argv[5];

if (!postId || !currentTitle || !desiredTitle || !publicUrl) {
  console.error('usage: node pixnet-fix-existing-post-title.js <postId> <currentTitle> <desiredTitle> <publicUrl>');
  process.exit(1);
}

const postUrl = `https://panel.pixnet.tw/posts/${postId}`;

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
    await openExistingPostEditor(page, postUrl, { expectedTitle: currentTitle });

    const titleInput = page.locator('textarea[name="title"], #文章標題').first();
    await titleInput.fill(desiredTitle);
    await sleep(1000);
    const readback = await titleInput.inputValue();
    if (readback !== desiredTitle) throw new Error(`title-readback-mismatch:${readback}`);

    await page.getByText('發布', { exact: true }).first().click();
    await sleep(1000);
    const published = await waitForCondition(async () => {
      const body = (await page.locator('body').innerText().catch(() => '')).slice(0, 12000);
      return { ok: page.url().startsWith('https://panel.pixnet.tw/posts') && body.includes(desiredTitle) };
    }, { tries: 25, delayMs: 1000 });
    if (!published.ok) throw new Error('retitle-not-verified');

    await page.goto(publicUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await sleep(3000);
    const check = await page.evaluate(() => ({
      title: (document.querySelector('title')?.innerText || document.title || '').trim(),
      body: (document.body.innerText || '').slice(0, 4000)
    }));
    if (!check.body.includes(desiredTitle)) throw new Error('public-title-not-found');
    console.log(JSON.stringify({ success: true, publicUrl, desiredTitle, ...check }, null, 2));
  } finally {
    await context.close();
  }
})();
