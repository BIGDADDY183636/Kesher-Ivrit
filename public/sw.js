/* ═══════════════════════════════════════════════════════════
   Kesher Ivrit — Service Worker (CACHE DISABLED)
   Installs immediately, deletes ALL caches, passes all
   requests directly to the network. No caching.
═══════════════════════════════════════════════════════════ */

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.map(k => {
        console.log('[SW] Deleting cache:', k);
        return caches.delete(k);
      })))
      .then(() => {
        console.log('[SW] All caches cleared');
        return self.clients.claim();
      })
  );
});

// No fetch handler = every request goes straight to the network
