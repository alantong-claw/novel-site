const { chromium } = require('playwright');
const path = require('path');
const pixnetPaths = require('/home/alantong/ai-work/scripts/pixnet_paths');

const postUrl = process.argv[2];
if (!postUrl) {
  console.error('usage: node pixnet-check-post-image.js <postUrl>');
  process.exit(1);
}

function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

(async () => {
  const userDataDir = pixnetPaths.userDataDir;
  const context = await chromium.launchPersistentContext(userDataDir, {
    headless: true,
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
    await page.goto(postUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await sleep(3000);
    const result = await page.evaluate(() => {
      const imgs = Array.from(document.querySelectorAll('img')).map(img => ({
        src: img.getAttribute('src') || '',
        alt: img.getAttribute('alt') || '',
        cls: img.getAttribute('class') || ''
      }));
      const content = document.body.innerHTML;
      return {
        url: location.href,
        title: document.title,
        imageCount: imgs.length,
        pimgCount: imgs.filter(x => x.src.includes('pimg.1px.tw')).length,
        hasPimgInHtml: content.includes('pimg.1px.tw'),
        imgs: imgs.slice(0, 20),
        bodySnippet: document.body.innerText.slice(0, 2000)
      };
    });
    console.log(JSON.stringify(result, null, 2));
  } finally {
    await context.close();
  }
})();
