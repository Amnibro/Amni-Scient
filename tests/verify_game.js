const puppeteer = require('puppeteer-core');
(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: 'new',
    args: ['--use-angle=default', '--enable-unsafe-webgpu', '--window-size=1366,900'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1366, height: 900 });
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text().slice(0, 300)); });
  page.on('pageerror', e => errors.push(String(e).slice(0, 300)));
  await page.goto('http://localhost:8765/game/', { waitUntil: 'networkidle2', timeout: 60000 });
  await page.click('#playBtn');
  await new Promise(r => setTimeout(r, 20000));
  const probe = await page.evaluate(() => {
    const c = document.querySelector('#amni-game canvas');
    if (!c) return { canvas: false };
    const gl = c.getContext('webgl2');
    return { canvas: true, w: c.width, h: c.height, overlayGone: document.getElementById('overlay').style.display === 'none' };
  });
  await page.screenshot({ path: 'C:\\Users\\antho\\Documents\\ai\\amni-scient-site\\game\\web_probe.png' });
  console.log(JSON.stringify({ probe, errors: errors.slice(0, 6) }, null, 1));
  await browser.close();
})();
