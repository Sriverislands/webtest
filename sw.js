/* Webテスト対策トレーナー service worker
   方式: cache-first + バックグラウンド更新（stale-while-revalidate）
   アプリを更新したら下のバージョン番号を上げること（例: v1 → v2）。 */
const CACHE = "webtest-v1";
const ASSETS = ["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png", "./icon-180.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);
  /* Firebase・Google認証などの外部通信はキャッシュせず素通しする */
  if (url.origin !== location.origin) return;
  e.respondWith(
    caches.match(e.request).then(cached => {
      const fetched = fetch(e.request)
        .then(res => {
          if (res && res.ok) {
            const clone = res.clone();
            caches.open(CACHE).then(c => c.put(e.request, clone));
          }
          return res;
        })
        .catch(() => cached);
      return cached || fetched;
    })
  );
});
