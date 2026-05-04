const { chromium } = require('playwright');
const path = require('path');
const pixnetPaths = require('/home/alantong/ai-work/scripts/pixnet_paths');
const { uploadImageStrict } = require('./pixnet-upload-helper');
const { openExistingPostEditor, sleep } = require('./pixnet-edit-helper');

(async () => {
  const postId = '889669161909817766';
  const expectedTitle = '[Whisky][Scotland/Speyside] Benromach / Contrast/Air Dried Oak(風乾) / 11 Yr';
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
    await openExistingPostEditor(page, `https://panel.pixnet.tw/posts/${postId}`, { expectedTitle });
    const before = await page.locator('.jodit-wysiwyg img[src*="pimg.1px.tw"], .jodit-workplace img[src*="pimg.1px.tw"], .jodit-container img[src*="pimg.1px.tw"]').evaluateAll(nodes => nodes.map(n => n.getAttribute('src') || '')).catch(() => []);
    const r1 = await uploadImageStrict(page, img1);
    await sleep(1000);
    const after1 = await page.locator('.jodit-wysiwyg img[src*="pimg.1px.tw"], .jodit-workplace img[src*="pimg.1px.tw"], .jodit-container img[src*="pimg.1px.tw"]').evaluateAll(nodes => nodes.map(n => n.getAttribute('src') || '')).catch(() => []);
    const r2 = await uploadImageStrict(page, img2);
    await sleep(1000);
    const after2 = await page.locator('.jodit-wysiwyg img[src*="pimg.1px.tw"], .jodit-workplace img[src*="pimg.1px.tw"], .jodit-container img[src*="pimg.1px.tw"]').evaluateAll(nodes => nodes.map(n => n.getAttribute('src') || '')).catch(() => []);
    console.log(JSON.stringify({ before, r1, after1, r2, after2 }, null, 2));
  } finally {
    await context.close();
  }
})();
