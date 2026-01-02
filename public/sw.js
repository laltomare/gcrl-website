// GCRL Service Worker - Phase 1 PWA
// Caches static assets for offline browsing

const CACHE_NAME = 'gcrl-v2';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

// Assets to cache for offline access
const ASSETS_TO_CACHE = [
  '/',
  '/styles.css',
  '/logo.png',
  '/about',
  '/library',
  '/links',
  '/contact',
  '/join'
];

// Install event - cache assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching assets:', ASSETS_TO_CACHE);
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => {
        console.log('[SW] Installation complete');
        return self.skipWaiting(); // Activate immediately
      })
      .catch((error) => {
        console.error('[SW] Installation failed:', error);
      })
  );
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              // Delete old versions of GCRL cache
              return cacheName.startsWith('gcrl-') && cacheName !== CACHE_NAME;
            })
            .map((cacheName) => {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => {
        console.log('[SW] Activation complete');
        return self.clients.claim(); // Take control immediately
      })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle GET requests
  if (request.method !== 'GET') return;

  // Skip non-HTTP requests (chrome-extension, etc.)
  if (!url.protocol.startsWith('http')) return;

  // Skip file uploads and admin routes
  if (url.pathname.startsWith('/admin/') || url.pathname.startsWith('/download/')) {
    return;
  }

  // Skip large files (PDFs, images)
  if (url.pathname.endsWith('.pdf') || 
      url.pathname.endsWith('.jpg') || 
      url.pathname.endsWith('.png') && !url.pathname.includes('/logo.png')) {
    return;
  }

  // Cache-first strategy for static assets
  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          // Check if cache is still valid
          const cacheDate = cachedResponse.headers.get('date');
          if (cacheDate) {
            const age = Date.now() - new Date(cacheDate).getTime();
            if (age < CACHE_DURATION) {
              // Cache is fresh, use it
              return cachedResponse;
            }
          }
        }

        // No cache or expired, fetch from network
        return fetch(request)
          .then((networkResponse) => {
            // Don't cache if not successful
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
              return networkResponse;
            }

            // Clone the response since we can only consume it once
            const responseToCache = networkResponse.clone();

            // Add to cache for next time
            caches.open(CACHE_NAME)
              .then((cache) => {
                // Only cache our static assets
                if (ASSETS_TO_CACHE.some(asset => url.pathname === asset || url.pathname === asset + '/')) {
                  cache.put(request, responseToCache);
                }
              })
              .catch((error) => {
                console.error('[SW] Cache put failed:', error);
              });

            return networkResponse;
          })
          .catch((error) => {
            // Network failed, try to return cached version even if expired
            console.log('[SW] Network failed, falling back to cache:', request.url);
            return caches.match(request);
          });
      })
      .catch((error) => {
        console.error('[SW] Fetch handler failed:', error);
      })
  );
});

// Skip waiting immediately on update
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
