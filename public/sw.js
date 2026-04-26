/* ═══════════════════════════════════════════════════════════
   Kesher Ivrit — Service Worker
   Strategy:
     • App shell (HTML, CSS, JS, icons, fonts) → Cache-first
     • API calls (/api/*) → Network-first with offline fallback
     • Unrecognised cross-origin → Network only
═══════════════════════════════════════════════════════════ */

const CACHE_NAME    = 'kesher-ivrit-v1';
const OFFLINE_URL   = '/';

// Files to pre-cache on install (the app shell)
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/apple-touch-icon.png',
];

// ─── INSTALL ─────────────────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// ─── ACTIVATE ────────────────────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k !== CACHE_NAME)
          .map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// ─── FETCH ───────────────────────────────────────────────
self.addEventListener('fetch', event => {
  const req = event.request;
  const url = new URL(req.url);

  // Only handle GET requests
  if (req.method !== 'GET') return;

  // ── API calls: network-first, offline JSON fallback ──
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(req)
        .then(res => res)
        .catch(() => new Response(
          JSON.stringify({ error: 'You appear to be offline. Please reconnect to continue your lesson.' }),
          { status: 503, headers: { 'Content-Type': 'application/json' } }
        ))
    );
    return;
  }

  // ── Cross-origin (fonts, etc.): cache-first, then network ──
  if (url.origin !== self.location.origin) {
    event.respondWith(
      caches.match(req).then(cached => {
        if (cached) return cached;
        return fetch(req).then(res => {
          if (!res || res.status !== 200) return res;
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(req, clone));
          return res;
        });
      })
    );
    return;
  }

  // ── Same-origin assets: cache-first, network fallback ──
  event.respondWith(
    caches.match(req).then(cached => {
      if (cached) return cached;

      return fetch(req).then(res => {
        if (!res || res.status !== 200 || res.type === 'opaque') return res;
        const clone = res.clone();
        caches.open(CACHE_NAME).then(c => c.put(req, clone));
        return res;
      }).catch(() => {
        // Offline fallback: return cached shell
        return caches.match(OFFLINE_URL);
      });
    })
  );
});
