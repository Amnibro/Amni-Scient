const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');
const OUT_DIR = process.env.GP_OUT || path.join(__dirname, 'out');
fs.mkdirSync(OUT_DIR, { recursive: true });
(async () => {
  const b = await puppeteer.launch({ executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', headless: false, args: ['--enable-unsafe-webgpu', '--window-size=1366,900'] });
  const p = await b.newPage();
  await p.setViewport({ width: 1366, height: 900 });
  await p.goto('http://localhost:8765/game/', { waitUntil: 'networkidle2', timeout: 60000 });
  const t0 = Date.now();
  await p.click('#playBtn');
  await p.waitForFunction("document.getElementById('overlay').style.display === 'none'", { timeout: 90000 });
  const tPlayable = (Date.now() - t0) / 1000;
  await new Promise(r => setTimeout(r, 9000));
  await p.screenshot({ path: path.join(OUT_DIR, 'defer_web.png') });
  console.log(JSON.stringify({ secondsToPlayable: tPlayable }));
  await b.close();
})();