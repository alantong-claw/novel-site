const { chromium } = require('playwright');
const path = require('path');
const pixnetPaths = require('/home/alantong/ai-work/scripts/pixnet_paths');

const userDataDir = pixnetPaths.userDataDir;
const postUrl = 'https://panel.pixnet.tw/posts/882023561366150926';

async function probe(page, label) {
  const labelLoc = page.getByText(label, { exact: false }).first();
  const found = await labelLoc.count();
  if (!found) {
    console.log('FIELD', label, JSON.stringify({ error: 'label not found by getByText' }, null, 2));
    return;
  }
  const box = await labelLoc.boundingBox();
  const labelHtml = await labelLoc.evaluate(el => el.outerHTML).catch(() => null);
  const button = labelLoc.locator('xpath=ancestor::div[contains(@class, "group/field-label") or contains(@class, "flex")][1]/following-sibling::*//button').first();
  const buttonCount = await button.count();
  let btn;
  if (buttonCount) {
    btn = button;
  } else {
    btn = labelLoc.locator('xpath=ancestor::div[1]/following-sibling::*//button').first();
  }
  const btnHtml = await btn.evaluate(el => el.outerHTML).catch(() => null);
  const btnText = await btn.innerText().catch(() => null);
  await btn.click({ timeout: 10000 });
  await page.waitForTimeout(700);

  const popupInfo = await page.evaluate(() => {
    const visible = (el) => {
      const style = window.getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
    };
    const nodes = Array.from(document.querySelectorAll('body *')).filter(el => {
      if (!visible(el)) return false;
      const txt = (el.innerText || '').trim();
      const ph = el.getAttribute('placeholder') || '';
      const role = el.getAttribute('role') || '';
      const cls = typeof el.className === 'string' ? el.className : '';
      return txt.includes('搜尋') || txt.includes('請選擇') || txt.includes('公開') || txt.includes('留言') || ph.includes('搜尋') || role === 'option' || role === 'listbox' || cls.includes('popover') || cls.includes('cmdk') || cls.includes('radix');
    }).map(el => ({
      tag: el.tagName,
      role: el.getAttribute('role'),
      placeholder: el.getAttribute('placeholder'),
      cls: typeof el.className === 'string' ? el.className : '',
      text: (el.innerText || '').trim().slice(0, 500),
      html: (el.outerHTML || '').slice(0, 1200),
    }));
    return {
      inputs: Array.from(document.querySelectorAll('input')).filter(visible).map(el => ({
        placeholder: el.getAttribute('placeholder'),
        value: el.value,
        cls: el.className,
      })),
      nodes: nodes.slice(0, 40),
    };
  });

  console.log('FIELD', label);
  console.log(JSON.stringify({ box, labelHtml, btnText, btnHtml, popupInfo }, null, 2));
  await page.keyboard.press('Escape').catch(() => {});
  await page.waitForTimeout(300);
}

(async () => {
  const context = await chromium.launchPersistentContext(userDataDir, {
    headless: true,
    executablePath: '/snap/bin/chromium',
    args: ['--no-sandbox'],
  });
  const page = context.pages()[0] || await context.newPage();
  await page.goto(postUrl, { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);

  for (const label of [
    '文章個人分類',
    '文章全站分類 (主要)',
    '文章全站分類 (次要)',
    '文章閱讀權限',
    '文章留言權限',
  ]) {
    await probe(page, label);
  }

  await context.close();
})();
