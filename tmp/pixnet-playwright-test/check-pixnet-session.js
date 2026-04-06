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
  await page.goto('https://panel.pixnet.tw/posts', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(5000);

  const data = {
    title: await page.title(),
    url: page.url(),
    bodyText: (await page.locator('body').innerText()).slice(0, 2500),
    buttons: await page.locator('button').allInnerTexts().catch(() => []),
    links: await page.locator('a').allInnerTexts().catch(() => []),
    inputs: await page.locator('input').evaluateAll(nodes =>
      nodes.map(n => ({
        type: n.getAttribute('type'),
        name: n.getAttribute('name'),
        placeholder: n.getAttribute('placeholder'),
        value: n.value || ''
      }))
    ).catch(() => []),
  };

  console.log(JSON.stringify({
    ...data,
    buttons: data.buttons.slice(0, 40),
    links: data.links.slice(0, 40),
    inputs: data.inputs.slice(0, 40)
  }, null, 2));

  await page.waitForTimeout(10000);
  await context.close();
})();
