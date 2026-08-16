const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');
const OUT_DIR = process.env.GP_OUT || path.join(__dirname, 'out');
const EDGE = process.env.EDGE_PATH || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const BASE = process.env.GP_BASE || 'http://localhost:8765';
fs.mkdirSync(OUT_DIR, { recursive: true });
(async () => {
  const browser = await puppeteer.launch({
    executablePath: EDGE,
    headless: false,
    args: ['--enable-unsafe-webgpu', '--window-size=1366,900'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1366, height: 900 });
  const logs = [];
  page.on('console', m => logs.push(m.type() + ': ' + m.text().slice(0, 160)));
  await page.goto(`${BASE}/game/`, { waitUntil: 'networkidle2', timeout: 60000 });
  await page.click('#playBtn');
  await new Promise(r => setTimeout(r, 6000));
  await page.evaluate(() => { const c = document.querySelector('#amni-game canvas'); if (c) { c.setAttribute('tabindex', '0'); c.focus(); } });
  for (let i = 0; i < 4; i++) { await page.keyboard.press('Space'); await new Promise(r => setTimeout(r, 700)); }
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: path.join(OUT_DIR, 'gp_start.png') });
  await page.keyboard.down('KeyW');
  await new Promise(r => setTimeout(r, 2000));
  await page.keyboard.up('KeyW');
  await new Promise(r => setTimeout(r, 700));
  await page.screenshot({ path: path.join(OUT_DIR, 'gp_walk.png') });
  console.log(JSON.stringify({ logs: logs.slice(-8) }, null, 1));
  await browser.close();
})();
