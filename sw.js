// ─────────────────────────────────────────────────────────────────────
// BARBERHUB - SERVICE WORKER (CORREGIDO)
// ─────────────────────────────────────────────────────────────────────

const CACHE_NAME = 'barberhub-v1';

// ✅ Rutas relativas desde la raíz del repo
const urlsToCache = [
    './',
    './index.html',
    './manifest.json',
    './src/core/app.js',
    './src/core/router.js', 
    './src/core/storage.js',
    './src/core/utils.js',
    './src/styles/variables.css',
    './src/styles/base.css',
    './src/styles/layout.css',
    './src/config/routes.js',
    './src/components/Sidebar.js'
];

self.addEventListener('install', function(event) {
    console.log('🔧 SW: Instalando...', CACHE_NAME);
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(function(cache) {
                console.log('🔧 SW: Cacheando archivos...');
                return cache.addAll(urlsToCache.map(url => {
                    // ✅ Convertir a URL absoluta para evitar errores
                    return new URL(url, self.location.href).href;
                }));
            })
            .then(() => {
                console.log('✅ SW: Archivos cacheados');
                return self.skipWaiting();
            })
            .catch(function(error) {
                console.error('❌ SW: Error cacheando:', error);
            })
    );
});

self.addEventListener('activate', function(event) {
    console.log('🔧 SW: Activando...');
    event.waitUntil(
        caches.keys().then(function(cacheNames) {
            return Promise.all(
                cacheNames.filter(name => name.startsWith('barberhub') && name !== CACHE_NAME)
                    .map(name => caches.delete(name))
            );
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', function(event) {
    // Solo interceptar GET y solicitudes del mismo origen
    if (event.request.method !== 'GET') return;
    if (!event.request.url.startsWith(self.location.origin)) return;
    
    event.respondWith(
        caches.match(event.request)
            .then(function(response) {
                if (response) {
                    return response;
                }
                return fetch(event.request).then(function(response) {
                    if (!response || response.status !== 200) return response;
                    const responseToCache = response.clone();
                    caches.open(CACHE_NAME).then(function(cache) {
                        cache.put(event.request, responseToCache);
                    });
                    return response;
                });
            })
            .catch(function() {
                // Offline fallback
                if (event.request.mode === 'navigate') {
                    return caches.match('./index.html');
                }
                return new Response('Offline', { status: 503 });
            })
    );
});
