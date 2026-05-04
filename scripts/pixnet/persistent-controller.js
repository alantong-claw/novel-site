const { chromium } = require('playwright');
const path = require('path');
const pixnetPaths = require('/home/alantong/ai-work/scripts/pixnet_paths');
const fs = require('fs');

const userDataDir = pixnetPaths.userDataDir;
const statusFile = pixnetPaths.statusFile;
const commandFile = pixnetPaths.commandFile;

function writeStatus(data) {
  fs.writeFileSync(statusFile, JSON.stringify({ ts: new Date().toISOString(), ...data }, null, 2));
}

async function pause(page, ms = 1000) {
  await page.waitForTimeout(ms);
}

async function enterPixnetEditor(page) {
  if (/\/posts\/create(?:\?.*)?$/.test(page.url())) {
    const startButton = page.getByRole('button', { name: /開始寫文章/ }).first();
    if (await startButton.count()) {
      await startButton.scrollIntoViewIfNeeded();
      await pause(page, 1000);
      await startButton.click({ timeout: 10000 });
      await pause(page, 1800);
    }
  }
  await page.waitForLoadState('domcontentloaded').catch(() => {});
  await pause(page, 1000);
}

async function openPixnetFieldButton(page, label) {
  const byLabelFor = page.locator(`xpath=//label[normalize-space(.)="${label}"]/following-sibling::button | //label[normalize-space(.)="${label}"]/parent::*//button[(@role="combobox" or @data-slot="popover-trigger")][1]`).first();
  const fallback = page.locator(`xpath=//div[normalize-space(.)="${label}"]/ancestor::div[contains(@class,"group/field") or contains(@class,"group/field-label")][1]//button[(@role="combobox" or @data-slot="popover-trigger")][1]`).first();
  const button = await byLabelFor.count() ? byLabelFor : fallback;
  await button.scrollIntoViewIfNeeded();
  await pause(page, 1000);
  await button.click({ timeout: 10000 });
  await pause(page, 1000);
  return button;
}

async function findVisibleSearchInput(page) {
  const input = page.locator('input[placeholder*="搜尋"]').filter({ hasNot: page.locator('[aria-hidden="true"]') }).last();
  await input.waitFor({ state: 'visible', timeout: 3000 });
  return input;
}

async function clickVisibleOption(page, text) {
  const option = page.locator([
    `[role="option"]:has-text("${text}")`,
    `[cmdk-item]:has-text("${text}")`,
    `button:has-text("${text}")`,
    `div:has-text("${text}")`,
    `span:has-text("${text}")`
  ].join(', ')).filter({ hasNot: page.locator('[aria-hidden="true"]') }).last();
  await option.waitFor({ state: 'visible', timeout: 5000 });
  await pause(page, 1000);
  await option.click({ timeout: 5000 });
  await pause(page, 1200);
}

async function setPixnetDropdown(page, { label, value, searchable = false }) {
  await openPixnetFieldButton(page, label);
  if (searchable) {
    const input = await findVisibleSearchInput(page);
    await input.fill('');
    await pause(page, 800);
    await input.type(value, { delay: 80 });
    await pause(page, 1200);
  }
  await clickVisibleOption(page, value);
  const button = page.locator(`xpath=//label[normalize-space(.)="${label}"]/following-sibling::button | //label[normalize-space(.)="${label}"]/parent::*//button[(@role="combobox" or @data-slot="popover-trigger")][1]`).first();
  const selectedText = (await button.innerText()).trim();
  if (!selectedText.includes(value)) {
    throw new Error(`Failed to set ${label} -> ${value}, got: ${selectedText}`);
  }
  return selectedText;
}

(async () => {
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
  if (page.url() === 'about:blank') {
    await page.goto('https://panel.pixnet.tw/posts', { waitUntil: 'domcontentloaded' });
  }
  writeStatus({ state: 'ready', url: page.url(), title: await page.title() });

  let lastCommandRaw = '';

  setInterval(async () => {
    try {
      if (!fs.existsSync(commandFile)) return;
      const raw = fs.readFileSync(commandFile, 'utf8');
      if (!raw || raw === lastCommandRaw) return;
      lastCommandRaw = raw;
      const cmd = JSON.parse(raw);

      if (cmd.action === 'goto' && cmd.url) {
        await page.goto(cmd.url, { waitUntil: 'domcontentloaded' });
        await pause(page, 1200);
        writeStatus({ state: 'navigated', url: page.url(), title: await page.title() });
      } else if (cmd.action === 'clickText' && cmd.text) {
        const target = page.getByText(cmd.text, { exact: !!cmd.exact }).first();
        await pause(page, cmd.preWaitMs || 1000);
        await target.click({ timeout: cmd.timeout || 10000 });
        await pause(page, cmd.waitMs || 1500);
        writeStatus({ state: 'clicked', clickedText: cmd.text, url: page.url(), title: await page.title() });
      } else if (cmd.action === 'clickRole' && cmd.role && cmd.name) {
        const target = page.getByRole(cmd.role, { name: cmd.name, exact: !!cmd.exact }).first();
        await pause(page, cmd.preWaitMs || 1000);
        await target.click({ timeout: cmd.timeout || 10000 });
        await pause(page, cmd.waitMs || 1500);
        writeStatus({ state: 'clicked', clickedRole: cmd.role, clickedName: cmd.name, url: page.url(), title: await page.title() });
      } else if (cmd.action === 'fill' && cmd.selector && typeof cmd.value === 'string') {
        await page.locator(cmd.selector).first().fill(cmd.value, { timeout: cmd.timeout || 10000 });
        await page.waitForTimeout(cmd.waitMs || 500);
        writeStatus({ state: 'filled', selector: cmd.selector, url: page.url(), title: await page.title() });
      } else if (cmd.action === 'setContentEditable' && cmd.selector && typeof cmd.value === 'string') {
        const target = page.locator(cmd.selector).first();
        await target.click({ timeout: cmd.timeout || 10000 });
        await page.keyboard.press(process.platform === 'darwin' ? 'Meta+A' : 'Control+A');
        await page.keyboard.type(cmd.value, { delay: cmd.delay || 10 });
        await page.waitForTimeout(cmd.waitMs || 800);
        writeStatus({ state: 'content-set', selector: cmd.selector, url: page.url(), title: await page.title() });
      } else if (cmd.action === 'uploadFile' && cmd.selector && cmd.path) {
        await page.locator(cmd.selector).first().setInputFiles(cmd.path, { timeout: cmd.timeout || 10000 });
        await page.waitForTimeout(cmd.waitMs || 3000);
        writeStatus({ state: 'file-uploaded', selector: cmd.selector, path: cmd.path, url: page.url(), title: await page.title() });
      } else if (cmd.action === 'simulateDropImage' && cmd.selector && cmd.path) {
        const fileName = path.basename(cmd.path);
        const buffer = fs.readFileSync(cmd.path);
        const base64 = buffer.toString('base64');
        await page.evaluate(async ({ selector, fileName, mimeType, base64 }) => {
          const target = document.querySelector(selector);
          if (!target) throw new Error(`Drop target not found: ${selector}`);
          const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
          const file = new File([bytes], fileName, { type: mimeType || 'image/jpeg' });
          const dataTransfer = new DataTransfer();
          dataTransfer.items.add(file);
          const dragEnter = new DragEvent('dragenter', { bubbles: true, cancelable: true, dataTransfer });
          const dragOver = new DragEvent('dragover', { bubbles: true, cancelable: true, dataTransfer });
          const drop = new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer });
          target.dispatchEvent(dragEnter);
          target.dispatchEvent(dragOver);
          target.dispatchEvent(drop);
        }, {
          selector: cmd.selector,
          fileName,
          mimeType: cmd.mimeType || 'image/jpeg',
          base64
        });
        await page.waitForTimeout(cmd.waitMs || 5000);
        writeStatus({ state: 'drop-simulated', selector: cmd.selector, path: cmd.path, url: page.url(), title: await page.title() });
      } else if (cmd.action === 'pressKey' && cmd.key) {
        await page.keyboard.press(cmd.key);
        await page.waitForTimeout(cmd.waitMs || 500);
        writeStatus({ state: 'key-pressed', key: cmd.key, url: page.url(), title: await page.title() });
      } else if (cmd.action === 'clickSelector' && cmd.selector) {
        await page.locator(cmd.selector).first().click({ timeout: cmd.timeout || 10000 });
        await page.waitForTimeout(cmd.waitMs || 1000);
        writeStatus({ state: 'clicked-selector', selector: cmd.selector, url: page.url(), title: await page.title() });
      } else if (cmd.action === 'clickSelectorNth' && cmd.selector && Number.isInteger(cmd.index)) {
        await page.locator(cmd.selector).nth(cmd.index).click({ timeout: cmd.timeout || 10000 });
        await page.waitForTimeout(cmd.waitMs || 1000);
        writeStatus({ state: 'clicked-selector-nth', selector: cmd.selector, index: cmd.index, url: page.url(), title: await page.title() });
      } else if (cmd.action === 'fillTagInput' && typeof cmd.value === 'string') {
        const target = page.locator('input[placeholder="+ 新增標籤"]').first();
        await target.click({ timeout: cmd.timeout || 10000 });
        await target.fill(cmd.value, { timeout: cmd.timeout || 10000 });
        await page.keyboard.press('Enter');
        await page.waitForTimeout(cmd.waitMs || 1000);
        writeStatus({ state: 'tag-added', value: cmd.value, url: page.url(), title: await page.title() });
      } else if (cmd.action === 'setPixnetDropdown' && cmd.label && typeof cmd.value === 'string') {
        const selectedText = await setPixnetDropdown(page, {
          label: cmd.label,
          value: cmd.value,
          searchable: !!cmd.searchable
        });
        writeStatus({ state: 'pixnet-dropdown-set', label: cmd.label, value: cmd.value, selectedText, url: page.url(), title: await page.title() });
      } else if (cmd.action === 'setPixnetPostDefaults') {
        await enterPixnetEditor(page);
        const results = [];
        for (const field of [
          { label: '文章個人分類', value: 'Whisky', searchable: true },
          { label: '文章全站分類 (主要)', value: '美味食記', searchable: true },
          { label: '文章全站分類 (次要)', value: '生活綜合', searchable: true },
          { label: '文章閱讀權限', value: '公開', searchable: false },
          { label: '文章留言權限', value: '可留言，留言公開', searchable: false }
        ]) {
          const selectedText = await setPixnetDropdown(page, field);
          results.push({ ...field, selectedText });
        }
        writeStatus({ state: 'pixnet-post-defaults-set', results, url: page.url(), title: await page.title() });
      } else if (cmd.action === 'inspectFrames') {
        const frameData = [];
        for (const frame of page.frames()) {
          try {
            const text = await frame.locator('body').innerText().catch(() => '');
            const fileInputs = await frame.locator('input[type="file"], input[accept*="image"]').evaluateAll(nodes =>
              nodes.map(n => ({
                name: n.getAttribute('name'),
                accept: n.getAttribute('accept'),
                class: n.getAttribute('class'),
                outer: (n.outerHTML || '').slice(0, 500)
              }))
            ).catch(() => []);
            const matches = await frame.locator('button, [role="button"], label, a, div, span').evaluateAll(nodes =>
              nodes.map(n => ({
                tag: n.tagName,
                text: (n.innerText || '').trim().slice(0, 160),
                cls: n.getAttribute('class'),
                aria: n.getAttribute('aria-label')
              })).filter(x => /點擊或拖曳圖片到此處|圖片|上傳|拖曳|upload|image/i.test(`${x.text} ${x.cls || ''} ${x.aria || ''}`))
            ).catch(() => []);
            frameData.push({
              name: frame.name(),
              url: frame.url(),
              text: (text || '').slice(0, 2000),
              fileInputs: fileInputs.slice(0, 20),
              matches: matches.slice(0, 50)
            });
          } catch (e) {
            frameData.push({ name: frame.name(), url: frame.url(), error: String(e) });
          }
        }
        writeStatus({ state: 'frame-inspection', url: page.url(), title: await page.title(), frames: frameData });
      } else if (cmd.action === 'snapshot') {
        const bodyText = (await page.locator('body').innerText()).slice(0, 5000);
        const buttons = await page.locator('button').allInnerTexts().catch(() => []);
        const links = await page.locator('a').allInnerTexts().catch(() => []);
        const inputs = await page.locator('input, textarea').evaluateAll(nodes =>
          nodes.map(n => ({
            tag: n.tagName,
            type: n.getAttribute('type'),
            name: n.getAttribute('name'),
            placeholder: n.getAttribute('placeholder'),
            aria: n.getAttribute('aria-label'),
            value: n.value || ''
          }))
        ).catch(() => []);
        const editables = await page.locator('[contenteditable="true"]').evaluateAll(nodes =>
          nodes.map(n => ({
            text: (n.innerText || '').slice(0, 200),
            html: (n.innerHTML || '').slice(0, 3000),
            aria: n.getAttribute('aria-label'),
            role: n.getAttribute('role'),
            class: n.getAttribute('class')
          }))
        ).catch(() => []);
        const images = await page.locator('img').evaluateAll(nodes =>
          nodes.map(n => ({
            src: n.getAttribute('src'),
            alt: n.getAttribute('alt'),
            class: n.getAttribute('class'),
            width: n.getAttribute('width'),
            height: n.getAttribute('height')
          }))
        ).catch(() => []);
        const toolbarButtons = await page.locator('button[aria-label], [role="button"][aria-label], .jodit-toolbar-button, button, [role="button"], label').evaluateAll(nodes =>
          nodes.map(n => ({
            text: (n.innerText || '').trim().slice(0, 120),
            aria: n.getAttribute('aria-label'),
            title: n.getAttribute('title'),
            class: n.getAttribute('class')
          })).filter(x => x.text || x.aria || x.title)
        ).catch(() => []);
        const fileInputs = await page.locator('input[type="file"], input[accept*="image"]').evaluateAll(nodes =>
          nodes.map(n => ({
            name: n.getAttribute('name'),
            accept: n.getAttribute('accept'),
            class: n.getAttribute('class'),
            outer: (n.outerHTML || '').slice(0, 500)
          }))
        ).catch(() => []);
        const dialogs = await page.locator('[role="dialog"], .jodit-dialog, .jodit-popup, .jodit-ui-popup, [class*="dialog"], [class*="popup"], [class*="upload"], [class*="drop"], [class*="drag"]').evaluateAll(nodes =>
          nodes.map(n => ({
            tag: n.tagName,
            class: n.getAttribute('class'),
            text: (n.innerText || '').slice(0, 1200),
            outer: (n.outerHTML || '').slice(0, 800)
          }))
        ).catch(() => []);
        const frames = page.frames().map(frame => ({
          name: frame.name(),
          url: frame.url()
        }));
        writeStatus({
          state: 'snapshot',
          url: page.url(),
          title: await page.title(),
          bodyText,
          buttons: buttons.slice(0, 60),
          links: links.slice(0, 60),
          inputs: inputs.slice(0, 60),
          editables: editables.slice(0, 20),
          images: images.slice(0, 40),
          toolbarButtons: toolbarButtons.slice(0, 80),
          fileInputs: fileInputs.slice(0, 20),
          dialogs: dialogs.slice(0, 20),
          frames
        });
      }
    } catch (err) {
      writeStatus({ state: 'error', error: String(err) });
    }
  }, 1000);

  process.stdin.resume();
})();
