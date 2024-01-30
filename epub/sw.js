const staticPage = "cynomain-epub-v1";
const assets = [
  "./assets/material_icons.css",
  "./assets/material_icons.woff2",
  "./assets/icon_back.svg",
  "./assets/icon_book.svg",
  "./assets/icon_bookmark_empty.svg",
  "./assets/icon_bookmark_filled.svg",
  "./assets/icon_bookmark_remove.svg",
  "./assets/icon_bookmarks.svg",
  "./assets/icon_box.svg",
  "./assets/icon_build.svg",
  "./assets/icon_check.svg",
  "./assets/icon_close.svg",
  "./assets/icon_count.svg",
  "./assets/icon_delete.svg",
  "./assets/icon_download.svg",
  "./assets/icon_expand_less.svg",
  "./assets/icon_expand_more.svg",
  "./assets/icon_fandoms.svg",
  "./assets/icon_favorite.svg",
  "./assets/icon_filter_alt_off.svg",
  "./assets/icon_filter_alt_on.svg",
  "./assets/icon_filter_off.svg",
  "./assets/icon_filter_on.svg",
  "./assets/icon_group.svg",
  "./assets/icon_groups.svg",
  "./assets/icon_home.svg",
  "./assets/icon_library_add.svg",
  "./assets/icon_library_books.svg",
  "./assets/icon_menu.svg",
  "./assets/icon_next.svg",
  "./assets/icon_offline.svg",
  "./assets/icon_person.svg",
  "./assets/icon_refresh.svg",
  "./assets/icon_search_manage.svg",
  "./assets/icon_search.svg",
  "./assets/icon_settings.svg",
  "./assets/icon_singlepage.svg",
  "./assets/icon_sort_by.svg",
  "./assets/icon_sort_dir.svg",
  "./assets/icon_star.svg",
  "./assets/icon_tag.svg",
  "./assets/icon_title.svg",
  "./libs/jszip.min.js",
  "./index.html",
  "./style.css",
  "./script.js",
  "./sw.js",
  "./"
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
