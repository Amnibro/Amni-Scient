const C = 'amni-construct-hub-v1'
self.addEventListener('install', e => { self.skipWaiting(); e.waitUntil(caches.open(C).then(c => c.addAll(['./', './dashboard.html', './pro.html', './manifest.webmanifest', './icon-192.png']).catch(() => {}))) })
self.addEventListener('activate', e => { e.waitUntil((async () => { for (const k of await caches.keys()) k !== C && await caches.delete(k); await self.clients.claim() })()) })
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url)
  if (e.request.method !== 'GET' || u.origin !== location.origin) return
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
