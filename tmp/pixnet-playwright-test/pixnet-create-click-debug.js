const { chromium } = require('playwright');
const path = require('path');
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function snapshot(page, tag) {
  const body = (await page.locator('body').innerText().catch(() => '')).slice(0, 4000);
  console.log(`SNAPSHOT ${tag} URL ${page.url()}`);
  console.log(body);
}

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
  try {
    await page.goto('https://account.pixnet.tw/login', { waitUntil: 'domcontentloaded' });
    await sleep(1000);
    const username = page.locator('input[name="username"]');
    if (await username.isVisible().catch(() => false)) {
      await username.fill('alantong');
      await page.locator('input[name="password"]').fill('xxxx3721?!');
      await page.locator('button[type="submit"]').first().click();
      await sleep(2500);
    }
    await page.goto('https://panel.pixnet.tw/posts/create', { waitUntil: 'domcontentloaded' });
    await sleep(2000);
    await snapshot(page, 'before-click');
    const start = page.getByRole('button', { name: /開始寫文章/ }).first();
    await start.waitFor({ state: 'visible', timeout: 15000 });
    await start.scrollIntoViewIfNeeded();
    await sleep(300);
    console.log('CLICK normal');
    await start.click({ timeout: 10000 });
    await sleep(3000);
    await snapshot(page, 'after-normal-click');
    if (/https:\/\/panel\.pixnet\.tw\/posts\/\d+$/.test(page.url())) return;
    console.log('CLICK force');
    await start.click({ force: true, timeout: 10000 }).catch(e => console.log('force-click-error', String(e)));
    await sleep(3000);
    await snapshot(page, 'after-force-click');
    if (/https:\/\/panel\.pixnet\.tw\/posts\/\d+$/.test(page.url())) return;
    console.log('PRESS enter');
    await start.press('Enter').catch(e => console.log('press-error', String(e)));
    await sleep(3000);
    await snapshot(page, 'after-enter');
    if (/https:\/\/panel\.pixnet\.tw\/posts\/\d+$/.test(page.url())) return;
    console.log('EVAL click');
    await page.evaluate(() => {
      const btn = [...document.querySelectorAll('button')].find(b => (b.innerText || '').includes('開始寫文章'));
      if (btn) btn.click();
    });
    await sleep(5000);
    await snapshot(page, 'after-eval-click');
  } finally {
    await context.close();
  }
})();
