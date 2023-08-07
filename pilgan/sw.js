const staticPage = "cynomain-pilgan-v1";
const assets = [
  "assets/aud_choose.ogg",
  "assets/aud_msgbox.ogg",
  "assets/aud_next.ogg",
  "assets/aud_prev.ogg",
  "assets/aud_reset.ogg",
  "assets/aud_score.ogg",
  "assets/favicon.ico",
  "assets/icon_arrow_circle_left.svg",
  "assets/icon_arrow_circle_right.svg",
  "assets/icon_arrow_ios_next.svg",
  "assets/icon_arrow_ios_prev.svg",
  "assets/icon_arrow_left.svg",
  "assets/pilgan/icon_arrow_right.svg",
  "assets/icon_checkmark.svg",
  "assets/icon_clipboard.svg",
  "assets/icon_close.svg",
  "assets/icon_confirmgrading.svg",
  "assets/icon_delete.svg",
  "assets/icon_download.svg",
  "assets/icon_edit.svg",
  "assets/icon_grade.svg",
  "assets/icon_nav.svg",
  "assets/icon_new.svg",
  "assets/icon_rename.svg",
  "assets/icon_reset.svg",
  "assets/icon_save.svg",
  "assets/icon_settings.svg",
  "assets/icon_upload.svg",
  "assets/icon_x.svg",

  "scripts/bubbles.js",
  "scripts/home.js",
  "scripts/mainscript.js",
  "scripts/settings.js",
  "scripts/view.js",

  "styles/home.css",
  "styles/mainstyle.css",
  "styles/settings.css",
  "styles/view.css",

  "https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,100;0,300;0,400;0,500;0,700;0,900;1,100;1,300;1,400;1,500;1,700;1,900&display=swap",
  "index.html"
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