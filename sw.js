// ─────────────────────────────────────────────────────────────────────
// BARBERHUB - SERVICE WORKER (PATHS ABSOLUTOS)
// ─────────────────────────────────────────────────────────────────────

const CACHE_NAME = 'barberhub-v1';

// ✅ Detectar base path
const BASE_PATH = self.location.pathname.includes('/barberhub/') 
    ? '/barberhub' 
    : '';

// ✅ URLs absolutas desde la raíz del repo
const urlsToCache = [
    `${BASE_PATH}/`,
    `${BASE_PATH}/index.html`,
    `${BASE_PATH}/manifest.json`,
    `${BASE_PATH}/src/core/app.js`,
    `${BASE_PATH}/src/core/router.js`,
    `${BASE_PATH}/src/core/storage.js`,
    `${BASE_PATH}/src/core/utils.js`,
    `${BASE_PATH}/src/styles/variables.css`,
    `${BASE_PATH}/src/styles/base.css`,
    `${BASE_PATH}/src/styles/layout.css`,
    `${BASE_PATH}/src/config/routes.js`
];

self.addEventListener('install', function(event) {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(urlsToCache))
            .then(() => self.skipWaiting())
            .catch(err => console.error('❌ SW cache error:', err))
    );
});

self.addEventListener('activate', function(event) {
    event.waitUntil(
        caches.keys().then(names => 
            Promise.all(names.filter(n => n.startsWith('barberhub') && n !== CACHE_NAME)
                .map(n => caches.delete(n)))
        ).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', function(event) {
    if (event.request.method !== 'GET') return;
    if (!event.request.url.startsWith(self.location.origin)) return;
    
    event.respondWith(
        caches.match(event.request)
            .then(response => response || fetch(event.request))
            .catch(() => {
                if (event.request.mode === 'navigate') {
                    return caches.match(`${BASE_PATH}/index.html`);
                }
                return new Response('Offline', { status: 503 });
            })
    );
});
