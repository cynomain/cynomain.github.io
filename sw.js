const staticPage = "cynomain-site-v1";
const assets = [
  "/index.html",

  "/assets/pilgan/aud_choose.ogg",
  "/assets/pilgan/aud_msgbox.ogg",
  "/assets/pilgan/aud_next.ogg",
  "/assets/pilgan/aud_prev.ogg",
  "/assets/pilgan/aud_reset.ogg",
  "/assets/pilgan/aud_score.ogg",
  "/assets/pilgan/favicon.ico",
  "/assets/pilgan/icon_arrow_circle_left.svg",
  "/assets/pilgan/icon_arrow_circle_right.svg",
  "/assets/pilgan/icon_arrow_ios_next.svg",
  "/assets/pilgan/icon_arrow_ios_prev.svg",
  "/assets/pilgan/icon_arrow_left.svg",
  "/assets/pilgan/icon_arrow_right.svg",
  "/assets/pilgan/icon_checkmark.svg",
  "/assets/pilgan/icon_clipboard.svg",
  "/assets/pilgan/icon_close.svg",
  "/assets/pilgan/icon_confirmgrading.svg",
  "/assets/pilgan/icon_delete.svg",
  "/assets/pilgan/icon_download.svg",
  "/assets/pilgan/icon_edit.svg",
  "/assets/pilgan/icon_grade.svg",
  "/assets/pilgan/icon_nav.svg",
  "/assets/pilgan/icon_new.svg",
  "/assets/pilgan/icon_rename.svg",
  "/assets/pilgan/icon_reset.svg",
  "/assets/pilgan/icon_save.svg",
  "/assets/pilgan/icon_settings.svg",
  "/assets/pilgan/icon_upload.svg",
  "/assets/pilgan/icon_x.svg",

  "/scripts/pilgan/bubbles.js",
  "/scripts/pilgan/home.js",
  "/scripts/pilgan/mainscript.js",
  "/scripts/pilgan/settings.js",
  "/scripts/pilgan/view.js",
  "/scripts/scripts.js",

  "/styles/pilgan/home.css",
  "/styles/pilgan/mainstyle.css",
  "/styles/pilgan/settings.css",
  "/styles/pilgan/view.css",
  "/styles/styles.css",

  "https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,100;0,300;0,400;0,500;0,700;0,900;1,100;1,300;1,400;1,500;1,700;1,900&display=swap",
  "/pages/pilgan.html"
];

self.addEventListener("install", (installEvent) => {
  installEvent.waitUntil(
    caches.open(staticPage).then((cache) => {
      cache.addAll(assets);
      //cache.add("/");
    })
  );
});

self.addEventListener("fetch", fetchEvent => {
  fetchEvent.respondWith(
    caches.match(fetchEvent.request).then(res => {
      return res || fetch(fetchEvent.request)
    })
  )
})