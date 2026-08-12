const CACHE_NAME = "dojo-tokon-v6";
const APP_SHELL = [
  "./",
  "./index.html",
  "./css/styles.css",
  "./data/combos.js",
  "./js/app.js",
  "./js/input-manager.js",
  "./js/keyboard.js",
  "./js/touch-controls.js",
  "./js/gamepad.js",
  "./js/combo-engine.js",
  "./js/fighter.js",
  "./js/ui.js",
  "./js/storage.js",
  "./js/haptics.js",
  "./js/sound.js",
  "./manifest.webmanifest",
  "./assets/icons/icon.svg",
  "./assets/icons/icon-192.png",
  "./assets/icons/icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET" || new URL(event.request.url).origin !== self.location.origin) return;
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request).then((response) => {
      if (response.ok) {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
      }
      return response;
    }).catch(() => event.request.mode === "navigate" ? caches.match("./index.html") : Response.error()))
  );
});
