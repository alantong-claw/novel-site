const { waitForCondition } = require('./pixnet-upload-helper');

function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

async function ensureLoggedInToPosts(page) {
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
        body,
      };
    }, { tries: 20, delayMs: 1000 });
    if (postsReady.ok) return postsReady;
  }
  throw new Error(`did-not-reach-posts:${postsReady.url || page.url()}`);
}

async function openExistingPostEditor(page, postUrl, { expectedTitle } = {}) {
  await ensureLoggedInToPosts(page);
  await page.goto(postUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await sleep(3000);

  const editorReady = await waitForCondition(async () => {
    const titleInput = page.locator('textarea[name="title"], #文章標題').first();
    const titleVisible = await titleInput.isVisible().catch(() => false);
    const titleValue = titleVisible ? await titleInput.inputValue().catch(() => '') : '';
    const categoryVisible = await page.locator('label').filter({ hasText: '文章個人分類' }).first().isVisible().catch(() => false);
    const ok = /^https:\/\/panel\.pixnet\.tw\/posts\/\d+$/.test(page.url()) && titleVisible && categoryVisible && (!expectedTitle || titleValue === expectedTitle);
    return { ok, url: page.url(), titleValue, categoryVisible };
  }, { tries: 15, delayMs: 1000 });

  if (!editorReady.ok) {
    throw new Error(`existing-post-editor-not-ready:${editorReady.url || page.url()}:${editorReady.titleValue || ''}`);
  }

  return editorReady;
}

module.exports = { ensureLoggedInToPosts, openExistingPostEditor, sleep };
