const fs = require('fs');
const path = require('path');

async function waitForCondition(checkFn, { tries = 20, delayMs = 1000 } = {}) {
  let last = null;
  for (let i = 0; i < tries; i++) {
    last = await checkFn();
    if (last && last.ok) return last;
    await new Promise(resolve => setTimeout(resolve, delayMs));
  }
  return last || { ok: false };
}

async function uploadImageStrict(page, imagePath) {
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
  const popupReady = await waitForCondition(async () => {
    const dropVisible = await page.locator('.jodit-drag-and-drop__file-box').first().isVisible().catch(() => false);
    return { ok: dropVisible };
  }, { tries: 10, delayMs: 500 });
  if (!popupReady.ok) {
    throw new Error('image-popup-not-ready');
  }

  await new Promise(resolve => setTimeout(resolve, 500));

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
  return uploaded;
}

module.exports = { uploadImageStrict, waitForCondition };
