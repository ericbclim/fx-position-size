const CACHE_NAME = 'fx-sizer-v1';

// Files to cache for offline use
const ASSETS = [
  '/fx-position-size/',
  '/fx-position-size/index.html',
  '/fx-position-size/manifest.json',
  'https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=DM+Sans:wght@300;400;500;600&display=swap'
];

// ── Install: cache all core assets ──────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      // Cache local assets strictly, fonts best-effort
      return cache.addAll([
        '/fx-position-size/',
        '/fx-position-size/index.html',
        '/fx-position-size/manifest.json'
      ]).then(() => {
        // Fonts are optional — don't fail install if unavailable
        return cache.add('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=DM+Sans:wght@300;400;500;600&display=swap')
          .catch(() => {});
      });
    }).then(() => self.skipWaiting())
  );
});

// ── Activate: clean up old caches ────────────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// ── Fetch: cache-first, fall back to network ─────────────────────────
self.addEventListener('fetch', event => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;

      return fetch(event.request).then(response => {
        // Cache valid responses for future offline use
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => {
        // If offline and not cached, return the main app shell
        if (event.request.destination === 'document') {
          return caches.match('/fx-position-size/index.html');
        }
      });
    })
  );
});
