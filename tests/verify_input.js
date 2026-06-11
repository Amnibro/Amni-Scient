const puppeteer = require('puppeteer-core');
(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: false,
    args: ['--enable-unsafe-webgpu', '--window-size=1366,900'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1366, height: 900 });
  const errors = [];
  page.on('pageerror', e => errors.push(String(e).slice(0, 200)));
  await page.goto('http://localhost:8765/game/', { waitUntil: 'networkidle2', timeout: 60000 });
  await page.click('#playBtn');
  await new Promise(r => setTimeout(r, 14000));
  await page.click('#amni-game canvas');
  await new Promise(r => setTimeout(r, 500));
  await page.keyboard.press('Space');
  await new Promise(r => setTimeout(r, 3500));
  await page.screenshot({ path: 'C:\\Users\\antho\\Documents\\ai\\Amni-Game\\docs\\web_started.png' });
  await page.keyboard.down('KeyW');
  await new Promise(r => setTimeout(r, 2000));
  await page.keyboard.up('KeyW');
  await page.keyboard.press('Space');
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: 'C:\\Users\\antho\\Documents\\ai\\Amni-Game\\docs\\web_walked.png' });
  console.log(JSON.stringify({ errors: errors.slice(0, 4) }));
  await browser.close();
})();