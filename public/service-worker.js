// public/service-worker.js
//
// Minimal service worker so MINERVIUM qualifies as an installable app
// (Chrome/Android "Add to Home Screen" requires a registered service
// worker with a fetch handler) and basic offline fallback for the app
// shell. This intentionally does NOT cache API/Supabase calls — only
// the static app shell — so report data is always fresh.

const CACHE_NAME = "minervium-shell-v1";
const APP_SHELL = ["/", "/index.html", "/manifest.json"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  // Only handle same-origin navigation requests with a cache-first
  // fallback (so a flaky connection on site doesn't block opening the
  // app shell). Everything else (API calls, Supabase, images) goes
  // straight to the network untouched.
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(() => caches.match("/index.html"))
    );
  }
});
