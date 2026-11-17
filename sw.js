/* Amni-Scient site service worker.
   Makes the site's pages and web apps usable with no connection.

   Online, nothing changes: every request goes to the network first and the
   answer is passed through untouched. A copy of each good answer is kept, and
   that copy is only served when the network cannot be reached.

   Caches:
     amni-shell-<V>  a few files fetched at install so there is always a page to show
     amni-rt-<V>     copies of what was loaded while online
     amni-cdn-<V>    copies of library files from the public CDNs the pages use
     amni-app-<id>   whole apps saved from /offline.html (written by the page program in /offline-app/, never cleared here)
     amni-map-area-<id>  map areas saved in /map/ (written by that page, never cleared here; tiles.openfreemap.org requests are answered from them first)

   Apps that ship their own worker in a narrower scope (/learn/, /construct/,
   /companion/, /amni-life/, /lib/amni-llm/) are controlled by that worker, not this one. */
const V = 'v1';
const SHELL = 'amni-shell-' + V, RT = 'amni-rt-' + V, CDN = 'amni-cdn-' + V;
const OWN = /^amni-(shell|rt|cdn)-/;
const PRECACHE = ['/', '/offline', '/offline.html', '/css/style.css', '/offline-app/start.js', '/offline-app/helium.js', '/offline-app/offline.wasm', '/favicon.ico', '/favicon.svg', '/offline-packs/apps.txt'];
const CDN_HOSTS = new Set(['cdn.jsdelivr.net', 'unpkg.com', 'cdnjs.cloudflare.com', 'cdn.plot.ly', 'fonts.googleapis.com', 'fonts.gstatic.com']);
// Never handled here: installers and other big downloads, the update feeds' redirects, Cloudflare's own paths.
const BYPASS = /^\/(cdn-cgi|downloads|functions|x|amni-mail)\/|^\/(update|update\.sh|sw\.js)$|\.(apk|exe|zip|dmg|deb|msi|AppImage|tar\.gz|tgz|flatpakref)$/i;
const MAX_BYTES = 96 * 1024 * 1024;
const NAV_WAIT_MS = 7000;
// Model weights are kept by Amni-LLM itself (cache "amni-llm-v1" / OPFS); never store a second copy here.
const NOKEEP = /\.gguf$|\/models\//i;

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil((async () => {
    const c = await caches.open(SHELL);
    await Promise.all(PRECACHE.map(async u => {
      try { const r = await fetch(u, { cache: 'no-cache' }); if (keepable(r)) await c.put(u, clean(r)); } catch (_) {}
    }));
  })());
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (OWN.test(k) && ![SHELL, RT, CDN].includes(k)) await caches.delete(k);
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  let url;
  try { url = new URL(req.url); } catch (_) { return; }
  if (url.origin === self.location.origin) {
    if (BYPASS.test(url.pathname)) return;
    if (req.headers.has('range')) { e.respondWith(ranged(req, url)); return; }
    e.respondWith(req.mode === 'navigate' ? page(e, req, url) : asset(e, req, url));
  } else if (CDN_HOSTS.has(url.hostname)) {
    e.respondWith(cdn(e, req, url));
  } else if (url.hostname === 'tiles.openfreemap.org') {
    e.respondWith(url.pathname === '/planet' ? fetch(req).catch(async () => (await caches.match(url.href, { ignoreVary: true })) || Response.error()) : caches.match(url.href, { ignoreVary: true }).then(r => r || fetch(req)));
  }
});

self.addEventListener('message', e => {
  const d = e.data || {};
  // A page that loaded before this worker took control asks for its own files to be kept.
  if (d.type === 'WARM' && Array.isArray(d.urls)) e.waitUntil(warm(d.urls.slice(0, 600)));
});

function keepable(r) {
  if (!r || r.status !== 200 || (r.type !== 'basic' && r.type !== 'cors')) return false;
  if (/no-store/i.test(r.headers.get('cache-control') || '')) return false;
  const n = +(r.headers.get('content-length') || 0);
  return !(n > MAX_BYTES);
}

// A response that followed a redirect cannot answer a navigation, so store a plain copy.
function clean(r) {
  return r.redirected ? new Response(r.body, { status: r.status, statusText: r.statusText, headers: r.headers }) : r;
}

async function keep(cacheName, req, res) {
  try {
    const c = await caches.open(cacheName);
    const final = res.redirected && res.url ? res.url : null;
    if (final) await c.put(final, clean(res.clone()));
    await c.put(req.url.split('#')[0], clean(res));
  } catch (_) { /* storage full or blocked: carry on without a copy */ }
}

// Other spellings the same file may be saved under (Cloudflare Pages serves /a.html at /a and /d/index.html at /d/).
function variants(url) {
  const p = url.pathname, o = url.origin, s = url.search, out = [o + p + s];
  const add = q => { if (q && !out.includes(o + q + s)) out.push(o + q + s); };
  if (p.endsWith('/')) { add(p + 'index.html'); if (p.length > 1) add(p.slice(0, -1)); }
  else if (p.endsWith('/index.html')) add(p.slice(0, -10));
  else if (p.endsWith('.html')) add(p.slice(0, -5));
  else if (!/\.[a-z0-9]{1,8}$/i.test(p)) { add(p + '.html'); add(p + '/'); add(p + '/index.html'); }
  return out;
}

async function saved(url) {
  const v = variants(url);
  for (const u of v) { const r = await caches.match(u); if (r) return clean(r); }
  for (const u of v) { const r = await caches.match(u, { ignoreSearch: true }); if (r) return clean(r); }
  return null;
}

async function page(e, req, url) {
  const net = fetch(req).then(res => {
    if (keepable(res)) e.waitUntil(keep(RT, req, res.clone()));
    return res;
  });
  let timer;
  try {
    // On a connection that is up but going nowhere, show the saved copy after a few seconds.
    const slow = new Promise(r => { timer = setTimeout(() => r(null), NAV_WAIT_MS); });
    const first = await Promise.race([net, slow]);
    if (first) return first;
    const copy = await saved(url);
    if (copy) { e.waitUntil(net.catch(() => {})); return copy; }
    return await net;
  } catch (_) {
    const copy = await saved(url);
    if (copy) return copy;
    const fb = (await caches.match('/offline')) || (await caches.match('/offline.html'));
    if (fb) return fb;
    return new Response('<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Offline</title><body style="font:16px system-ui;margin:3rem auto;max-width:34rem;padding:0 1rem"><h1>You are offline</h1><p>This page has not been saved on this device yet. Connect once and open it, and it will be here next time.</p>',
      { status: 503, headers: { 'content-type': 'text/html; charset=utf-8' } });
  } finally { clearTimeout(timer); }
}

async function asset(e, req, url) {
  try {
    const res = await fetch(req);
    if (keepable(res) && !NOKEEP.test(url.pathname)) e.waitUntil(keep(RT, req, res.clone()));
    return res;
  } catch (err) {
    const copy = await saved(url);
    if (copy) return copy;
    throw err;
  }
}

// Media elements ask for byte ranges. Online they go straight through; offline they are cut from a saved whole file.
async function ranged(req, url) {
  try { return await fetch(req); } catch (err) {
    const copy = await saved(url);
    if (!copy) throw err;
    const buf = await copy.arrayBuffer(), m = /bytes=(\d*)-(\d*)/.exec(req.headers.get('range') || '');
    if (!m) return new Response(buf, { status: 200, headers: copy.headers });
    const size = buf.byteLength;
    let start = m[1] === '' ? Math.max(0, size - +m[2]) : +m[1];
    let end = m[1] === '' || m[2] === '' ? size - 1 : Math.min(+m[2], size - 1);
    if (start >= size || start > end) return new Response(null, { status: 416, headers: { 'content-range': 'bytes */' + size } });
    const h = new Headers(copy.headers);
    h.set('content-range', 'bytes ' + start + '-' + end + '/' + size);
    h.set('content-length', String(end - start + 1));
    h.set('accept-ranges', 'bytes');
    return new Response(buf.slice(start, end + 1), { status: 206, statusText: 'Partial Content', headers: h });
  }
}

// Library files from public CDNs. Asked for with CORS so the stored copy is a real one, not an opaque blob.
async function cdn(e, req, url) {
  try {
    const res = await fetch(url.href, { mode: 'cors', credentials: 'omit' });
    if (keepable(res)) e.waitUntil(keep(CDN, req, res.clone()));
    return res;
  } catch (_) {
    const copy = (await caches.match(url.href)) || (await caches.match(url.href, { ignoreSearch: true }));
    if (copy) return copy;
    return fetch(req);
  }
}

async function warm(urls) {
  const rt = await caches.open(RT), cd = await caches.open(CDN);
  let i = 0;
  const one = async () => {
    while (i < urls.length) {
      const raw = urls[i++];
      try {
        const u = new URL(raw);
        const same = u.origin === self.location.origin;
        if (same ? (BYPASS.test(u.pathname) || NOKEEP.test(u.pathname)) : !CDN_HOSTS.has(u.hostname)) continue;
        const key = u.href.split('#')[0];
        if (await caches.match(key)) continue;
        const r = await fetch(key, same ? {} : { mode: 'cors', credentials: 'omit' });
        if (keepable(r)) {
          const c = same ? rt : cd;
          if (r.redirected && r.url) await c.put(r.url, clean(r.clone()));
          await c.put(key, clean(r));
        }
      } catch (_) {}
    }
  };
  await Promise.all([one(), one(), one(), one()]);
}
