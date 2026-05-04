const { chromium } = require('playwright');
const path = require('path');
const pixnetPaths = require('/home/alantong/ai-work/scripts/pixnet_paths');
const { uploadImageStrict, waitForCondition } = require('./pixnet-upload-helper');
const { openExistingPostEditor, sleep } = require('./pixnet-edit-helper');

const postUrl = 'https://panel.pixnet.tw/posts/887193412955084920';
const publicUrl = 'https://alantong.pixnet.net/blog/posts/887193412955084920';
const imagePath = '/mnt/g/TMP/whisky_photo/071_Arbikie_claw.jpg';
const expectedTitle = '[Whisky][Scotland] Arbikie Distillery / 1794';

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

    await uploadImageStrict(page, imagePath);
    await sleep(1000);

    await page.getByText('發布', { exact: true }).first().click();
    await sleep(1000);
    const published = await waitForCondition(async () => {
      const body = (await page.locator('body').innerText().catch(() => '')).slice(0, 12000);
      return { ok: page.url().startsWith('https://panel.pixnet.tw/posts') && body.includes(expectedTitle) };
    }, { tries: 25, delayMs: 1000 });
    if (!published.ok) throw new Error('republish-not-verified');

    await page.goto(publicUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await sleep(3000);
    const check = await page.evaluate(() => {
      const imgs = Array.from(document.querySelectorAll('img')).map(img => img.getAttribute('src') || '');
      return { pimgCount: imgs.filter(src => src.includes('pimg.1px.tw')).length };
    });
    console.log(JSON.stringify({ success: true, publicUrl, ...check }, null, 2));
  } finally {
    await context.close();
  }
})();
