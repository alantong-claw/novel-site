const { chromium } = require('playwright');
const path = require('path');
const pixnetPaths = require('/home/alantong/ai-work/scripts/pixnet_paths');
const fs = require('fs');

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

  const dashboardReady = await waitForCondition(async () => ({ ok: page.url().includes('/dashboard') }), { tries: 15, delayMs: 1000 });
  if (!dashboardReady.ok) throw new Error('did-not-reach-dashboard');

  await page.goto('https://panel.pixnet.tw/posts', { waitUntil: 'domcontentloaded' });
  await sleep(1000);
  const postsReady = await waitForCondition(async () => {
    const body = (await page.locator('body').innerText().catch(() => '')).slice(0, 1500);
    return { ok: page.url().startsWith('https://panel.pixnet.tw/posts') && body.includes('我的文章') && body.includes('寫文章') };
  }, { tries: 15, delayMs: 1000 });
  if (!postsReady.ok) throw new Error('did-not-reach-posts');

  await page.getByText('寫文章', { exact: true }).first().click();
  await sleep(1000);
  const createReady = await waitForCondition(async () => {
    const start = page.getByRole('button', { name: /開始寫文章/ }).first();
    return { ok: page.url().startsWith('https://panel.pixnet.tw/posts/create') && await start.isVisible().catch(() => false) };
  }, { tries: 20, delayMs: 1000 });
  if (!createReady.ok) throw new Error('did-not-reach-create');

  await page.getByRole('button', { name: /開始寫文章/ }).first().click();
  await sleep(1000);
  const editorReady = await waitForCondition(async () => {
    const body = (await page.locator('body').innerText().catch(() => '')).slice(0, 1800);
    return { ok: /^https:\/\/panel\.pixnet\.tw\/posts\/\d+$/.test(page.url()) && body.includes('POWERED BY JODIT') };
  }, { tries: 25, delayMs: 1000 });
  if (!editorReady.ok) throw new Error('did-not-reach-editor');
}

(async () => {
  const imagePath = '/mnt/g/TMP/whisky_photo/110_Nikka_余市.jpg';
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
  await setupEditor(page);

  const titleInput = page.locator('textarea[name="title"], #文章標題').first();
  await titleInput.waitFor({ state: 'visible', timeout: 15000 });
  await titleInput.fill(`OpenClaw image probe ${Date.now()}`);
  await sleep(1000);

  const imageButtonCandidates = [
    page.getByLabel('圖片').first(),
    page.getByTitle('圖片').first(),
    page.locator('button[aria-label="圖片"]').first(),
    page.locator('span[aria-label="圖片"]').first(),
    page.locator('.jodit-toolbar-button').filter({ hasText: '圖片' }).first(),
  ];

  let clicked = false;
  let clickedBy = null;
  for (const [idx, candidate] of imageButtonCandidates.entries()) {
    const visible = await candidate.isVisible().catch(() => false);
    if (!visible) continue;
    try {
      await candidate.scrollIntoViewIfNeeded().catch(() => {});
      await sleep(500);
      await candidate.click({ timeout: 5000 });
      clicked = true;
      clickedBy = `candidate-${idx}`;
      break;
    } catch {}
  }

  if (!clicked) {
    console.log(JSON.stringify({ stage: 'image-button', failure: 'image-button-not-clicked', url: page.url(), title: await page.title(), body: (await page.locator('body').innerText().catch(() => '')).slice(0, 2200) }, null, 2));
    await context.close();
    return;
  }

  await sleep(2000);

  const dropReady = await waitForCondition(async () => {
    const found = await page.locator('.jodit-drag-and-drop__file-box, input[type="file"][accept*="image"], .jodit-dialog, .jodit-popup').count().catch(() => 0);
    return {
      ok: found > 0,
      found,
      body: (await page.locator('body').innerText().catch(() => '')).slice(0, 2500),
      dialogs: await page.locator('.jodit-drag-and-drop__file-box, input[type="file"][accept*="image"], .jodit-dialog, .jodit-popup').evaluateAll(nodes => nodes.map(n => ({ tag: n.tagName, cls: n.className, text: (n.innerText || '').slice(0, 300), outer: (n.outerHTML || '').slice(0, 400) }))).catch(() => [])
    };
  }, { tries: 10, delayMs: 1000, label: 'dropzone ready' });

  if (!dropReady.ok) {
    console.log(JSON.stringify({ stage: 'dropzone', failure: 'dropzone-not-found', clickedBy, ...dropReady }, null, 2));
    await context.close();
    return;
  }

  const dropTarget = page.locator('.jodit-drag-and-drop__file-box').first();
  const dropVisible = await dropTarget.isVisible().catch(() => false);
  if (!dropVisible) {
    console.log(JSON.stringify({ stage: 'dropzone', failure: 'jodit-dropzone-not-visible', clickedBy, ...dropReady }, null, 2));
    await context.close();
    return;
  }

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

  const imgReady = await waitForCondition(async () => {
    const bodyHtml = await page.locator('body').innerHTML().catch(() => '');
    const hasImg = bodyHtml.includes('<img') && bodyHtml.includes('pimg.1px.tw');
    return {
      ok: hasImg,
      bodyHtml: bodyHtml.slice(0, 5000),
      images: await page.locator('img').evaluateAll(nodes => nodes.map(n => ({ src: n.getAttribute('src'), alt: n.getAttribute('alt'), cls: n.getAttribute('class') }))).catch(() => [])
    };
  }, { tries: 15, delayMs: 1000, label: 'img inserted' });

  if (!imgReady.ok) {
    console.log(JSON.stringify({ stage: 'img-insert', failure: 'img-not-detected-after-drop', clickedBy, images: imgReady.images, bodyHtml: imgReady.bodyHtml }, null, 2));
    await context.close();
    return;
  }

  console.log(JSON.stringify({
    stage: 'img-insert',
    success: true,
    clickedBy,
    images: imgReady.images,
  }, null, 2));

  await sleep(8000);
  await context.close();
})();
