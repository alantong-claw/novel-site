const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    headless: false,
    executablePath: '/snap/bin/chromium',
    env: {
      ...process.env,
      XDG_RUNTIME_DIR: '/run/user/1000',
      WAYLAND_DISPLAY: 'wayland-0',
      DISPLAY: ':0',
    },
    args: ['--no-sandbox'],
  });

  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto('https://panel.pixnet.tw/posts', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(5000);

  const title = await page.title();
  const url = page.url();
  const bodyText = (await page.locator('body').innerText()).slice(0, 2000);
  const buttons = await page.locator('button').allInnerTexts().catch(() => []);
  const links = await page.locator('a').allInnerTexts().catch(() => []);
  const inputs = await page.locator('input').evaluateAll(nodes =>
    nodes.map(n => ({
      type: n.getAttribute('type'),
      name: n.getAttribute('name'),
      placeholder: n.getAttribute('placeholder'),
      value: n.value || ''
    }))
  ).catch(() => []);

  console.log(JSON.stringify({
    title,
    url,
    bodyText,
    buttons: buttons.slice(0, 30),
    links: links.slice(0, 30),
    inputs: inputs.slice(0, 30)
  }, null, 2));

  await page.waitForTimeout(10000);
  await browser.close();
})();
