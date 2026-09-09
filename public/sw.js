// Cache only the public offline page and its icon. Never cache OAuth responses,
// authenticated pages, ArcGIS services, map tiles or user information.
const CACHE = 'gia-offline-v1';
const offlineURL = new URL('offline.html', self.registration.scope).href;
const iconURL = new URL('icons/icon-192.png', self.registration.scope).href;
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll([offlineURL, iconURL])));
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) {
      if (key.startsWith('gia-offline-') && key !== CACHE) await caches.delete(key);
    }
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;
  if (request.mode === 'navigate' && url.href.startsWith(self.registration.scope)) {
    event.respondWith(fetch(request).catch(async () =>
      (await caches.match(offlineURL)) || new Response('You are offline. Reconnect and reload.', {headers:{'Content-Type':'text/plain'}})
    ));
  } else if (url.href === iconURL || url.href === offlineURL) {
    event.respondWith(caches.match(request).then(cached => cached || fetch(request)));
  }
});
