const CACHE_NAME = "caption-studio-mobile-v23";
const APP_ASSETS = [
  "./",
  "./index.html",
  "./video.html",
  "./tipe3.html",
  "./tipe1.html",
  "./tipe5.html",
  "./styles.css",
  "./video.css",
  "./tipe3.css",
  "./tipe1.css",
  "./tipe5.css?v=23",
  "./app.js",
  "./video.js",
  "./tipe3.js",
  "./tipe1.js",
  "./tipe5.js?v=23",
  "./pwa.js?v=23",
  "./manifest.webmanifest",
  "./template-kalimat.xlsx",
  "./vendor/jszip.min.js",
  "./vendor/mediabunny.min.js",
  "./assets/laptop-template.png",
  "./assets/laptop-template-inline.js?v=23",
  "./icons/app-icon-180.png",
  "./icons/app-icon-192.png",
  "./icons/app-icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_ASSETS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() =>
          caches
            .match(request)
            .then((cached) => cached || caches.match("./index.html")),
        ),
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(
      (cached) =>
        cached ||
        fetch(request).then((response) => {
          if (response.ok)
            caches
              .open(CACHE_NAME)
              .then((cache) => cache.put(request, response.clone()));
          return response;
        }),
    ),
  );
});
