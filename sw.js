const CACHE = 'sai2sai-v1';

const STATIC = [
  '/',
  '/index.html',
  '/css/styles.css',
  '/js/data.js',
  '/js/helpers.js',
  '/js/state.js',
  '/js/views/shelf.js',
  '/js/views/volume.js',
  '/js/views/contributors.js',
  '/js/views/all-contributors.js',
  '/js/views/journey.js',
  '/js/views/pdf.js',
  '/js/views/contact.js',
  '/logo/sai2sai-opt.svg',
  '/logo/icon-192.png',
  '/logo/icon-512.png',
  '/site.webmanifest',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(STATIC)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Only handle same-origin GET requests
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;

  // HTML shell: network-first so updates land immediately
  if (url.pathname === '/' || url.pathname === '/index.html') {
    e.respondWith(
      fetch(e.request).then(res => {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return res;
      }).catch(() => caches.match(e.request))
    );
    return;
  }

  // Everything else: cache-first
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      });
    })
  );
});
