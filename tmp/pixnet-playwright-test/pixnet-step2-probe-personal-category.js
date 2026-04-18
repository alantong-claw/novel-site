const { chromium } = require('playwright');
const path = require('path');

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
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
  await page.goto('https://panel.pixnet.tw/posts', { waitUntil: 'domcontentloaded' });
  await sleep(3000);

  const writeLink = page.getByText('寫文章', { exact: true }).first();
  await writeLink.waitFor({ state: 'visible', timeout: 15000 });
  await writeLink.scrollIntoViewIfNeeded();
  await sleep(1000);
  await writeLink.click();
  await sleep(3000);

  const startButton = page.getByRole('button', { name: /開始寫文章/ }).first();
  await startButton.waitFor({ state: 'visible', timeout: 15000 });
  await startButton.scrollIntoViewIfNeeded();
  await sleep(1000);
  await startButton.click();
  await sleep(5000);

  const categoryLabel = page.locator('label').filter({ hasText: '文章個人分類' }).first();
  await categoryLabel.waitFor({ state: 'visible', timeout: 15000 });
  const fieldGroup = categoryLabel.locator('xpath=ancestor::*[@role="group"][1]');
  const combo = fieldGroup.getByRole('combobox').first();

  console.log('[step2] editor url:', page.url());
  console.log('[step2] combo before:', await combo.innerText());
  await combo.scrollIntoViewIfNeeded();
  await sleep(1000);
  await combo.click();
  await sleep(2000);

  const search = page.getByPlaceholder('搜尋...').last();
  await search.waitFor({ state: 'visible', timeout: 10000 });
  await sleep(1000);
  await search.fill('Whisky');
  await sleep(2000);

  const body = (await page.locator('body').innerText()).slice(0, 4000);
  console.log('[step2] body head after search:', body);

  const options = await page.locator('[role="option"], [cmdk-item]').evaluateAll(nodes =>
    nodes.slice(0, 30).map(n => ({
      text: (n.innerText || '').trim(),
      value: n.getAttribute('data-value'),
      selected: n.getAttribute('aria-selected'),
      cls: n.getAttribute('class')
    }))
  ).catch(() => []);
  console.log('[step2] options:', JSON.stringify(options, null, 2));

  await sleep(20000);
  await context.close();
})();
