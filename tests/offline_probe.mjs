// Records what each app loads from outside its own folders, for tools/build-offline.amni.
//   node tests/offline_probe.mjs      then      hc run tools/build-offline.amni
// Opens every app from /offline-packs/apps.txt in a headless browser against the local stand-in for
// Cloudflare Pages and writes tools/offline-probe.txt, one line per request:
//   id <TAB> same <TAB> /path          a file on this site
//   id <TAB> cdn  <TAB> https://...    a library file from a public CDN
// Run it again when an app starts loading something new from a shared folder or a CDN.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { startServer, ROOT } from './pages_server.mjs';
const { chromium } = createRequire(import.meta.url)('playwright');

const CDN_HOSTS = new Set(['cdn.jsdelivr.net', 'unpkg.com', 'cdnjs.cloudflare.com', 'cdn.plot.ly', 'fonts.googleapis.com', 'fonts.gstatic.com']);
// pages besides an app's start page that pull in their own files
const MORE = {
  construct: ['/deck/', '/elec/', '/floor/', '/frame/', '/garden/', '/hvac/', '/patio/', '/plan/', '/plumb/', '/pool/', '/roof/'],
  research: ['/research/millennium_sim/', '/research/reffelt-constant.html', '/research/navier-stokes-program.html', '/research/millennium_sim/fluid_sim_3d.html', '/research/millennium_sim/navier-stokes-proof.html'],
};
const apps = fs.readFileSync(path.join(ROOT, 'offline-packs', 'apps.txt'), 'utf8').split('\n').filter(Boolean).map(l => { const f = l.split('\t'); return { id: f[0], url: f[3] }; });
const { server, url } = await startServer();
const browser = await chromium.launch();
const lines = [];
for (const app of apps) {
  const same = new Set(), cdn = new Set();
  for (const start of [app.url, ...(MORE[app.id] || [])]) {
    // service workers blocked, so every request is seen here
    const ctx = await browser.newContext({ serviceWorkers: 'block' });
    const page = await ctx.newPage();
    page.on('request', r => {
      try {
        const u = new URL(r.url());
        if (r.method() !== 'GET') return;
        if (u.origin === url) same.add(u.pathname);
        else if (CDN_HOSTS.has(u.hostname)) cdn.add(u.href);
      } catch (_) {}
    });
    try {
      await page.goto(url + start, { waitUntil: 'load', timeout: 45000 });
      await page.waitForLoadState('networkidle', { timeout: 12000 }).catch(() => {});
      await page.waitForTimeout(1500);
    } catch (e) { console.warn('probe ' + app.id + ' ' + start + ': ' + e.message.split('\n')[0]); }
    await ctx.close();
  }
  for (const u of [...same].sort()) lines.push(app.id + '\tsame\t' + u);
  for (const u of [...cdn].sort()) lines.push(app.id + '\tcdn\t' + u);
  console.log('probed ' + app.id + ': ' + same.size + ' on this site, ' + cdn.size + ' cdn');
}
await browser.close();
server.close();
fs.writeFileSync(path.join(ROOT, 'tools', 'offline-probe.txt'), lines.join('\n') + '\n');
