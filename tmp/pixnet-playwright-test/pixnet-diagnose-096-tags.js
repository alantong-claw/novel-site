const { chromium } = require('playwright');
const path = require('path');
const pixnetPaths = require('/home/alantong/ai-work/scripts/pixnet_paths');
const { openExistingPostEditor, sleep } = require('./pixnet-edit-helper');

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
    await openExistingPostEditor(page, 'https://panel.pixnet.tw/posts/889659083651619269', { expectedTitle: '[Whisky][Taiwan/Yilan] KAVALAN / Peatist 泥煤探索者/Ex-bourbon' });
    await sleep(2000);
    const data = await page.evaluate(() => {
      const root = document.body;
      const text = root.innerText || '';
      const html = root.innerHTML || '';
      return {
        body: text.slice(0, 8000),
        badTagCount: (text.match(/Peatist æ³¥ç¤æ¢ç´¢è\/Ex-bourbon/g) || []).length,
        goodTagCount: (text.match(/Peatist 泥煤探索者\/Ex-bourbon/g) || []).length,
        tagInputPresent: !!document.querySelector('input[placeholder="+ 新增標籤"]'),
        htmlSnippet: html.slice(0, 12000)
      };
    });
    console.log(JSON.stringify(data, null, 2));
  } finally {
    await context.close();
  }
})();
