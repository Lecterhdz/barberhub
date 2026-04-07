// ─────────────────────────────────────────────────────────────────────
// BARBERHUB - SERVICE WORKER (OFFLINE-FIRST)
// ─────────────────────────────────────────────────────────────────────

const CACHE_NAME = 'barberhub-v1';

const urlsToCache = [
    './',
    './index.html',
    '../src/core/app.js',
    '../src/core/router.js',
    '../src/core/storage.js',
    '../src/core/utils.js',
    '../src/styles/variables.css',
    '../src/styles/base.css',
    '../src/styles/layout.css'
];

self.addEventListener('install', function(event) {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(function(cache) {
                return cache.addAll(urlsToCache);
            })
    );
});

self.addEventListener('fetch', function(event) {
    event.respondWith(
        caches.match(event.request)
            .then(function(response) {
                return response || fetch(event.request);
            })
    );
});
