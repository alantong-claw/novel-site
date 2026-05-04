const { chromium } = require('playwright');
const path = require('path');
const pixnetPaths = require('/home/alantong/ai-work/scripts/pixnet_paths');

(async () => {
  const userDataDir = pixnetPaths.userDataDir;
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
  await page.goto('https://panel.pixnet.tw/posts/create', { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: '開始寫文章' }).click();
  await page.waitForTimeout(5000);

  const data = {
    title: await page.title(),
    url: page.url(),
    bodyText: (await page.locator('body').innerText()).slice(0, 4000),
    buttons: await page.locator('button').allInnerTexts().catch(() => []),
    links: await page.locator('a').allInnerTexts().catch(() => []),
    inputs: await page.locator('input, textarea').evaluateAll(nodes =>
      nodes.map(n => ({
        tag: n.tagName,
        type: n.getAttribute('type'),
        name: n.getAttribute('name'),
        placeholder: n.getAttribute('placeholder'),
        aria: n.getAttribute('aria-label'),
        value: n.value || ''
      }))
    ).catch(() => []),
    editables: await page.locator('[contenteditable="true"]').evaluateAll(nodes =>
      nodes.map(n => ({
        text: (n.innerText || '').slice(0, 200),
        aria: n.getAttribute('aria-label'),
        role: n.getAttribute('role'),
        class: n.getAttribute('class')
      }))
    ).catch(() => []),
  };

  console.log(JSON.stringify({
    ...data,
    buttons: data.buttons.slice(0, 60),
    links: data.links.slice(0, 60),
    inputs: data.inputs.slice(0, 60),
    editables: data.editables.slice(0, 20)
  }, null, 2));

  await context.close();
})();
