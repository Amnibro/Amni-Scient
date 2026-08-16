const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');
const OUT_DIR = process.env.GP_OUT || path.join(__dirname, 'out');
fs.mkdirSync(OUT_DIR, { recursive: true });
(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: false,
    args: ['--enable-unsafe-webgpu', '--window-size=1366,900'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1366, height: 900 });
  const logs = [];
  page.on('console', m => logs.push(m.type() + ': ' + m.text().slice(0, 200)));
  page.on('pageerror', e => logs.push('PAGEERROR: ' + String(e).slice(0, 200)));
  await page.goto('http://localhost:8765/game/', { waitUntil: 'networkidle2', timeout: 60000 });
  const wgpu = await page.evaluate(() => !!navigator.gpu);
  await page.click('#playBtn');
  await new Promise(r => setTimeout(r, 5000));
  await page.screenshot({ path: path.join(OUT_DIR, 'web_t5.png') });
  await new Promise(r => setTimeout(r, 15000));
  const geom = await page.evaluate(() => {
    const c = document.querySelector('#amni-game canvas');
    if (!c) return null;
    const r = c.getBoundingClientRect();
    return { attrW: c.width, attrH: c.height, cssW: r.width, cssH: r.height, dpr: window.devicePixelRatio };
  });
  await page.screenshot({ path: path.join(OUT_DIR, 'web_t20.png') });
  console.log(JSON.stringify({ wgpu, geom, logs: logs.slice(0, 12) }, null, 1));
  await browser.close();
})();