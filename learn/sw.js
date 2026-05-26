// Amni-Learn service worker — cold-cache offline / airplane mode support.
// Bumps the CACHE name on every meaningful change so old caches roll out.
const CACHE = 'amni-learn-v354';
const PRECACHE = [
  './',
  './index.html',
  './manifest.webmanifest',
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
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      // Network with cache-on-success fallback.
      return fetch(e.request).then(resp => {
        if (resp && resp.status === 200 && resp.type === 'basic') {
          const clone = resp.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone)).catch(() => {});
        }
        return resp;
      }).catch(() => {
        // Offline + not in cache — fall back to the cached app shell so a
        // stray nav like /learn/missing.html still lands on something usable.
        if (e.request.mode === 'navigate') return caches.match('./index.html');
        return new Response('', { status: 504, statusText: 'offline' });
      });
    })
  );
});
