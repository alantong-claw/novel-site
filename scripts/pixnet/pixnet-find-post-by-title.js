const { chromium } = require('playwright');
const path = require('path');
const pixnetPaths = require('/home/alantong/ai-work/scripts/pixnet_paths');
const title = process.argv.slice(2).join(' ');
if (!title) { console.error('usage: node pixnet-find-post-by-title.js <title>'); process.exit(1); }
(async () => {
  const userDataDir = pixnetPaths.userDataDir;
  const context = await chromium.launchPersistentContext(userDataDir, {
    headless: true,
    executablePath: '/snap/bin/chromium',
    env: { ...process.env, XDG_RUNTIME_DIR: '/run/user/1000', WAYLAND_DISPLAY: 'wayland-0', DISPLAY: ':0' },
    args: ['--no-sandbox'],
    viewport: { width: 1400, height: 960 },
  });
  try {
    const page = context.pages()[0] || await context.newPage();
    await page.goto('https://panel.pixnet.tw/posts', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3000);
    const result = await page.evaluate((title) => {
      const text = document.body.innerText || '';
      const anchors = Array.from(document.querySelectorAll('a')).map(a => ({text:(a.innerText||'').trim(), href:a.href||''}));
      const matched = anchors.filter(a => a.text === title || a.href.includes(title));
      return { url: location.href, hasTitle: text.includes(title), matched: matched.slice(0,20), snippet: text.slice(0,5000) };
    }, title);
    console.log(JSON.stringify(result, null, 2));
  } finally { await context.close(); }
})();
