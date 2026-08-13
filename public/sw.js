const CACHE_NAME = 'inourbudget-pwa-v3';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/offline.html',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-512-maskable.png'
];

// 1. Install Event: Pre-cache core App Shell & Offline fallback
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Pre-caching In Our Budget app shell');
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// 2. Activate Event: Purge outdated caches and claim clients immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[SW] Cleaning old cache version:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. Skip Waiting message handler for prompt updates
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// 4. Fetch Event: Safe Network-First and Cache strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip non-HTTP(S) protocols (chrome-extension, websockets, dev server)
  if (!url.protocol.startsWith('http')) return;

  // EXCLUSIONS: Skip Firebase Auth, Firestore, Analytics, API routes, and Admin panel
  if (
    url.hostname.includes('firebase') ||
    url.hostname.includes('googleapis') ||
    url.hostname.includes('identitytoolkit') ||
    url.hostname.includes('securetoken') ||
    url.hostname.includes('firestore') ||
    url.hostname.includes('firebasestorage') ||
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/admin') ||
    url.pathname.includes('chrome-extension')
  ) {
    return;
  }

  // EXCLUSIONS: Skip external affiliate marketplace domains (Amazon, Flipkart, Meesho, etc.)
  if (
    url.hostname.includes('amazon') ||
    url.hostname.includes('amzn') ||
    url.hostname.includes('flipkart') ||
    url.hostname.includes('meesho') ||
    url.hostname.includes('myntra') ||
    url.hostname.includes('ajio') ||
    url.hostname.includes('croma') ||
    url.hostname.includes('reliancedigital') ||
    url.hostname.includes('tatacliq') ||
    url.hostname.includes('nykaa') ||
    url.hostname.includes('snapdeal')
  ) {
    return;
  }

  // Strategy A: Navigation requests (HTML pages & Deep Links) -> Network-First with Offline Fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.status === 200) {
            const responseCopy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseCopy));
          }
          return response;
        })
        .catch(() => {
          return caches.match(request).then((cachedResponse) => {
            return (
              cachedResponse ||
              caches.match('/offline.html') ||
              caches.match('/index.html') ||
              caches.match('/')
            );
          });
        })
    );
    return;
  }

  // Strategy B: Static assets (styles, scripts, fonts, icons, static images) -> Stale-While-Revalidate
  if (
    request.destination === 'style' ||
    request.destination === 'script' ||
    request.destination === 'image' ||
    request.destination === 'font' ||
    url.pathname.startsWith('/icons/') ||
    url.pathname.startsWith('/assets/') ||
    url.pathname.endsWith('.json') ||
    url.pathname.endsWith('.webmanifest')
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        const fetchPromise = fetch(request)
          .then((networkResponse) => {
            if (networkResponse.status === 200) {
              const responseCopy = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, responseCopy));
            }
            return networkResponse;
          })
          .catch(() => cachedResponse);

        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // Strategy C: Default Network with Cache Fallback
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});
