const CACHE_NAME = 'random-pwa-v1';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icons/random-icon.svg',
  './icons/random-icon-192.svg',
  './icons/random-icon-512.svg',
  './icons/random-icon-192.png',
  './icons/random-icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys
        .filter((key) => key !== CACHE_NAME)
        .map((key) => caches.delete(key))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') {
    return;
  }

  const networkResponsePromise = fetch(event.request)
    .then((response) => {
      if (response.ok && event.request.url.startsWith(self.location.origin)) {
        const clonedResponse = response.clone();
        return caches.open(CACHE_NAME)
          .then((cache) => cache.put(event.request, clonedResponse))
          .then(() => response);
      }

      return response;
    })
    .catch(() => null);

  event.waitUntil(networkResponsePromise.then(() => undefined));

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return networkResponsePromise.then((networkResponse) => {
        if (networkResponse) {
          return networkResponse;
        }

        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }

        return new Response('Hors ligne', {
          status: 503,
          statusText: 'Offline',
          headers: { 'Content-Type': 'text/plain; charset=UTF-8' }
        });
      });
    })
  );
});
