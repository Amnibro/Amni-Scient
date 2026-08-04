const VERSION = 'amni-life-v0.26.1';
const SHELL = ['./','./index.html','./style.css?v=b260','./main.js','./manifest.webmanifest','./pkg/amni_life.js','./pkg/amni_life_bg.wasm','./data/sample_life.json'];
const CDN = ['https://unpkg.com/three@0.165.0/build/three.module.js','https://unpkg.com/three@0.165.0/examples/jsm/controls/OrbitControls.js','https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.js'];
self.addEventListener('install', e => { e.waitUntil(caches.open(VERSION).then(c => c.addAll([...SHELL, ...CDN]).catch(() => {}))); self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k))))); self.clients.claim(); });
self.addEventListener('fetch', e => {
    const url = e.request.url;
    if (e.request.method !== 'GET') return;
    e.respondWith((async () => {
        const cache = await caches.open(VERSION);
        const cached = await cache.match(e.request);
        const networkPromise = fetch(e.request).then(r => { if (r.ok && (r.type === 'basic' || r.type === 'cors')) cache.put(e.request, r.clone()).catch(()=>{}); return r; }).catch(() => null);
        if (cached) { networkPromise; return cached; }
        const r = await networkPromise;
        if (r) return r;
        return new Response('offline', { status: 503, statusText: 'offline' });
    })());
});
