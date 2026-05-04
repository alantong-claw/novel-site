const { chromium } = require('playwright');
const path = require('path');
const pixnetPaths = require('/home/alantong/ai-work/scripts/pixnet_paths');
const { waitForCondition } = require('./pixnet-upload-helper');
const { openExistingPostEditor, sleep } = require('./pixnet-edit-helper');

const postId = '889659083651619269';
const expectedTitle = '[Whisky][Taiwan/Yilan] KAVALAN / Peatist 泥煤探索者/Ex-bourbon';
const badTag = 'Peatist æ³¥ç¤æ¢ç´¢è/Ex-bourbon';
const publicUrl = 'https://alantong.pixnet.net/blog/posts/889659083651619269';

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

    const removed = await page.evaluate((badTag) => {
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT);
      while (walker.nextNode()) {
        const el = walker.currentNode;
        if ((el.innerText || '').trim() !== badTag) continue;
        let host = el;
        for (let i = 0; i < 4 && host; i++, host = host.parentElement) {
          const buttons = host ? Array.from(host.querySelectorAll('button, svg, [role="button"]')) : [];
          if (buttons.length) {
            const target = buttons[buttons.length - 1];
            target.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
            return true;
          }
        }
      }
      return false;
    }, badTag);
    if (!removed) throw new Error('bad-tag-remove-control-not-found');
    await sleep(1200);

    await page.getByText('發布', { exact: true }).first().click();
    await sleep(1000);
    const published = await waitForCondition(async () => {
      const body = (await page.locator('body').innerText().catch(() => '')).slice(0, 12000);
      return { ok: page.url().startsWith('https://panel.pixnet.tw/posts') && body.includes(expectedTitle) };
    }, { tries: 25, delayMs: 1000 });
    if (!published.ok) throw new Error('retag-not-verified');

    await page.goto(publicUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await sleep(3000);
    const check = await page.evaluate((badTag) => ({
      body: (document.body.innerText || '').slice(0, 5000),
      hasBadTag: (document.body.innerText || '').includes(badTag)
    }), badTag);
    if (check.hasBadTag) throw new Error('bad-tag-still-present');
    console.log(JSON.stringify({ success: true, publicUrl }, null, 2));
  } finally {
    await context.close();
  }
})();
