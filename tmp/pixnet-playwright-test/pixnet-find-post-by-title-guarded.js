const { chromium } = require('playwright');
const path = require('path');
const pixnetPaths = require('/home/alantong/ai-work/scripts/pixnet_paths');
const { ensureLoggedInToPosts } = require('./pixnet-edit-helper');

const title = process.argv.slice(2).join(' ');
if (!title) { console.error('usage: node pixnet-find-post-by-title-guarded.js <title>'); process.exit(1); }

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
    await ensureLoggedInToPosts(page);
    const result = await page.evaluate((title) => {
      const text = document.body.innerText || '';
      const lines = text.split('\n');
      const hits = [];
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].trim() === title) {
          hits.push({
            title: lines[i].trim(),
            previous: lines[i - 1] || '',
            next: lines[i + 1] || '',
            next2: lines[i + 2] || ''
          });
        }
      }
      return { url: location.href, hasTitle: text.includes(title), hits, snippet: text.slice(0,8000) };
    }, title);
    console.log(JSON.stringify(result, null, 2));
  } finally { await context.close(); }
})();
