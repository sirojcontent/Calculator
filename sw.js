const CACHE_NAME = 'calc-v2';
const urlsToCache = [
  '/Calculator/',
  '/Calculator/index.html',
  '/Calculator/manifest.json',
  '/Calculator/notes.json'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  const isDynamic =
    url.pathname.endsWith('/index.html') ||
    url.pathname.endsWith('/notes.json') ||
    url.pathname.endsWith('/manifest.json') ||
    url.pathname === '/Calculator/' ||
    url.pathname === '/Calculator';

  if (isDynamic) {
    event.respondWith(
      fetch(new Request(event.request, { cache: 'no-store' }))
        .then(res => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
          return res;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(res => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
        return res;
      });
    })
  );
});
