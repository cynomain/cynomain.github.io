const staticPage = "cynomain-epub-v1";
const assets = [
  "/assets/material_icons.css",
  "/assets/material_icons.woff2",
  "/libs/jszip.min.js",
  "/index.html",
  "/style.css",
  "/script.js",
];

self.addEventListener("install", (installEvent) => {
  installEvent.waitUntil(
    caches.open(staticPage).then((cache) => {
      cache.addAll(assets);
      //cache.add("/");
    })
  );
});

self.addEventListener("fetch", (fetchEvent) => {
  fetchEvent.respondWith(
    caches.match(fetchEvent.request).then((res) => {
      return res || fetch(fetchEvent.request);
    })
  );
});
