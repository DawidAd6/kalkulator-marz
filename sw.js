const CACHE_NAME = 'margin-calc-v4';
const ASSETS = [
  './',
  './index.html',
  './css/style.css',
  './js/app.js',
  './js/calculator.js',
  './js/history.js',
  './js/validation.js',
  './js/custom-select.js',
  './manifest.json',
];

const FONT_CACHE = 'margin-calc-fonts-v1';

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME && k !== FONT_CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // Cache-first for Google Fonts (they are versioned/immutable)
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    e.respondWith(
      caches.match(e.request).then((cached) => {
        if (cached) return cached;
        return fetch(e.request).then((response) => {
          const clone = response.clone();
          caches.open(FONT_CACHE).then((cache) => cache.put(e.request, clone));
          return response;
        });
      })
    );
    return;
  }

  // Network first, cache fallback for app assets
  e.respondWith(
    fetch(e.request)
      .then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(e.request, clone));
        return response;
      })
      .catch(() => caches.match(e.request))
  );
});
