const { chromium } = require('playwright');

const url = process.argv[2];
if (!url) {
  console.error('usage: node pixnet-check-public-image.js <url>');
  process.exit(1);
}

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: '/snap/bin/chromium', args: ['--no-sandbox'] });
  try {
    const page = await browser.newPage({ viewport: { width: 1400, height: 960 } });
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(4000);
    const data = await page.evaluate(() => ({
      title: document.title,
      pimgs: [...document.querySelectorAll('img')].map(i => i.src).filter(s => s.includes('pimg.1px.tw')),
      allImgs: [...document.querySelectorAll('img')].map(i => i.src).slice(0, 30),
      body: (document.body.innerText || '').slice(0, 3000)
    }));
    console.log(JSON.stringify(data, null, 2));
  } finally {
    await browser.close();
  }
})();
