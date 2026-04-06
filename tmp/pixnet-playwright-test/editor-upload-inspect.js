const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const userDataDir = path.join('/home/alantong/ai-work/tmp/pixnet-playwright-test', 'pixnet-user-data');
  const context = await chromium.launchPersistentContext(userDataDir, {
    headless: false,
    executablePath: '/snap/bin/chromium',
    env: {
      ...process.env,
      XDG_RUNTIME_DIR: '/run/user/1000',
      WAYLAND_DISPLAY: 'wayland-0',
      DISPLAY: ':0',
    },
    args: ['--no-sandbox'],
    viewport: { width: 1400, height: 960 },
  });

  const page = context.pages()[0] || await context.newPage();
  await page.goto('https://panel.pixnet.tw/posts/882023561366150926', { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: '圖片' }).click();
  await page.waitForTimeout(2500);

  const dialogs = await page.locator('[role="dialog"], .jodit-dialog, .jodit-popup, .jodit-container [class*="popup"], .jodit-ui-popup').evaluateAll(nodes =>
    nodes.map(n => ({
      tag: n.tagName,
      cls: n.getAttribute('class'),
      text: (n.innerText || '').slice(0, 1000)
    }))
  ).catch(() => []);

  const fileInputs = await page.locator('input[type="file"], input[accept*="image"], .jodit input').evaluateAll(nodes =>
    nodes.map(n => ({
      type: n.getAttribute('type'),
      name: n.getAttribute('name'),
      accept: n.getAttribute('accept'),
      cls: n.getAttribute('class'),
      outer: n.outerHTML.slice(0, 500)
    }))
  ).catch(() => []);

  const candidates = await page.locator('button, [role="button"], input, label, a').evaluateAll(nodes =>
    nodes.map(n => ({
      tag: n.tagName,
      text: (n.innerText || n.value || '').trim().slice(0, 120),
      aria: n.getAttribute('aria-label'),
      title: n.getAttribute('title'),
      cls: n.getAttribute('class')
    })).filter(x => {
      const s = `${x.text} ${x.aria || ''} ${x.title || ''} ${x.cls || ''}`;
      return /圖片|上傳|upload|image|insert|檔案|本機|browse/i.test(s);
    })
  ).catch(() => []);

  console.log(JSON.stringify({ dialogs, fileInputs, candidates }, null, 2));
  await context.close();
})();
