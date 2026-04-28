const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const { execFileSync } = require('child_process');
const { uploadImageStrict, waitForCondition } = require('./pixnet-upload-helper');

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

const ROOT = '/home/alantong/ai-work';
const TASK_DIR = path.join(ROOT, 'memory', 'tasks');
const TASK_STATE = path.join(TASK_DIR, `pixnet-whisky-${String(idNum).padStart(3, '0')}.json`);
const MAX_SELF_RECOVERY_ROUNDS = 3;

function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

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

function setTaskState(status, fields = {}) {
  const args = [path.join(ROOT, 'scripts', 'task_state.py'), TASK_STATE, status];
  for (const [k, v] of Object.entries(fields)) {
    args.push(`${k}=${String(v)}`);
  }
  try {
    const output = execFileSync('python3', args, { encoding: 'utf8' }).trim();
    if (output) console.error(`[task_state] ${output}`);
  } catch (error) {
    console.error('[task_state] failed:', error?.message || error);
  }
}

function buildSpec(idNum) {
  const id = String(idNum).padStart(3, '0');
  const csvPath = '/mnt/g/TMP/whisky_photo/Whisky365_NoteAll.csv';
  const txt = fs.readFileSync(csvPath, 'utf8').replace(/^\uFEFF/, '');
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
    setTaskState('self_recovering', {
      task: `pixnet-whisky-${String(idNum).padStart(3, '0')}`,
      current_step: 'login_to_posts',
      last_ok_step: 'spec_built',
      recovery_round: loginAttempt,
      note: 'trying login to posts transition'
    });
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
    if (postsReady.ok) {
      setTaskState('running', {
        task: `pixnet-whisky-${String(idNum).padStart(3, '0')}`,
        current_step: 'posts_ready',
        last_ok_step: 'login_to_posts'
      });
      break;
    }
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
  setTaskState('running', {
    task: `pixnet-whisky-${String(idNum).padStart(3, '0')}`,
    current_step: 'create_ready',
    last_ok_step: 'reached_posts_create'
  });

  const start = page.getByRole('button', { name: /開始寫文章/ }).first();
  let reached = { ok: false, url: page.url() };
  for (let attempt = 1; attempt <= 3; attempt++) {
    console.log(`STEP setupEditor:start-button attempt ${attempt}`);
    setTaskState('self_recovering', {
      task: `pixnet-whisky-${String(idNum).padStart(3, '0')}`,
      current_step: 'create_to_editor',
      last_ok_step: 'reached_posts_create',
      recovery_round: attempt,
      note: 'trying create to editor transition'
    });
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
    if (reached.ok) {
      setTaskState('running', {
        task: `pixnet-whisky-${String(idNum).padStart(3, '0')}`,
        current_step: 'editor_ready',
        last_ok_step: 'reached_editor'
      });
      break;
    }
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
  return uploadImageStrict(page, imagePath);
}

async function publishItem(page, item) {
  await setupEditor(page);
  const titleInput = page.locator('textarea[name="title"], #文章標題').first();
  await titleInput.waitFor({ state: 'visible', timeout: 15000 });
  await titleInput.fill(item.title);
  await sleep(700);
  const titleReadback = await titleInput.inputValue();
  if (titleReadback !== item.title) throw new Error(`title-readback-mismatch:${titleReadback}`);
  setTaskState('running', {
    task: `pixnet-whisky-${item.num}`,
    current_step: 'title_filled',
    last_ok_step: 'title_filled'
  });

  await setDropdown(page, '文章個人分類', 'Whisky', true);
  await setDropdown(page, '文章全站分類 (主要)', '美味食記', true);
  await setDropdown(page, '文章全站分類 (次要)', '生活綜合', true);
  await setDropdown(page, '文章閱讀權限', '公開', false);
  await setDropdown(page, '文章留言權限', '可留言，留言公開', false);
  setTaskState('running', {
    task: `pixnet-whisky-${item.num}`,
    current_step: 'categories_set',
    last_ok_step: 'categories_set'
  });

  const tagInput = page.locator('input[placeholder="+ 新增標籤"]').first();
  for (const tag of item.tags) {
    await tagInput.click();
    await sleep(200);
    await tagInput.fill(tag);
    await sleep(200);
    await page.keyboard.press('Enter');
    await sleep(600);
  }
  setTaskState('running', {
    task: `pixnet-whisky-${item.num}`,
    current_step: 'tags_set',
    last_ok_step: 'tags_set'
  });

  await uploadImage(page, item.image);
  setTaskState('running', {
    task: `pixnet-whisky-${item.num}`,
    current_step: 'image_uploaded',
    last_ok_step: 'image_uploaded'
  });

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
  setTaskState('done', {
    task: `pixnet-whisky-${item.num}`,
    current_step: 'published',
    last_ok_step: 'published',
    note: published.postUrl || 'published verified',
    user_notified: false
  });
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
  let item;
  let context;
  let published = false;
  try {
    item = buildSpec(idNum);
    setTaskState('running', {
      task: `pixnet-whisky-${String(idNum).padStart(3, '0')}`,
      alert_scope: 'child',
      current_step: 'spec_built',
      last_ok_step: 'spec_built',
      note: item.title,
      recovery_round: 0,
      stuck_key: ''
    });

    const userDataDir = path.join('/home/alantong/ai-work/tmp/pixnet-playwright-test', 'pixnet-user-data');
    context = await chromium.launchPersistentContext(userDataDir, {
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
    let result;
    let lastError = null;
    let stuckKey = '';
    let sameSpotRounds = 0;

    for (let outerAttempt = 1; outerAttempt <= MAX_SELF_RECOVERY_ROUNDS; outerAttempt++) {
      try {
        result = await publishItem(page, item);
        published = true;
        console.log(JSON.stringify({ success: true, result }, null, 2));
        break;
      } catch (error) {
        lastError = error;
        const message = error?.message || String(error);
        const currentKey = message.split(':')[0];
        if (currentKey === stuckKey) sameSpotRounds += 1;
        else {
          stuckKey = currentKey;
          sameSpotRounds = 1;
        }

        setTaskState('self_recovering', {
          task: `pixnet-whisky-${item.num}`,
          current_step: currentKey,
          last_ok_step: 'see_previous_state',
          recovery_round: sameSpotRounds,
          stuck_key: stuckKey,
          note: message
        });

        if (sameSpotRounds >= MAX_SELF_RECOVERY_ROUNDS) {
          throw error;
        }

        try {
          await page.goto('about:blank', { waitUntil: 'domcontentloaded' });
          await sleep(1000);
          await page.context().clearCookies();
          await sleep(500);
        } catch {}
      }
    }

    if (!published && lastError) throw lastError;
  } catch (error) {
    const message = error?.message || String(error);
    setTaskState('blocked', {
      task: `pixnet-whisky-${String(idNum).padStart(3, '0')}`,
      failed_at: new Date().toISOString(),
      current_step: message.split(':')[0],
      error: message,
      next_action: 'inspect blocker and report before retry',
      user_notified: false
    });
    throw error;
  } finally {
    if (context) {
      await sleep(3000);
      await context.close().catch(() => {});
    }
    runCleanupAfterSuccess(published);
  }
})();
