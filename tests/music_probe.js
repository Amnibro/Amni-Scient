const puppeteer = require('puppeteer-core');
(async () => {
  const b = await puppeteer.launch({ executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', headless: false, args: ['--enable-unsafe-webgpu', '--autoplay-policy=no-user-gesture-required', '--window-size=1280,800'] });
  const p = await b.newPage();
  const music = [];
  p.on('response', r => { const u = r.url(); if (u.includes('/music/')) music.push(u.split('/music/')[1] + ' -> ' + r.status()); });
  await p.goto('http://localhost:8765/game/', { waitUntil: 'networkidle2', timeout: 60000 });
  await p.click('#playBtn');
  await p.waitForFunction("document.getElementById('overlay').style.display === 'none'", { timeout: 90000 });
  await new Promise(r => setTimeout(r, 8000));
  console.log(JSON.stringify({ music }, null, 1));
  await b.close();
})();