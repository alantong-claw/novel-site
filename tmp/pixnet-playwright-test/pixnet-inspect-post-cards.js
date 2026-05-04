const { chromium } = require('playwright');
const path = require('path');
const pixnetPaths = require('/home/alantong/ai-work/scripts/pixnet_paths');

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
    await page.goto('https://panel.pixnet.tw/posts', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3000);
    const data = await page.evaluate(() => {
      const title = '[Whisky][Scotland/Speyside] Benromach / Contrast/High Enzyme / 12 Yr';
      const nodes = [...document.querySelectorAll('body *')].filter(el => (el.innerText || '').includes(title)).slice(0, 10);
      return nodes.map(el => ({
        tag: el.tagName,
        cls: el.className,
        text: (el.innerText || '').slice(0, 300),
        outer: (el.outerHTML || '').slice(0, 800)
      }));
    });
    console.log(JSON.stringify(data, null, 2));
  } finally {
    await context.close();
  }
})();
