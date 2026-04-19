const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const { execFileSync } = require('child_process');

const rawId = process.argv[2];
if (!rawId) {
  console.error('usage: node pixnet-publish-one.js <id>');
  process.exit(1);
}
const idNum = Number(rawId);
if (!Number.isInteger(idNum) || idNum <= 0) {
  console.error(`invalid id: ${rawId}`);
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

function parseCsvLine(s) {
  const out = []; let cur = ''; let q = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === '"') {
      if (q && s[i + 1] === '"') { cur += '"'; i++; }
      else q = !q;
    } else if (c === ',' && !q) {
      out.push(cur); cur = '';
    } else cur += c;
  }
  out.push(cur);
  return out;
}
function clean(v) { return (v || '').trim(); }
function keep(v) { v = clean(v); return v && v.toUpperCase() !== 'NA'; }
function formatYear(v) {
  v = clean(v);
  if (!keep(v)) return '';
  return `${v} Yr`;
}

function buildSpec(idNum) {
  const id = String(idNum).padStart(3, '0');
  const csvPath = '/mnt/g/TMP/whisky_photo/Whisky365_NoteAll.csv';
  const txt = fs.readFileSync(csvPath, 'latin1').replace(/^\uFEFF/, '');
  const rows = txt.split(/\r?\n/).filter(Boolean).map(parseCsvLine);
  const row = rows.find(r => r && clean(r[0]) === String(idNum));
  if (!row) throw new Error(`row-not-found:${idNum}`);
  const region = clean(row[6]);
  const parts = [row[1], row[2], formatYear(row[7])].filter(keep).map(clean);
  const title = `[Whisky][${region}] ${parts.join(' / ')}`.trim();
  const tags = ['Whisky'];
  for (const part of region.split('/').map(s => s.trim()).filter(keep)) tags.push(part);
  for (const v of [row[1], row[2], row[7]]) if (keep(v)) tags.push(clean(v));
  const matches = fs.readdirSync('/mnt/g/TMP/whisky_photo')
    .filter(name => name.startsWith(`${id}_`))
    .sort()
    .map(name => path.join('/mnt/g/TMP/whisky_photo', name));
  if (!matches.length) throw new Error(`image-not-found:${id}`);
  return { num: id, title, tags, image: matches[0] };
}

async function setupEditor(page) {
  let postsReady = { ok: false, url: page.url() };
  for (let loginAttempt = 1; loginAttempt <= 2; loginAttempt++) {
    console.log(`STEP setupEditor:login attempt ${loginAttempt}`);
    await page.goto('https://account.pixnet.tw/login', { waitUntil: 'domcontentloaded' });
    await sleep(1000);
    const username = page.locator('input[name="username"]');
    if (await username.isVisible().catch(() => false)) {
      await username.fill('alantong');
      await sleep(800);
      await page.locator('input[name="password"]').fill('xxxx3721?!');
      await sleep(800);
      await page.locator('button[type="submit"]').first().click();
      await sleep(2500);
    }

    await page.goto('https://panel.pixnet.tw/posts', { waitUntil: 'domcontentloaded' });
    await sleep(1000);
    postsReady = await waitForCondition(async () => {
      const body = (await page.locator('body').innerText().catch(() => '')).slice(0, 2000);
      return {
        ok: page.url().startsWith('https://panel.pixnet.tw/posts') && body.includes('我的文章') && body.includes('寫文章'),
        url: page.url(),
        body,
      };
    }, { tries: 20, delayMs: 1000 });
    if (postsReady.ok) break;
  }
  if (!postsReady.ok) throw new Error(`did-not-reach-posts:${postsReady.url || page.url()}`);

  await page.getByText('寫文章', { exact: true }).first().click();
  await sleep(1000);
  const createReady = await waitForCondition(async () => {
    const start = page.getByRole('button', { name: /開始寫文章/ }).first();
    return {
      ok: page.url().startsWith('https://panel.pixnet.tw/posts/create') && await start.isVisible().catch(() => false),
      url: page.url(),
    };
  }, { tries: 20, delayMs: 1000 });
  if (!createReady.ok) throw new Error(`did-not-reach-create:${createReady.url || page.url()}`);

  const start = page.getByRole('button', { name: /開始寫文章/ }).first();
  let reached = { ok: false, url: page.url() };
  for (let attempt = 1; attempt <= 3; attempt++) {
    console.log(`STEP setupEditor:start-button attempt ${attempt}`);
    await start.waitFor({ state: 'visible', timeout: 15000 });
    await start.scrollIntoViewIfNeeded();
    await sleep(400);
    try {
      await start.click({ timeout: 10000 });
    } catch {
      await start.click({ force: true, timeout: 10000 });
    }
    await sleep(1500);
    reached = await waitForCondition(async () => {
      const label = page.locator('label').filter({ hasText: '文章個人分類' }).first();
      return {
        ok: /^https:\/\/panel\.pixnet\.tw\/posts\/\d+$/.test(page.url()) && await label.isVisible().catch(() => false),
        url: page.url(),
      };
    }, { tries: 8, delayMs: 1000 });
    if (reached.ok) break;
    await page.reload({ waitUntil: 'domcontentloaded' }).catch(() => {});
    await sleep(1000);
  }
  if (!reached.ok) throw new Error(`did-not-reach-editor:${reached.url || page.url()}`);
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
  await setupEditor(page);
  const titleInput = page.locator('textarea[name="title"], #文章標題').first();
  await titleInput.waitFor({ state: 'visible', timeout: 15000 });
  await titleInput.fill(item.title);
  await sleep(700);
  const titleReadback = await titleInput.inputValue();
  if (titleReadback !== item.title) throw new Error(`title-readback-mismatch:${titleReadback}`);

  await setDropdown(page, '文章個人分類', 'Whisky', true);
  await setDropdown(page, '文章全站分類 (主要)', '美味食記', true);
  await setDropdown(page, '文章全站分類 (次要)', '生活綜合', true);
  await setDropdown(page, '文章閱讀權限', '公開', false);
  await setDropdown(page, '文章留言權限', '可留言，留言公開', false);

  const tagInput = page.locator('input[placeholder="+ 新增標籤"]').first();
  for (const tag of item.tags) {
    await tagInput.click();
    await sleep(200);
    await tagInput.fill(tag);
    await sleep(200);
    await page.keyboard.press('Enter');
    await sleep(600);
  }

  await uploadImage(page, item.image);

  await page.getByText('發布', { exact: true }).first().click();
  await sleep(1000);
  const published = await waitForCondition(async () => {
    const body = (await page.locator('body').innerText().catch(() => '')).slice(0, 10000);
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
  const item = buildSpec(idNum);
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
  let published = false;
  try {
    const page = context.pages()[0] || await context.newPage();
    const result = await publishItem(page, item);
    published = true;
    console.log(JSON.stringify({ success: true, result }, null, 2));
  } finally {
    await sleep(3000);
    await context.close();
    runCleanupAfterSuccess(published);
  }
})();
