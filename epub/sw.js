const staticPage = "cynomain-epub-v1";
const assets = [
  "/epub/assets/material_icons.css",
  "/epub/assets/material_icons.woff2",
  "/epub/assets/icon_back.svg",
  "/epub/assets/icon_book.svg",
  "/epub/assets/icon_bookmark_empty.svg",
  "/epub/assets/icon_bookmark_filled.svg",
  "/epub/assets/icon_bookmark_remove.svg",
  "/epub/assets/icon_bookmarks.svg",
  "/epub/assets/icon_box.svg",
  "/epub/assets/icon_build.svg",
  "/epub/assets/icon_check.svg",
  "/epub/assets/icon_close.svg",
  "/epub/assets/icon_count.svg",
  "/epub/assets/icon_delete.svg",
  "/epub/assets/icon_download.svg",
  "/epub/assets/icon_expand_less.svg",
  "/epub/assets/icon_expand_more.svg",
  "/epub/assets/icon_fandoms.svg",
  "/epub/assets/icon_favorite.svg",
  "/epub/assets/icon_filter_alt_off.svg",
  "/epub/assets/icon_filter_alt_on.svg",
  "/epub/assets/icon_filter_off.svg",
  "/epub/assets/icon_filter_on.svg",
  "/epub/assets/icon_group.svg",
  "/epub/assets/icon_groups.svg",
  "/epub/assets/icon_home.svg",
  "/epub/assets/icon_library_add.svg",
  "/epub/assets/icon_library_books.svg",
  "/epub/assets/icon_menu.svg",
  "/epub/assets/icon_next.svg",
  "/epub/assets/icon_offline.svg",
  "/epub/assets/icon_person.svg",
  "/epub/assets/icon_refresh.svg",
  "/epub/assets/icon_search_manage.svg",
  "/epub/assets/icon_search.svg",
  "/epub/assets/icon_settings.svg",
  "/epub/assets/icon_singlepage.svg",
  "/epub/assets/icon_sort_by.svg",
  "/epub/assets/icon_sort_dir.svg",
  "/epub/assets/icon_star.svg",
  "/epub/assets/icon_tag.svg",
  "/epub/assets/icon_title.svg",
  "/epub/libs/jszip.min.js",
  "/epub/index.html",
  "/epub/style.css",
  "/epub/script.js",
  "/epub/sw.js",
  "/epub/favicon.ico",
  "/epub/manifest.json"
];

self.addEventListener("message", (e) => {
  console.log("[SW] Message recieved!");
  console.log(e);
  switch (e.data) {
    case "cache_build":
      {
        e.waitUntil(BuildCache());
      }
      break;
    case "cache_clear":
      {
        e.waitUntil(ClearCache());
      }
      break;
    case "cache_rebuild":
      {
        e.waitUntil(
          ClearCache().then((x) =>
            BuildCache().then((x) => {
              e.ports[0].postMessage("refresh_f");
            })
          )
        );
      }
      break;
  }
});

self.addEventListener("activate", (e) => {
  console.log("[SW] Activated!");
})

self.addEventListener("install", (installEvent) => {
  console.log("[SW] Installed!");
  installEvent.waitUntil(BuildCache());
  self.skipWaiting();
});

self.addEventListener("fetch", (fetchEvent) => {
  let req = fetchEvent.request;
  fetchEvent.respondWith(
    caches.match(req, { ignoreSearch: true }).then((res) => {
      return res || fetch(req);
    })
  );
});

function BuildCache() {
  console.log("[SW] Cache building!");
  return caches.open(staticPage).then((cache) => {
    cache.addAll(assets);
    //cache.add("/");
  });
}

function ClearCache() {
  console.log("[SW] Cache clearing!");
  return caches.delete(staticPage);
}

async function getDecryptedResponse(request) {
  const response = await fetch(request);
  const bytes = new Uint8Array(await response.arrayBuffer());

  return new Response(
    new Blob([decryptMp4Bytes(bytes)], { type: "application/mp4" }),
    {
      headers: response.headers, // possibly required for this case
    }
  );
}
