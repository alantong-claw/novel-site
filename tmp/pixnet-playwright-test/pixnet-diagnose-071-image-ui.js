const { chromium } = require('playwright');
const path = require('path');
const pixnetPaths = require('/home/alantong/ai-work/scripts/pixnet_paths');

const postUrl = 'https://panel.pixnet.tw/posts/887193412955084920';

function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

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
    await page.goto(postUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await sleep(3000);

    const candidates = [
      page.getByLabel('圖片').first(),
      page.getByTitle('圖片').first(),
      page.locator('button[aria-label="圖片"]').first(),
      page.locator('span[aria-label="圖片"]').first(),
      page.locator('.jodit-toolbar-button').filter({ hasText: '圖片' }).first(),
    ];

    let clicked = false;
    let clickedBy = 'none';
    for (const [idx, candidate] of candidates.entries()) {
      if (!(await candidate.isVisible().catch(() => false))) continue;
      try {
        await candidate.click({ timeout: 5000 });
        clicked = true;
        clickedBy = `candidate-${idx}`;
        break;
      } catch {}
    }

    await sleep(2000);

    const dump = await page.evaluate(() => {
      const sels = ['.jodit-drag-and-drop__file-box', '.jodit-popup', '.jodit-dialog', 'input[type="file"]'];
      const out = {};
      for (const sel of sels) {
        out[sel] = Array.from(document.querySelectorAll(sel)).map(n => ({
          tag: n.tagName,
          cls: n.className || '',
          text: (n.innerText || '').slice(0, 200),
          outer: (n.outerHTML || '').slice(0, 400)
        }));
      }
      return out;
    });

    console.log(JSON.stringify({ clicked, clickedBy, dump }, null, 2));
  } finally {
    await context.close();
  }
})();
