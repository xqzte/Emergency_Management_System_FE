/*
 * QuickSave patient PWA service worker (app shell only).
 * - Pages: network first. Offline, show /offline (a clear no-connection page with a call option).
 *   Pages are never served stale, so an SOS screen is never faked offline (CLAUDE.md rule 9).
 * - Static build files and icons: cache first.
 * - API calls (another origin) and anything that is not GET: never touched.
 * Bump VERSION when this file changes.
 */
const VERSION = "qs-shell-v1";
const OFFLINE_URL = "/offline";
const PRECACHE = [OFFLINE_URL, "/manifest.webmanifest", "/icon.svg", "/icons/icon-192.png", "/icons/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(VERSION);
      await cache.addAll(PRECACHE);
      // Also cache the CSS and JS the offline page needs, so it renders styled with no network.
      const html = await (await cache.match(OFFLINE_URL)).text();
      // Backslashes are excluded: the page data repeats these paths inside escaped strings.
      const assets = [...new Set(html.match(/\/_next\/static\/[^"'\s)\\]+/g) || [])];
      // Best effort: one missing file must not stop the worker installing.
      await Promise.allSettled(assets.map((asset) => cache.add(asset)));
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((key) => key !== VERSION).map((key) => caches.delete(key)));
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(() => caches.match(OFFLINE_URL)));
    return;
  }

  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/") || url.pathname === "/icon.svg") {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            if (response.ok) {
              const copy = response.clone();
              caches.open(VERSION).then((cache) => cache.put(request, copy));
            }
            return response;
          }),
      ),
    );
  }
});
