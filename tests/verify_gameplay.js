const puppeteer = require('puppeteer-core');
(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    headless: false,
    args: ['--enable-unsafe-webgpu', '--window-size=1366,900'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1366, height: 900 });
  const logs = [];
  page.on('console', m => logs.push(m.type() + ': ' + m.text().slice(0, 160)));
  await page.goto('http://localhost:8765/game/', { waitUntil: 'networkidle2', timeout: 60000 });
  await page.click('#playBtn');
  await new Promise(r => setTimeout(r, 6000));
  await page.evaluate(() => { const c = document.querySelector('#amni-game canvas'); if (c) { c.setAttribute('tabindex', '0'); c.focus(); } });
  for (let i = 0; i < 4; i++) { await page.keyboard.press('Space'); await new Promise(r => setTimeout(r, 700)); }
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: 'C:/Users/antho/Documents/ai/Amni-Game/docs/gp_start.png' });
  await page.keyboard.down('KeyW');
  await new Promise(r => setTimeout(r, 2000));
  await page.keyboard.up('KeyW');
  await new Promise(r => setTimeout(r, 700));
  await page.screenshot({ path: 'C:/Users/antho/Documents/ai/Amni-Game/docs/gp_walk.png' });
  console.log(JSON.stringify({ logs: logs.slice(-8) }, null, 1));
  await browser.close();
})();
