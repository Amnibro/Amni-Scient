// Offline check for every app listed in /offline-packs/apps.txt.
//   node tests/offline_check.mjs [--only id,id] [--mode visit|saved|both] [--jobs 4] [--out dir]
// For each app, two runs, each in a fresh browser profile:
//   visit  open the app once while connected, then cut the network and open it again
//   saved  press "Save for offline" on /offline.html (never opening the app), cut the network, open the app
// "Cut the network" means: the local server is stopped and the browser is restarted with every other
// host unresolvable and no proxy, so nothing can be fetched by the page or by a service worker.
// A run passes when the app's own page comes back (same title, not the offline notice) and no request
// to this site or to a library CDN fails that did not also fail while connected.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { startServer, ROOT } from './pages_server.mjs';
const { chromium } = createRequire(import.meta.url)('playwright');

const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const only = (arg('only', '') || '').split(',').filter(Boolean);
const mode = arg('mode', 'both');
const jobs = +arg('jobs', 4);
const outDir = path.resolve(arg('out', path.join(os.tmpdir(), 'amni-offline-check')));
fs.mkdirSync(outDir, { recursive: true });
const CDN = new Set(['cdn.jsdelivr.net', 'unpkg.com', 'cdnjs.cloudflare.com', 'cdn.plot.ly', 'fonts.googleapis.com', 'fonts.gstatic.com']);
const all = fs.readFileSync(path.join(ROOT, 'offline-packs', 'apps.txt'), 'utf8').split('\n').filter(Boolean).map((l, index) => { const f = l.split('\t'); return { index, id: f[0], title: f[1], url: f[3], mode: f[7] }; });
const apps = all.filter(a => !only.length || only.includes(a.id));

function watch(page, origin) {
  const bad = new Set(), errors = [];
  const note = (u, why) => {
    try {
      const x = new URL(u);
      if (x.origin === origin) bad.add(x.pathname + ' [' + why + ']');
      else if (CDN.has(x.hostname)) bad.add(x.href + ' [' + why + ']');
    } catch (_) {}
  };
  page.on('requestfailed', r => { const f = (r.failure() || {}).errorText || ''; if (!/ERR_ABORTED/.test(f)) note(r.url(), 'failed'); });
  page.on('response', r => { if (r.status() >= 400) note(r.url(), String(r.status())); });
  page.on('pageerror', e => errors.push(String(e.message).split('\n')[0].slice(0, 160)));
  return { bad, errors };
}

async function settle(page) {
  await page.waitForLoadState('load', { timeout: 60000 }).catch(() => {});
  await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(2500);
}

async function run(app, kind) {
  const { server, url } = await startServer();
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'amni-prof-'));
  const res = { id: app.id, kind, ok: false, notes: [] };
  let ctx;
  try {
    // ---- connected ----
    ctx = await chromium.launchPersistentContext(profile, { viewport: { width: 1280, height: 800 }, ignoreHTTPSErrors: true });
    let page = ctx.pages()[0] || await ctx.newPage();
    let online = { bad: new Set(), errors: [] }, titleOn = null;
    if (kind === 'visit') {
      online = watch(page, url);
      await page.goto(url + app.url, { waitUntil: 'load', timeout: 60000 });
      await settle(page);
      titleOn = await page.title();
      // some pages reload themselves once while starting (Helium Yacht adds ?m=...), so ask again after a navigation
      const ask = async fn => { for (let i = 0; ; i++) { try { return await page.evaluate(fn); } catch (e) { if (i > 3 || !/context was destroyed|navigation/i.test(e.message)) throw e; await settle(page); } } };
      await ask(() => navigator.serviceWorker.ready.then(() => true));
      const hasProgram = await ask(() => [...document.scripts].some(s => s.src.includes('/offline-app/')));
      titleOn = await page.title();
      if (app.mode !== 'ask' && hasProgram) {
        await page.waitForFunction(k => !!localStorage.getItem('amni-offline:' + k), app.mode === 'auto' ? app.id : app.id + ':code', { timeout: 420000 })
          .catch(() => res.notes.push('first-visit save did not finish in 7 min'));
      }
      await page.waitForTimeout(16000);   // let the worker keep the files this page loaded
      await page.screenshot({ path: path.join(outDir, app.id + '-online.png') }).catch(() => {});
    } else {
      await page.goto(url + '/offline.html', { waitUntil: 'load', timeout: 60000 });
      await page.evaluate(() => navigator.serviceWorker.ready.then(() => true));
      await page.waitForSelector('.off-card', { timeout: 20000 });
      const t0 = Date.now();
      // press the app's own Save button, as a visitor would, and wait for the page to record the save
      const cardEl = page.locator('.off-card').nth(app.index);
      await cardEl.locator('button.btn-primary').click();
      const rec = await page.waitForFunction(id => localStorage.getItem('amni-offline:' + id), app.id, { timeout: 600000 }).then(h => h.jsonValue(), e => null);
      if (!rec) res.notes.push('save did not finish');
      else { const f = rec.split('|'); res.notes.push('saved ' + f[2] + ' files in ' + ((Date.now() - t0) / 1000).toFixed(1) + ' s' + (+f[4] ? ', ' + f[4] + ' missing' : '')); }
      const err = await cardEl.locator('.off-msg.err').textContent({ timeout: 500 }).catch(() => '');
      if (err) res.notes.push('page said: ' + err);
      await page.waitForTimeout(1500);
    }
    await ctx.close();
    await new Promise(r => { server.close(r); server.closeAllConnections(); });

    // ---- no network at all ----
    ctx = await chromium.launchPersistentContext(profile, { viewport: { width: 1280, height: 800 },
      args: ['--no-proxy-server', '--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE localhost'] });
    page = ctx.pages()[0] || await ctx.newPage();
    const offline = watch(page, url);
    const nav = await page.goto(url + app.url, { waitUntil: 'load', timeout: 60000 }).catch(e => ({ err: e.message.split('\n')[0] }));
    if (!nav || nav.err) { res.notes.push('navigation failed: ' + (nav && nav.err)); }
    else {
      await settle(page);
      const title = await page.title();
      const notice = await page.evaluate(() => { const m = document.getElementById('off-miss'); return !!m && getComputedStyle(m).display !== 'none'; });
      const fromSW = nav.fromServiceWorker();
      await page.screenshot({ path: path.join(outDir, app.id + '-' + kind + '-offline.png') }).catch(() => {});
      // Large showcase videos are streamed, not saved; their absence offline is reported but is not a failure.
      const key = x => x.replace(/ \[[^\]]*\]$/, '');
      const was = new Set([...online.bad].map(key));
      const lost = [...offline.bad].filter(x => !was.has(key(x)));
      // /cad/policy.json is read with a synchronous XHR, which browsers do not pass to service workers;
      // CAD treats a failed read exactly like the file's shipped contents ({}), so it is not a failure.
      const regress = lost.filter(x => !/\.(mp4|webm)\b/.test(x) && !x.startsWith('/cad/policy.json '));
      const video = lost.length - regress.length;
      if (video) res.notes.push(video + ' video(s) not available offline');
      const newErrors = offline.errors.filter(x => !online.errors.includes(x));
      res.status = nav.status(); res.title = title; res.fromSW = fromSW;
      res.missing = regress; res.pageErrors = newErrors;
      if (notice) res.notes.push('got the "not saved" notice instead of the app');
      if (titleOn !== null && title !== titleOn) res.notes.push('title differs: "' + titleOn + '" vs "' + title + '"');
      res.ok = nav.status() === 200 && !notice && regress.length === 0 && (titleOn === null || title === titleOn);
    }
  } catch (e) {
    res.notes.push('error: ' + String(e.message).split('\n')[0]);
  } finally {
    if (ctx) await ctx.close().catch(() => {});
    try { server.closeAllConnections(); server.close(); } catch (_) {}
    fs.rmSync(profile, { recursive: true, force: true });
  }
  return res;
}

const queue = [];
for (const a of apps) for (const k of mode === 'both' ? ['visit', 'saved'] : [mode]) queue.push([a, k]);
const results = [];
await Promise.all(Array.from({ length: jobs }, async () => {
  while (queue.length) {
    const [a, k] = queue.shift();
    const r = await run(a, k);
    results.push(r);
    console.log((r.ok ? 'PASS ' : 'FAIL ') + (a.id + ' ' + k).padEnd(22) + [...r.notes, r.missing && r.missing.length ? 'missing: ' + r.missing.slice(0, 6).join(', ') + (r.missing.length > 6 ? ' +' + (r.missing.length - 6) : '') : '',
      r.pageErrors && r.pageErrors.length ? 'new page errors: ' + r.pageErrors.slice(0, 2).join(' | ') : ''].filter(Boolean).join('; '));
  }
}));
results.sort((a, b) => a.id.localeCompare(b.id) || a.kind.localeCompare(b.kind));
fs.writeFileSync(path.join(outDir, 'results.json'), JSON.stringify(results, null, 1));
const pass = results.filter(r => r.ok).length;
console.log('\n' + pass + ' of ' + results.length + ' runs passed. Screenshots and results.json in ' + outDir);
process.exit(pass === results.length ? 0 : 1);
