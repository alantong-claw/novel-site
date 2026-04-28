const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const userDataDir = path.join('/home/alantong/ai-work/tmp/pixnet-playwright-test', 'pixnet-user-data');
  const context = await chromium.launchPersistentContext(userDataDir, {
    headless: false,
    executablePath: '/snap/bin/chromium',
    env: { ...process.env, XDG_RUNTIME_DIR: '/run/user/1000', WAYLAND_DISPLAY: 'wayland-0', DISPLAY: ':0' },
    args: ['--no-sandbox'],
    viewport: { width: 1400, height: 960 },
  });
  try {
    const page = context.pages()[0] || await context.newPage();
    await page.goto('https://panel.pixnet.tw/posts', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3000);
    const data = await page.evaluate(() => {
      const anchors = [...document.querySelectorAll('a[href]')].map(a => ({
        href: a.href,
        text: (a.innerText || '').trim().slice(0, 200),
        outer: (a.outerHTML || '').slice(0, 300)
      }));
      return anchors.filter(a => /posts/.test(a.href)).slice(0, 60);
    });
    console.log(JSON.stringify(data, null, 2));
  } finally {
    await context.close();
  }
})();
