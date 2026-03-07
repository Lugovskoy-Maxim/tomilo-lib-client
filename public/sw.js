/* eslint-disable no-restricted-globals */
const CACHE_SHELL = "tomilo-shell-v1";
const CACHE_PAGES = "tomilo-pages-v1";
const CACHE_IMAGES = "tomilo-images-v1";

const SHELL_PATHS = ["/", "/titles", "/bookmarks", "/history", "/offline.html"];

function isSameOrigin(url) {
  try {
    return new URL(url).origin === self.location.origin;
  } catch {
    return false;
  }
}

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_SHELL).then((cache) => {
      const origin = self.location.origin;
      const offlineUrl = origin + "/offline.html";
      return cache.add(offlineUrl).catch(() => {}).then(() =>
        cache.addAll(SHELL_PATHS.map((p) => origin + p).filter((u) => u && u !== offlineUrl)).catch(() => {})
      );
    })
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE_SHELL && k !== CACHE_PAGES && k !== CACHE_IMAGES).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (!isSameOrigin(request.url) || request.method !== "GET") return;

  if (request.mode === "navigate") {
    const offlineUrl = url.origin + "/offline.html";
    event.respondWith(
      fetch(request)
        .then((res) => {
          const clone = res.clone();
          caches.open(CACHE_SHELL).then((c) => c.put(request, clone));
          return res;
        })
        .catch(() =>
          caches.match(request).then((cached) =>
            cached || caches.match(offlineUrl).then((offline) =>
              offline || new Response("Нет соединения", { status: 503, statusText: "Offline" })
            )
          )
        )
    );
    return;
  }

  if (url.pathname.startsWith("/_next/") || url.pathname.startsWith("/favicons/") || url.pathname === "/manifest.json") {
    event.respondWith(
      caches.match(request).then((cached) => cached || fetch(request).then((res) => {
        const clone = res.clone();
        caches.open(CACHE_SHELL).then((c) => c.put(request, clone));
        return res;
      }))
    );
    return;
  }

  if (url.pathname.includes("/api/") && (url.pathname.includes("chapter") || url.pathname.includes("titles"))) {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const clone = res.clone();
          caches.open(CACHE_PAGES).then((c) => c.put(request, clone));
          return res;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  if (url.pathname.includes("/uploads/") || url.hostname.includes("s3.") || url.pathname.includes("tomilolib")) {
    event.respondWith(
      caches.match(request).then((cached) => cached || fetch(request).then((res) => {
        const clone = res.clone();
        caches.open(CACHE_IMAGES).then((c) => c.put(request, clone));
        return res;
      }))
    );
  }
});
