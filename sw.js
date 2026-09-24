// Minimal service worker — exists mainly to satisfy PWA installability
// requirements (so "Add to Home Screen" opens as a standalone app instead of
// a browser tab). This app's data all comes live from Google Apps Script, so
// there's no meaningful offline mode — this just caches the app shell itself
// (the HTML/manifest/icons) so the app opens instantly.

const CACHE_NAME = 'station-ledger-shell-v1';
const SHELL_FILES = ['./index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_FILES))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Never intercept anything but simple same-origin GETs. This is critical:
  // all real data (login, shift entries, etc.) goes through POST requests to
  // script.google.com, and those must always hit the network directly.
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) {
    return;
  }

  event.respondWith(
    fetch(req)
      .then((res) => {
        const resClone = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
        return res;
      })
      .catch(() => caches.match(req))
  );
});
