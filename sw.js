// al cambiar archivos se sube la version para que se instale el sw nuevo
const CACHE_STATIC_NAME = 'static-geo-v1';
const STATIC_FILES = [
    './',
    './index.html',
    './styles.css',
    './geo-helper.js',
    './app.js',
    './manifest.json',
    './icons/icon-192.png',
    './icons/icon-512.png'
];

self.addEventListener('install', (event) => {
    console.log('[SW] Instalando', CACHE_STATIC_NAME);
    event.waitUntil(
        caches.open(CACHE_STATIC_NAME)
            .then((cache) => cache.addAll(STATIC_FILES))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    console.log('[SW] Activado');
    event.waitUntil(
        caches.keys()
            .then((keys) => {
                return Promise.all(
                    keys.map((key) => {
                        if (key !== CACHE_STATIC_NAME) {
                            return caches.delete(key);
                        }
                    })
                );
            })
            .then(() => self.clients.claim())
    );
});

// cache first solo para los GET del mismo origen
self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET' || !event.request.url.startsWith(self.location.origin)) {
        return;
    }

    event.respondWith(
        caches.match(event.request, { ignoreSearch: true })
            .then((respuestaCache) => {
                return respuestaCache || fetch(event.request);
            })
    );
});
