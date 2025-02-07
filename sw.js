const CACHE_NAME = 'spchspr_version_01';
const FILES_TO_CACHE = [
  '/Speechsprint/',
  '/Speechsprint/index.html',
  '/Speechsprint/style.css',
  '/Speechsprint/script.js',
  '/Speechsprint/sw.js',
  '/Speechsprint/manifest.json',
  '/Speechsprint/file-upload.svg',
  '/Speechsprint/trash.svg',
  '/Speechsprint/icon-192x192.png',
  '/Speechsprint/icon-512x512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(FILES_TO_CACHE);
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});

self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
