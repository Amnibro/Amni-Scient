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
  page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') logs.push(m.type() + ': ' + m.text().slice(0, 400)); });
  page.on('pageerror', e => logs.push('PAGEERROR: ' + String(e).slice(0, 400)));
  page.on('error', e => logs.push('CRASH: ' + String(e).slice(0, 400)));
  await page.evaluateOnNewDocument(() => {
    if (navigator.gpu && navigator.gpu.requestAdapter) {
      const ra = navigator.gpu.requestAdapter.bind(navigator.gpu);
      navigator.gpu.requestAdapter = async (...a) => {
        const ad = await ra(...a);
        if (ad) { const rd = ad.requestDevice.bind(ad); ad.requestDevice = async (...b) => { const d = await rd(...b); try { d.lost.then(info => console.error('DEVICE_LOST: ' + info.reason + ' ' + info.message)); d.addEventListener('uncapturederror', e => console.error('GPU_UNCAPTURED: ' + e.error.message)); } catch(_){} return d; }; }
        return ad;
      };
    }
  });
  await page.goto('http://localhost:8765/game/', { waitUntil: 'networkidle2', timeout: 60000 });
  await page.click('#playBtn');
  await new Promise(r => setTimeout(r, 13000));
  const cv = await page.$('#amni-game canvas');
  const box = cv ? await cv.boundingBox() : null;
  const cx = box ? box.x + box.width/2 : 683, cy = box ? box.y + box.height/2 : 450;
  await page.evaluate(() => { const c = document.querySelector('#amni-game canvas'); if (c) { c.setAttribute('tabindex','0'); c.focus(); } });
  await page.keyboard.press('Space');
  await new Promise(r => setTimeout(r, 1500));
  const dead = () => page.evaluate(() => { const c = document.querySelector('#amni-game canvas'); return !c || c.width <= 8; }).catch(() => true);
  const bad = () => logs.some(l => /DEVICE_LOST|CRASH|UNCAPTURED|PAGEERROR/.test(l));
  let crashedAt = -1;
  await page.keyboard.down('KeyW'); // travel forward into the glade continuously
  for (let i = 0; i < 40; i++) {
    // sweep the camera so W heads new directions + enemies come into reach
    await page.mouse.move(cx, cy); await page.mouse.down(); await page.mouse.move(cx + 150, cy, {steps: 5}); await page.mouse.up();
    // jump high then ground-pound, plus a melee swing
    await page.keyboard.press('Space');
    await new Promise(r => setTimeout(r, 280));
    await page.keyboard.down('ControlLeft'); await new Promise(r => setTimeout(r, 360)); await page.keyboard.up('ControlLeft');
    await page.keyboard.press('KeyF');
    await new Promise(r => setTimeout(r, 220));
    if (i === 12 || i === 28) await page.screenshot({ path: `${OUT_DIR}\\shot_fight_${i}.png` });
    if ((await dead()) || bad()) { crashedAt = i; break; }
  }
  await page.keyboard.up('KeyW');
  await new Promise(r => setTimeout(r, 1200));
  const ok = !(await dead()) && !bad();
  console.log(JSON.stringify({ alive: ok, crashedAt, logs: logs.slice(0, 24) }, null, 1));
  await browser.close();
})();
