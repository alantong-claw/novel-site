const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const { execFileSync } = require('child_process');

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitForCondition(checkFn, { tries = 15, delayMs = 1000, label = 'check' } = {}) {
  let last = null;
  for (let i = 0; i < tries; i++) {
    last = await checkFn();
    if (last && last.ok) return last;
    await sleep(delayMs);
  }
  return last || { ok: false, label };
}

async function setupEditor(page) {
  await page.goto('https://account.pixnet.tw/login', { waitUntil: 'domcontentloaded' });
  await sleep(1000);
  await page.locator('input[name="username"]').fill('alantong');
  await sleep(800);
  await page.locator('input[name="password"]').fill('xxxx3721?!');
  await sleep(800);
  await page.locator('button[type="submit"]').first().click();
  await sleep(1000);
  if (!(await waitForCondition(async () => ({ ok: page.url().includes('/dashboard') }), { tries: 15, delayMs: 1000 })).ok) throw new Error('did-not-reach-dashboard');

  await page.goto('https://panel.pixnet.tw/posts', { waitUntil: 'domcontentloaded' });
  await sleep(1000);
  if (!(await waitForCondition(async () => {
    const body = (await page.locator('body').innerText().catch(() => '')).slice(0, 1500);
    return { ok: page.url().startsWith('https://panel.pixnet.tw/posts') && body.includes('我的文章') && body.includes('寫文章') };
  }, { tries: 15, delayMs: 1000 })).ok) throw new Error('did-not-reach-posts');

  await page.getByText('寫文章', { exact: true }).first().click();
  await sleep(1000);
  if (!(await waitForCondition(async () => {
    const start = page.getByRole('button', { name: /開始寫文章/ }).first();
    return { ok: page.url().startsWith('https://panel.pixnet.tw/posts/create') && await start.isVisible().catch(() => false) };
  }, { tries: 20, delayMs: 1000 })).ok) throw new Error('did-not-reach-create');

  await page.getByRole('button', { name: /開始寫文章/ }).first().click();
  await sleep(1000);
  if (!(await waitForCondition(async () => {
    const label = page.locator('label').filter({ hasText: '文章個人分類' }).first();
    return { ok: /^https:\/\/panel\.pixnet\.tw\/posts\/\d+$/.test(page.url()) && await label.isVisible().catch(() => false) };
  }, { tries: 25, delayMs: 1000 })).ok) throw new Error('did-not-reach-editor');
}

async function setDropdown(page, labelText, value, searchable) {
  const label = page.locator('label').filter({ hasText: labelText }).first();
  const fieldGroup = label.locator('xpath=ancestor::*[@role="group"][1]');
  const combo = fieldGroup.getByRole('combobox').first();
  await combo.scrollIntoViewIfNeeded();
  await sleep(800);
  await combo.click();
  await sleep(800);
  if (searchable) {
    const search = page.getByPlaceholder('搜尋...').last();
    await search.waitFor({ state: 'visible', timeout: 10000 });
    await search.fill(value);
    await sleep(800);
  }
  const option = page.locator('[role="option"], [cmdk-item]').filter({ hasText: value }).first();
  await option.waitFor({ state: 'visible', timeout: 10000 });
  await option.click();
  await sleep(1000);
}

(async () => {
  const titleText = '[Whisky][Japan/Hokkaido] Nikka/余市';
  const tags = ['Japan', 'Hokkaido', 'Nikka/余市'];
  const imagePath = '/mnt/g/TMP/whisky_photo/110_Nikka_余市.jpg';
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
  await setupEditor(page);

  const titleInput = page.locator('textarea[name="title"], #文章標題').first();
  await titleInput.waitFor({ state: 'visible', timeout: 15000 });
  await titleInput.fill(titleText);
  await sleep(1000);

  await setDropdown(page, '文章個人分類', 'Whisky', true);
  await setDropdown(page, '文章全站分類 (主要)', '美味食記', true);
  await setDropdown(page, '文章全站分類 (次要)', '生活綜合', true);
  await setDropdown(page, '文章閱讀權限', '公開', false);
  await setDropdown(page, '文章留言權限', '可留言，留言公開', false);

  const tagInput = page.locator('input[placeholder="+ 新增標籤"]').first();
  for (const tag of tags) {
    await tagInput.click();
    await sleep(300);
    await tagInput.fill(tag);
    await sleep(300);
    await page.keyboard.press('Enter');
    await sleep(800);
  }

  const imageButtonCandidates = [
    page.getByLabel('圖片').first(),
    page.getByTitle('圖片').first(),
    page.locator('button[aria-label="圖片"]').first(),
    page.locator('span[aria-label="圖片"]').first(),
    page.locator('.jodit-toolbar-button').filter({ hasText: '圖片' }).first(),
  ];
  for (const candidate of imageButtonCandidates) {
    const visible = await candidate.isVisible().catch(() => false);
    if (!visible) continue;
    try {
      await candidate.click({ timeout: 5000 });
      break;
    } catch {}
  }
  await sleep(1500);

  const buffer = fs.readFileSync(imagePath);
  const base64 = buffer.toString('base64');
  await page.evaluate(async ({ selector, fileName, base64 }) => {
    const target = document.querySelector(selector);
    if (!target) throw new Error(`Drop target not found: ${selector}`);
    const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
    const file = new File([bytes], fileName, { type: 'image/jpeg' });
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    target.dispatchEvent(new DragEvent('dragenter', { bubbles: true, cancelable: true, dataTransfer }));
    target.dispatchEvent(new DragEvent('dragover', { bubbles: true, cancelable: true, dataTransfer }));
    target.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer }));
  }, {
    selector: '.jodit-drag-and-drop__file-box',
    fileName: path.basename(imagePath),
    base64,
  });
  await sleep(6000);

  const publishButton = page.getByText('發布', { exact: true }).first();
  await publishButton.click();
  await sleep(1000);

  const published = await waitForCondition(async () => {
    const url = page.url();
    const body = (await page.locator('body').innerText().catch(() => '')).slice(0, 4000);
    return {
      ok: url.startsWith('https://panel.pixnet.tw/posts') && body.includes(titleText),
      url,
      title: await page.title(),
      body,
    };
  }, { tries: 25, delayMs: 1000, label: 'publish verify' });

  console.log(JSON.stringify({
    success: published.ok,
    titleText,
    url: published.url,
    title: published.title,
    bodySnippet: published.body,
  }, null, 2));

  await sleep(5000);
  await context.close();

  if (published.ok) {
    try {
      const cleanupScript = '/home/alantong/ai-work/scripts/cleanup_pixnet_profile.sh';
      const cleanupOutput = execFileSync(cleanupScript, ['1'], { encoding: 'utf8' });
      console.error(`[pixnet cleanup] ${cleanupOutput.trim()}`);
    } catch (error) {
      console.error('[pixnet cleanup] failed:', error?.message || error);
    }
  }
})();
