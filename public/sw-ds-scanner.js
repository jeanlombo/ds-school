const CACHE = "ds-school-scanner-v1";
const BASE = ["/mobile/scanner", "/manifest-ds-scanner.webmanifest", "/icons/ds-scanner-192.png", "/icons/ds-scanner-512.png"];
self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(BASE)).catch(() => undefined));
  self.skipWaiting();
});
self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))));
  self.clients.claim();
});
self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || !url.pathname.startsWith("/mobile/")) return;
  event.respondWith(fetch(request).then((response) => {
    const clone = response.clone();
    caches.open(CACHE).then((cache) => cache.put(request, clone));
    return response;
  }).catch(() => caches.match(request).then((cached) => cached || caches.match("/mobile/scanner"))));
});
