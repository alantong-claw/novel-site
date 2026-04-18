const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const { execFileSync } = require('child_process');

const startId = process.argv[2];
const endId = process.argv[3];
if (!startId || !endId) {
  console.error('usage: node pixnet-publish-range.js <startId> <endId>');
  process.exit(1);
}

function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }
async function waitForCondition(checkFn, { tries = 20, delayMs = 1000 } = {}) {
  let last = null;
  for (let i = 0; i < tries; i++) {
    last = await checkFn();
    if (last && last.ok) return last;
    await sleep(delayMs);
  }
  return last || { ok: false };
}

function buildSpec(idNum) {
  const raw = execFileSync('node', [
    path.join('/home/alantong/ai-work/scripts', 'build_pixnet_whisky_post.js'),
    '/mnt/g/TMP/whisky_photo/Whisky365_NoteAll.csv',
    String(idNum)
  ], { encoding: 'utf8' });
  const spec = JSON.parse(raw);
  const id = String(idNum).padStart(3, '0');
  const matches = fs.readdirSync('/mnt/g/TMP/whisky_photo')
    .filter(name => name.startsWith(`${id}_`))
    .sort()
    .map(name => path.join('/mnt/g/TMP/whisky_photo', name));
  if (!matches.length) throw new Error(`image-not-found:${id}`);
  return { num: id, title: spec.title, tags: spec.tags, image: matches[0] };
}

async function openFreshEditor(page) {
  console.log('STEP openFreshEditor:start');
  await page.goto('https://account.pixnet.tw/login', { waitUntil: 'domcontentloaded' });
  await sleep(1000);
  const username = page.locator('input[name="username"]');
  if (await username.isVisible().catch(() => false)) {
    await username.fill('alantong');
    await page.locator('input[name="password"]').fill('xxxx3721?!');
    await page.locator('button[type="submit"]').first().click();
    await sleep(2500);
  }
  console.log('STEP openFreshEditor:after-login');
  await page.goto('https://panel.pixnet.tw/posts/create', { waitUntil: 'domcontentloaded' });
  await sleep(2000);
  const start = page.getByRole('button', { name: /開始寫文章/ }).first();
  await start.waitFor({ state: 'visible', timeout: 15000 });
  await start.scrollIntoViewIfNeeded();
  await sleep(300);
  await start.click({ timeout: 10000 });
  await sleep(5000);
  const reached = await waitForCondition(async () => {
    const body = (await page.locator('body').innerText().catch(() => '')).slice(0, 6000);
    const url = page.url();
    return {
      ok: /^https:\/\/panel\.pixnet\.tw\/posts\/\d+$/.test(url) && (body.includes('文章標題') || body.includes('寫文章')) && body.includes('文章個人分類'),
      url,
      body,
    };
  }, { tries: 60, delayMs: 1000 });
  if (!reached.ok) throw new Error(`did-not-reach-editor:${reached.url || page.url()}`);
  console.log('STEP openFreshEditor:editor-ready');
}

async function setDropdown(page, labelText, value, searchable) {
  const label = page.locator('label').filter({ hasText: labelText }).first();
  const fieldGroup = label.locator('xpath=ancestor::*[@role="group"][1]');
  const combo = fieldGroup.getByRole('combobox').first();
  await combo.scrollIntoViewIfNeeded();
  await sleep(300);
  await combo.click();
  await sleep(600);
  if (searchable) {
    const search = page.getByPlaceholder('搜尋...').last();
    await search.waitFor({ state: 'visible', timeout: 10000 });
    await search.fill(value);
    await sleep(600);
  }
  const option = page.locator('[role="option"], [cmdk-item]').filter({ hasText: value }).first();
  await option.waitFor({ state: 'visible', timeout: 10000 });
  await option.click();
  await sleep(800);
}

async function uploadImage(page, imagePath) {
  const candidates = [
    page.getByLabel('圖片').first(),
    page.getByTitle('圖片').first(),
    page.locator('button[aria-label="圖片"]').first(),
    page.locator('span[aria-label="圖片"]').first(),
    page.locator('.jodit-toolbar-button').filter({ hasText: '圖片' }).first(),
  ];
  for (const candidate of candidates) {
    if (!(await candidate.isVisible().catch(() => false))) continue;
    try {
      await candidate.click({ timeout: 5000 });
      break;
    } catch {}
  }
  await sleep(1200);
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
  const uploaded = await waitForCondition(async () => {
    const html = await page.locator('body').innerHTML().catch(() => '');
    return { ok: html.includes('pimg.1px.tw') };
  }, { tries: 25, delayMs: 1000 });
  if (!uploaded.ok) throw new Error('image-upload-not-confirmed');
}

async function publishItem(page, item) {
  console.log(`ITEM ${item.num} start ${item.title}`);
  await openFreshEditor(page);
  const titleInput = page.locator('textarea[name="title"], #文章標題').first();
  await titleInput.waitFor({ state: 'visible', timeout: 15000 });
  console.log('STEP fill-title');
  await titleInput.fill(item.title);
  await sleep(700);
  const titleReadback = await titleInput.inputValue();
  if (titleReadback !== item.title) throw new Error(`title-readback-mismatch:${titleReadback}`);

  console.log('STEP set-categories');
  await setDropdown(page, '文章個人分類', 'Whisky', true);
  await setDropdown(page, '文章全站分類 (主要)', '美味食記', true);
  await setDropdown(page, '文章全站分類 (次要)', '生活綜合', true);
  await setDropdown(page, '文章閱讀權限', '公開', false);
  await setDropdown(page, '文章留言權限', '可留言，留言公開', false);

  console.log('STEP set-tags');
  const tagInput = page.locator('input[placeholder="+ 新增標籤"]').first();
  for (const tag of item.tags) {
    await tagInput.click();
    await sleep(200);
    await tagInput.fill(tag);
    await sleep(200);
    await page.keyboard.press('Enter');
    await sleep(600);
  }

  console.log('STEP upload-image');
  await uploadImage(page, item.image);
  console.log('STEP upload-image:done');

  console.log('STEP click-publish');
  await page.getByText('發布', { exact: true }).first().click();
  await sleep(1000);
  const published = await waitForCondition(async () => {
    const body = (await page.locator('body').innerText().catch(() => '')).slice(0, 12000);
    const lines = body.split('\n');
    const titleIndex = lines.findIndex(x => x.trim() === item.title);
    const postUrl = titleIndex >= 1 ? lines[titleIndex - 1] : '';
    return {
      ok: page.url().startsWith('https://panel.pixnet.tw/posts') && body.includes(item.title),
      postUrl,
      body,
    };
  }, { tries: 25, delayMs: 1000 });
  if (!published.ok) throw new Error(`publish-not-verified:${item.num}`);
  console.log('STEP publish:verified');
  return { num: item.num, title: item.title, postUrl: published.postUrl };
}

function runCleanupAfterSuccess(success) {
  if (!success) return;
  try {
    const cleanupScript = '/home/alantong/ai-work/scripts/cleanup_pixnet_profile.sh';
    const cleanupOutput = execFileSync(cleanupScript, ['1'], { encoding: 'utf8' });
    console.error(`[pixnet cleanup] ${cleanupOutput.trim()}`);
  } catch (error) {
    console.error('[pixnet cleanup] failed:', error?.message || error);
  }
}

(async () => {
  const items = [];
  for (let i = Number(startId); i <= Number(endId); i++) items.push(buildSpec(i));
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
  try {
    const page = context.pages()[0] || await context.newPage();
    const results = [];
    for (const item of items) {
      const result = await publishItem(page, item);
      results.push(result);
      console.log(JSON.stringify({ stage: 'published', result }, null, 2));
      await page.goto('about:blank');
      await sleep(1200);
    }
    console.log(JSON.stringify({ success: true, results }, null, 2));
  } finally {
    await sleep(3000);
    await context.close();
  }
})();
