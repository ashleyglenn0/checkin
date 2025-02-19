const CACHE_NAME = 'volunteer-checkin-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/src/index.css',
  '/src/App.css',
  '/src/main.jsx',
  '/assets/icon_192x192.png',
  '/assets/icon_512x512.png',
  '/assets/screenshots/checkin-1.png',
  '/assets/screenshots/checkin-2.png',
  '/assets/screenshots/dashboard-1.png',
  '/assets/screenshots/dashboard-2.png',
  '/assets/screenshots/reports-1.png',
  '/assets/screenshots/reports-2.png',
  '/assets/screenshots/schedule-1.png',
  '/assets/screenshots/schedule-2.png'
];

// Install the service worker and cache the necessary files
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Activate and clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name))
      );
    })
  );
});

// Fetch resources from cache or network
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        return response || fetch(event.request);
      })
  );
});
