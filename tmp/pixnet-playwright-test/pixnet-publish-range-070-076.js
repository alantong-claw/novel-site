const { chromium } = require('playwright');
const path = require('path');
const pixnetPaths = require('/home/alantong/ai-work/scripts/pixnet_paths');
const fs = require('fs');
const { execFileSync } = require('child_process');

const ROOT = '/home/alantong/ai-work';
const TASK_DIR = path.join(ROOT, 'memory', 'tasks');
const RANGE_TASK_STATE = path.join(TASK_DIR, 'pixnet-whisky-070-076.json');
const MAX_SELF_RECOVERY_ROUNDS = 3;
const TELEGRAM_TARGET = '8707204748';

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

function setTaskState(status, fields = {}) {
  const args = [path.join(ROOT, 'scripts', 'task_state.py'), RANGE_TASK_STATE, status];
  for (const [k, v] of Object.entries(fields)) args.push(`${k}=${String(v)}`);
  try {
    const output = execFileSync('python3', args, { encoding: 'utf8' }).trim();
    if (output) console.error(`[task_state] ${output}`);
  } catch (error) {
    console.error('[task_state] failed:', error?.message || error);
  }
}

function sendTelegram(message) {
  execFileSync('openclaw', ['message', 'send', '--channel', 'telegram', '--target', TELEGRAM_TARGET, '--message', message], { encoding: 'utf8' });
}

function buildSpec(idNum) {
  const raw = execFileSync('node', [
    path.join('/home/alantong/ai-work/scripts', 'build_pixnet_whisky_post.js'),
    '/mnt/g/TMP/whisky_photo/Whisky365_NoteAll.csv',
    String(Number(idNum))
  ], { encoding: 'utf8' });
  const spec = JSON.parse(raw);
  const id = String(idNum).padStart(3, '0');
  const files = fs.readdirSync('/mnt/g/TMP/whisky_photo').sort();
  let imageName;
  if (id === '076') imageName = '076_Glenfarclas15_claw.jpg';
  else imageName = files.find(name => name.startsWith(`${id}_`));
  if (!imageName) throw new Error(`image-not-found:${id}`);
  return { num: id, title: spec.title, tags: spec.tags, image: path.join('/mnt/g/TMP/whisky_photo', imageName) };
}

async function openFreshEditor(page, item) {
  let postsReady = { ok: false, url: page.url() };
  for (let loginAttempt = 1; loginAttempt <= 2; loginAttempt++) {
    setTaskState('self_recovering', {
      task: 'pixnet-whisky-070-076',
      current_step: `login_to_posts_${item.num}`,
      last_ok_step: `spec_built_${item.num}`,
      recovery_round: loginAttempt,
      note: `trying login to posts for ${item.num}`
    });
    await page.goto('https://account.pixnet.tw/login', { waitUntil: 'domcontentloaded' });
    await sleep(1000);
    const username = page.locator('input[name="username"]');
    if (await username.isVisible().catch(() => false)) {
      await username.fill('alantong');
      await page.locator('input[name="password"]').fill('xxxx3721?!');
      await page.locator('button[type="submit"]').first().click();
      await sleep(2500);
    }
    await page.goto('https://panel.pixnet.tw/posts', { waitUntil: 'domcontentloaded' });
    const postsReadyLocal = await waitForCondition(async () => {
      const body = (await page.locator('body').innerText().catch(() => '')).slice(0, 2000);
      return { ok: page.url().startsWith('https://panel.pixnet.tw/posts') && body.includes('我的文章') && body.includes('寫文章'), url: page.url(), body };
    }, { tries: 20, delayMs: 1000 });
    postsReady = postsReadyLocal;
    if (postsReady.ok) {
      setTaskState('running', {
        task: 'pixnet-whisky-070-076',
        current_step: `posts_ready_${item.num}`,
        last_ok_step: `login_to_posts_${item.num}`,
        current_item: item.num
      });
      break;
    }
  }
  if (!postsReady.ok) throw new Error(`did-not-reach-posts:${postsReady.url || page.url()}`);

  await page.getByText('寫文章', { exact: true }).first().click();
  const createReady = await waitForCondition(async () => {
    const start = page.getByRole('button', { name: /開始寫文章/ }).first();
    return { ok: page.url().startsWith('https://panel.pixnet.tw/posts/create') && await start.isVisible().catch(() => false), url: page.url() };
  }, { tries: 20, delayMs: 1000 });
  if (!createReady.ok) throw new Error(`did-not-reach-create:${createReady.url || page.url()}`);

  const start = page.getByRole('button', { name: /開始寫文章/ }).first();
  let reached = { ok: false, url: page.url() };
  for (let attempt = 1; attempt <= 3; attempt++) {
    setTaskState('self_recovering', {
      task: 'pixnet-whisky-070-076',
      current_step: `create_to_editor_${item.num}`,
      last_ok_step: `reached_posts_create_${item.num}`,
      recovery_round: attempt,
      note: `trying create to editor for ${item.num}`
    });
    await start.scrollIntoViewIfNeeded();
    await sleep(300);
    try { await start.click({ timeout: 10000 }); } catch { await start.click({ force: true, timeout: 10000 }); }
    await sleep(1500);
    reached = await waitForCondition(async () => {
      const label = page.locator('label').filter({ hasText: '文章個人分類' }).first();
      return { ok: /^https:\/\/panel\.pixnet\.tw\/posts\/\d+$/.test(page.url()) && await label.isVisible().catch(() => false), url: page.url() };
    }, { tries: 25, delayMs: 1000 });
    if (reached.ok) break;
    await page.reload({ waitUntil: 'domcontentloaded' }).catch(() => {});
    await sleep(1000);
  }
  if (!reached.ok) throw new Error(`did-not-reach-editor:${reached.url || page.url()}`);
  setTaskState('running', {
    task: 'pixnet-whisky-070-076',
    current_step: `editor_ready_${item.num}`,
    last_ok_step: `reached_editor_${item.num}`,
    current_item: item.num
  });
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
    try { await candidate.click({ timeout: 5000 }); break; } catch {}
  }
  await sleep(1200);

  const beforeEditorImageCount = await page.locator('.jodit-wysiwyg img, .jodit-workplace img, .jodit-container img').count().catch(() => 0);

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
  }, { selector: '.jodit-drag-and-drop__file-box', fileName: path.basename(imagePath), base64 });

  const uploaded = await waitForCondition(async () => {
    const editorImgs = await page.locator('.jodit-wysiwyg img, .jodit-workplace img, .jodit-container img').evaluateAll(nodes =>
      nodes.map(n => ({ src: n.getAttribute('src') || '', outer: (n.outerHTML || '').slice(0, 300) }))
    ).catch(() => []);
    const pimgEditorImgs = editorImgs.filter(x => x.src.includes('pimg.1px.tw'));
    return {
      ok: pimgEditorImgs.length > 0 && editorImgs.length > beforeEditorImageCount,
      editorImageCount: editorImgs.length,
      pimgEditorImageCount: pimgEditorImgs.length,
      editorImgs,
    };
  }, { tries: 25, delayMs: 1000 });
  if (!uploaded.ok) {
    throw new Error(`image-upload-not-confirmed:editorImgs=${uploaded.editorImageCount || 0}:pimg=${uploaded.pimgEditorImageCount || 0}`);
  }
}

async function publishItem(page, item) {
  await openFreshEditor(page, item);
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
    const body = (await page.locator('body').innerText().catch(() => '')).slice(0, 12000);
    const lines = body.split('\n');
    const titleIndex = lines.findIndex(x => x.trim() === item.title);
    const postUrl = titleIndex >= 1 ? lines[titleIndex - 1] : '';
    return { ok: page.url().startsWith('https://panel.pixnet.tw/posts') && body.includes(item.title), postUrl, body };
  }, { tries: 25, delayMs: 1000 });
  if (!published.ok) throw new Error(`publish-not-verified:${item.num}`);
  setTaskState('running', {
    task: 'pixnet-whisky-070-076',
    current_step: `published_${item.num}`,
    last_ok_step: `published_${item.num}`,
    current_item: item.num,
    note: published.postUrl || item.title
  });
  return { num: item.num, title: item.title, postUrl: published.postUrl };
}

(async () => {
  const items = [];
  for (let i = 70; i <= 76; i++) items.push(buildSpec(i));
  setTaskState('running', {
    task: 'pixnet-whisky-070-076',
    current_step: 'specs_built',
    last_ok_step: 'specs_built',
    note: '070-076 ready to publish',
    recovery_round: 0,
    current_item: '070'
  });

  const userDataDir = pixnetPaths.userDataDir;
  const context = await chromium.launchPersistentContext(userDataDir, {
    headless: false,
    executablePath: '/snap/bin/chromium',
    env: { ...process.env, XDG_RUNTIME_DIR: '/run/user/1000', WAYLAND_DISPLAY: 'wayland-0', DISPLAY: ':0' },
    args: ['--no-sandbox'],
    viewport: { width: 1400, height: 960 },
  });
  const results = [];
  let stuckKey = '';
  let sameSpotRounds = 0;
  try {
    const page = context.pages()[0] || await context.newPage();
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

          setTaskState('self_recovering', {
            task: 'pixnet-whisky-070-076',
            current_step: currentKey,
            last_ok_step: results.length ? `published_${results[results.length - 1].num}` : 'specs_built',
            recovery_round: sameSpotRounds,
            current_item: item.num,
            note: message,
            stuck_key: currentKey
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
      if (i < items.length - 1) await sleep(5 * 60 * 1000);
    }
    setTaskState('done', {
      task: 'pixnet-whisky-070-076',
      current_step: 'all_published',
      last_ok_step: 'all_published',
      note: results.map(r => r.num).join(','),
      user_notified: false
    });

    const lines = ['PIXNET whisky 070-076 已全部發完：'];
    for (const r of results) lines.push(`${r.num} ${r.postUrl}`);
    sendTelegram(lines.join('\n'));

    setTaskState('done', {
      task: 'pixnet-whisky-070-076',
      current_step: 'all_published_notified',
      last_ok_step: 'all_published_notified',
      note: results.map(r => r.num).join(','),
      user_notified: true
    });

    console.log(JSON.stringify({ success: true, results }, null, 2));
  } catch (error) {
    const message = error?.message || String(error);
    setTaskState('blocked', {
      task: 'pixnet-whisky-070-076',
      failed_at: new Date().toISOString(),
      current_step: stuckKey || message.split(':')[0],
      error: message,
      next_action: 'inspect blocker and report before retry',
      user_notified: false,
      note: results.length ? `last published ${results[results.length - 1].num}` : 'none published'
    });
    throw error;
  } finally {
    await sleep(3000);
    await context.close();
  }
})();
