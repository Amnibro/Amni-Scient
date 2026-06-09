// Amni-Learn service worker — cold-cache offline / airplane mode support.
// Bumps the CACHE name on every meaningful change so old caches roll out.
const CACHE = 'amni-learn-v1219';
const PRECACHE = [
  './',
  './index.html',
  './learn-app.js',
  './manifest.webmanifest',
  './assets/world-map.png',
  './assets/audio/bear.mp3','./assets/audio/bee.mp3','./assets/audio/bird.mp3','./assets/audio/boar.mp3',
  './assets/audio/cat.mp3','./assets/audio/chicken.mp3','./assets/audio/cow.mp3','./assets/audio/crocodile.mp3',
  './assets/audio/crow.mp3','./assets/audio/deer.mp3','./assets/audio/dog.mp3','./assets/audio/donkey.mp3',
  './assets/audio/dove.mp3','./assets/audio/duck.mp3','./assets/audio/eagle.mp3','./assets/audio/elephant.mp3',
  './assets/audio/fox.mp3','./assets/audio/frog.mp3','./assets/audio/goat.mp3','./assets/audio/gorilla.mp3',
  './assets/audio/horse.mp3','./assets/audio/lion.mp3','./assets/audio/monkey.mp3','./assets/audio/mouse.mp3',
  './assets/audio/owl.mp3','./assets/audio/parrot.mp3','./assets/audio/pig.mp3','./assets/audio/rhino.mp3',
  './assets/audio/rooster.mp3','./assets/audio/seal.mp3','./assets/audio/sheep.mp3','./assets/audio/snake.mp3',
  './assets/audio/squirrel.mp3','./assets/audio/turkey.mp3','./assets/audio/wolf.mp3'
];
self.addEventListener('install', (e) => {
  // Pre-cache critical assets. Tolerate individual file failures so a single
  // missing asset doesn't fail the whole install.
  e.waitUntil(
    caches.open(CACHE).then(c => Promise.all(
      PRECACHE.map(url => c.add(url).catch(err => console.warn('[sw] precache miss', url, err)))
    ))
  );
  self.skipWaiting();
});
self.addEventListener('activate', (e) => {
  // Drop stale caches from older versions.
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  // Only intercept same-origin requests under our scope. Don't fight with
  // Google Fonts CSS / fonts.gstatic.com — those are best-effort and the
  // page already falls back to system fonts via display=swap.
  if (url.origin !== location.origin) return;
  const save = (req, resp) => { if (resp && resp.status === 200 && resp.type === 'basic') { const clone = resp.clone(); caches.open(CACHE).then(c => c.put(req, clone)).catch(() => {}); } return resp; };
  // The APP CODE (index.html + learn-app.js + the page itself) is NETWORK-FIRST
  // so a fresh deploy always reaches the user when online — cache-first here
  // would pin a stale learn-app.js on the device until the cache was evicted
  // (the cause of "old content after an update"). Static assets (mp3s, images,
  // fonts) stay cache-first below since they rarely change.
  const isAppCode = e.request.mode === 'navigate' || /\/(index\.html|learn-app\.js)$/.test(url.pathname) || /\/learn\/?$/.test(url.pathname);
  if (isAppCode) {
    e.respondWith(
      fetch(e.request).then(resp => save(e.request, resp))
        .catch(() => caches.match(e.request).then(c => c || caches.match('./index.html')))
    );
    return;
  }
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(resp => save(e.request, resp)).catch(() => {
        if (e.request.mode === 'navigate') return caches.match('./index.html');
        return new Response('', { status: 504, statusText: 'offline' });
      });
    })
  );
});
