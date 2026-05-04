const { chromium } = require('playwright');
const path = require('path');
const pixnetPaths = require('/home/alantong/ai-work/scripts/pixnet_paths');
const { uploadImageStrict, waitForCondition } = require('./pixnet-upload-helper');
const { openExistingPostEditor, sleep } = require('./pixnet-edit-helper');

const postId = process.argv[2];
const expectedTitle = process.argv[3];
const publicUrl = process.argv[4];
const imagePaths = process.argv.slice(5);

if (!postId || !expectedTitle || !publicUrl || imagePaths.length < 1) {
  console.error('usage: node pixnet-fix-existing-post-images.js <postId> <expectedTitle> <publicUrl> <image1> [image2 ...]');
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
    await openExistingPostEditor(page, postUrl, { expectedTitle });

    const uploadedSrcs = [];
    for (const imagePath of imagePaths) {
      const result = await uploadImageStrict(page, imagePath);
      if (result.newestPimgSrc) uploadedSrcs.push(result.newestPimgSrc);
      await sleep(1200);
    }

    await page.getByText('發布', { exact: true }).first().click();
    await page.waitForLoadState('domcontentloaded').catch(() => {});
    await sleep(1500);
    const published = await waitForCondition(async () => {
      const body = (await page.locator('body').innerText().catch(() => '')).slice(0, 12000);
      return { ok: page.url().startsWith('https://panel.pixnet.tw/posts') && body.includes(expectedTitle) };
    }, { tries: 25, delayMs: 1000 });
    if (!published.ok) throw new Error('republish-not-verified');

    await page.goto(publicUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await sleep(4000);
    const check = await page.evaluate(({ postId, uploadedSrcs }) => {
      const root = document.querySelector('.article-content') || document.querySelector('article') || document.body;
      const imgs = Array.from(root.querySelectorAll('img')).map(img => img.getAttribute('src') || '');
      const postImgs = imgs.filter(src => src.includes('pimg.1px.tw') && src.includes(`/post/${postId}/`));
      const matched = uploadedSrcs.filter(src => postImgs.includes(src));
      return { postImgs, matched, allImgs: imgs };
    }, { postId, uploadedSrcs });

    if (check.matched.length < uploadedSrcs.length) {
      throw new Error(`public-images-not-verified:expected=${uploadedSrcs.length}:matched=${check.matched.length}`);
    }

    console.log(JSON.stringify({ success: true, publicUrl, uploadedSrcs, ...check }, null, 2));
  } finally {
    await context.close();
  }
})();
