// =============================================================================
// Service Worker - Leonie's Groceries PWA
// Provides offline capability, asset caching, and instant launch
// =============================================================================

const CACHE_NAME = "leonie-groceries-v1";

const PRECACHE_ASSETS = [
  "./",
  "./index.html",
  "./css/styles.css",
  "./js/app.js",
  "./js/api.js",
  "./js/firebase-config.js",
  "./data/groceries.json",
  "./manifest.json",
  "./icons/icon.svg",
  "./icons/apple-touch-icon.png",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-512-maskable.png",
  "./icons/favicon-32x32.png",
  "./icons/favicon-16x16.png",
  "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js",
  "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js"
];

// Install: Pre-cache static shell assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[Service Worker] Pre-caching offline assets");
      return cache.addAll(PRECACHE_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activate: Clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            console.log("[Service Worker] Removing old cache:", name);
            return caches.delete(name);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: Stale-While-Revalidate for app assets, bypass for Firestore live streams
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // 1. Bypass Firestore live data / Google API calls (let Firebase SDK handle its own sync)
  if (
    url.hostname.includes("firestore.googleapis.com") ||
    url.hostname.includes("firebaseinstallations.googleapis.com") ||
    url.hostname.includes("google.com/recaptcha") ||
    url.pathname.includes("/google.firestore.")
  ) {
    return; // Pass through to network
  }

  // 2. Cache-first with network update for static assets
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (
            networkResponse &&
            networkResponse.status === 200 &&
            (url.origin === location.origin || url.hostname.includes("gstatic.com"))
          ) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // Network failed, if no cache available, nothing to return
        });

      return cachedResponse || fetchPromise;
    })
  );
});

