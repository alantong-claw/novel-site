const { chromium } = require('playwright');

const url = process.argv[2];
if (!url) {
  console.error('usage: node pixnet-check-public-article-image.js <url>');
  process.exit(1);
}

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: '/snap/bin/chromium', args: ['--no-sandbox'] });
  try {
    const page = await browser.newPage({ viewport: { width: 1400, height: 960 } });
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(4000);
    const data = await page.evaluate(() => {
      const candidates = [
        '.article-content',
        '.article-content-inner',
        '.pixnet-article-content',
        'article',
        '.post-body',
        '.entry-content',
        '.content'
      ];
      let root = null;
      for (const sel of candidates) {
        const el = document.querySelector(sel);
        if (el && (el.innerText || '').length > 50) { root = el; break; }
      }
      const scope = root || document.body;
      const imgs = [...scope.querySelectorAll('img')].map(i => i.src);
      return {
        rootTag: root ? root.tagName : null,
        rootClass: root ? root.className : null,
        pimgs: imgs.filter(s => s.includes('pimg.1px.tw')),
        imgCount: imgs.length,
        text: (scope.innerText || '').slice(0, 2000)
      };
    });
    console.log(JSON.stringify(data, null, 2));
  } finally {
    await browser.close();
  }
})();
