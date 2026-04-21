const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const { execFileSync } = require('child_process');
const { uploadImageStrict, waitForCondition } = require('./pixnet-upload-helper');

const ROOT = '/home/alantong/ai-work';
const MAX_SELF_RECOVERY_ROUNDS = 3;

function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

function buildSpec(idNum) {
  const raw = execFileSync('node', [
    path.join(ROOT, 'scripts', 'build_pixnet_whisky_post.js'),
    '/mnt/g/TMP/whisky_photo/Whisky365_NoteAll.csv',
    String(Number(idNum))
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

async function setupEditor(page) {
  let postsReady = { ok: false, url: page.url() };
  for (let loginAttempt = 1; loginAttempt <= 2; loginAttempt++) {
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

  await uploadImageStrict(page, item.image);

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
  return { num: item.num, title: item.title, postUrl: published.postUrl };
}

(async () => {
  const items = [buildSpec(78), buildSpec(79)];
  const userDataDir = path.join(ROOT, 'tmp/pixnet-playwright-test', 'pixnet-user-data');
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
    let stuckKey = '';
    let sameSpotRounds = 0;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      let published = false;
      while (!published) {
        try {
          const result = await publishItem(page, item);
          results.push(result);
          console.log(JSON.stringify({ stage: 'published', result }, null, 2));
          stuckKey = `published_${item.num}`;
          sameSpotRounds = 0;
          published = true;
          await page.goto('about:blank').catch(() => {});
          await sleep(1200);
        } catch (error) {
          const message = error?.message || String(error);
          const currentKey = `${item.num}:${message.split(':')[0]}`;
          if (currentKey === stuckKey) sameSpotRounds += 1;
          else {
            stuckKey = currentKey;
            sameSpotRounds = 1;
          }
          if (sameSpotRounds >= MAX_SELF_RECOVERY_ROUNDS) throw error;
          try {
            await page.goto('about:blank', { waitUntil: 'domcontentloaded' });
            await sleep(1000);
            await page.context().clearCookies();
            await sleep(500);
          } catch {}
        }
      }
      if (i < items.length - 1) await sleep(5 * 1000);
    }

    console.log(JSON.stringify({ success: true, results }, null, 2));
  } finally {
    await sleep(3000);
    await context.close().catch(() => {});
  }
})();
