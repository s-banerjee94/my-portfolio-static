const CACHE_NAME = "sb-portfolio-v1";
const urlsToCache = [
  "/",
  "/index.html",
  "/offline.html",
  "/assets/favicon/site.webmanifest",
  "/assets/favicon/favicon.ico",
  "/assets/favicon/favicon-16x16.png",
  "/assets/favicon/favicon-32x32.png",
  "/assets/favicon/apple-touch-icon.png",
  "/assets/favicon/android-chrome-192x192.png",
  "/assets/favicon/android-chrome-512x512.png",
  "/assets/sandeepan.jpg",
  "/assets/sandeepan-about.jpg",
  "/assets/github.png",
  "/assets/linkedin.png",
  "/assets/email.png",
  "/assets/arrow.png",
  "/assets/checkmark.png",
  "/assets/experience.png",
  "/assets/icons8-education-100.png",
  "/styles/styles.css",
  "/styles/mediaquery.css",
  "/scripts/index.js",
];

// Helper function to check if URL should be cached
function shouldCache(url) {
  return urlsToCache.includes(new URL(url).pathname);
}

// Install event with error handling
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("Cache opened successfully");
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.error("Cache installation failed:", error);
        throw error;
      })
  );
});

// Add activate event handler
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => cacheName !== CACHE_NAME)
            .map((cacheName) => caches.delete(cacheName))
        );
      })
      .catch((error) => {
        console.error("Cache activation failed:", error);
        throw error;
      })
  );
});

// Helper function to check if URL is from our domain
function isSameOrigin(url) {
  const requestURL = new URL(url, self.location.origin);
  return requestURL.origin === self.location.origin;
}

// Improved fetch event with better cache control
self.addEventListener("fetch", (event) => {
  // Only handle GET requests from our domain
  if (event.request.method !== "GET" || !isSameOrigin(event.request.url)) {
    return;
  }

  event.respondWith(
    caches
      .match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }

        return fetch(event.request).then((response) => {
          // Only cache successful responses for static assets
          if (
            !response ||
            response.status !== 200 ||
            !shouldCache(event.request.url)
          ) {
            return response;
          }

          // Clone and cache the response
          const responseToCache = response.clone();
          caches
            .open(CACHE_NAME)
            .then((cache) => cache.put(event.request, responseToCache))
            .catch((error) =>
              console.error("Failed to cache response:", error)
            );

          return response;
        });
      })
      .catch((error) => {
        console.error("Fetch failed:", error);
        return caches.match("/offline.html") || new Response("You are offline");
      })
  );
});

// Handle errors globally
self.addEventListener("error", (event) => {
  console.error("Service Worker error:", event.error);
});

self.addEventListener("unhandledrejection", (event) => {
  console.error("Unhandled promise rejection:", event.reason);
});
