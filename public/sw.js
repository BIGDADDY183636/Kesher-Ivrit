/* ═══════════════════════════════════════════════════════════
   Kesher Ivrit — Service Worker v3
   Strategy: network-only for everything.
   No caching. Always fresh. Notifies the page on update.
═══════════════════════════════════════════════════════════ */
const SW_VERSION = 'kesher-v35';

// Install: skip waiting immediately so this SW activates without delay
self.addEventListener('install', () => {
  console.log('[SW v3] Installing — skipWaiting');
  self.skipWaiting();
});

// Activate: delete ALL old caches from any previous version, claim clients
self.addEventListener('activate', event => {
  console.log('[SW v3] Activating — clearing all caches');
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.map(k => {
        console.log('[SW v3] Deleted cache:', k);
        return caches.delete(k);
      })))
      .then(() => {
        console.log('[SW v3] All caches cleared, claiming clients');
        return self.clients.claim();
      })
      .then(() => {
        // Tell every open tab that a new version is active
        return self.clients.matchAll({ type: 'window' });
      })
      .then(clients => {
        clients.forEach(client => client.postMessage({ type: 'SW_UPDATED', version: SW_VERSION }));
      })
  );
});

// Fetch: always go to network — never serve from cache
self.addEventListener('fetch', event => {
  // Only handle http/https, skip chrome-extension etc.
  if (!event.request.url.startsWith('http')) return;

  // For page navigations, bypass the browser HTTP cache entirely so index.html
  // is always fresh — prevents users getting stuck on old versions via HTTP cache.
  const req = event.request.mode === 'navigate'
    ? new Request(event.request, { cache: 'no-store' })
    : event.request;

  event.respondWith(
    fetch(req, {
      // Pass through credentials for API calls
      credentials: event.request.credentials
    }).catch(err => {
      // Network failed — return a minimal offline notice only for navigation requests
      if (event.request.mode === 'navigate') {
        return new Response(
          '<html><body style="font-family:sans-serif;text-align:center;padding:60px">' +
          '<h2>You\'re offline</h2><p>Check your connection and refresh.</p>' +
          '<button onclick="location.reload()">Retry</button></body></html>',
          { headers: { 'Content-Type': 'text/html' } }
        );
      }
      throw err;
    })
  );
});
