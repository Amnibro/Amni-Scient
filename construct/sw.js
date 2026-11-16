const C = 'amni-construct-hub-v2'
self.addEventListener('install', e => { self.skipWaiting(); e.waitUntil(caches.open(C).then(c => c.addAll(['./', './dashboard.html', './pro.html', './manifest.webmanifest', './icon-192.png']).catch(() => {}))) })
self.addEventListener('activate', e => { e.waitUntil((async () => { for (const k of await caches.keys()) k !== C && k.startsWith('amni-construct-hub-') && await caches.delete(k); await self.clients.claim() })()) })
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url)
  if (e.request.method !== 'GET') return
  // library and font CDNs: when the network is gone, use the copy the site worker (/sw.js) kept
  if (u.origin !== location.origin) { if (/^(fonts\.(googleapis|gstatic)\.com|cdn\.jsdelivr\.net|unpkg\.com|cdnjs\.cloudflare\.com|cdn\.plot\.ly)$/.test(u.hostname)) e.respondWith(fetch(e.request).catch(() => caches.match(e.request.url).then(r => r || Response.error()))); return }
  e.respondWith((async () => {
    try {
      const r = await fetch(e.request)
      if (r && r.ok && u.pathname.startsWith('/construct/')) { const c = await caches.open(C); c.put(e.request, r.clone()) }
      return r
    } catch (err) {
      const m = await caches.match(e.request, { ignoreSearch: true })
      if (m) return m
      if (e.request.mode === 'navigate') { const h = await caches.match('./'); if (h) return h }
      throw err
    }
  })())
})
