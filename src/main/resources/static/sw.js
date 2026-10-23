// sw.js - Service Worker Express Ultra-Rápido para RAÍCES
const CACHE_NAME = 'raices-express-v2';

const PRECACHE_ASSETS = [
    '/',
    '/manifest-menu.json',
    'puerta-magica.jpg',
    'lianas-limpias.png',
    'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css',
    'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js',
    'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css',
    'https://fonts.googleapis.com/css2?family=Orbitron:wght@500;700;900&family=Rajdhani:wght@500;600;700&display=swap'
];

// Instalación: Pre-almacenar en caché del dispositivo los recursos críticos
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(PRECACHE_ASSETS).catch((err) => {
                console.warn('[SW Express] Error en precache parcial:', err);
            });
        }).then(() => self.skipWaiting())
    );
});

// Activación: Purgar cachés viejos
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((name) => {
                    if (name !== CACHE_NAME) {
                        return caches.delete(name);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Estrategia de Fetch Inteligente:
// 1. /api/** -> SIEMPRE RED VIVA (Network Only) para base de datos PostgreSQL viva y sin caché
// 2. Video/Audio -> Passthrough directo para soportar 206 Partial Content
// 3. Estáticos (imágenes, fuentes, css, js) -> Cache First con actualización en segundo plano
self.addEventListener('fetch', (event) => {
    const req = event.request;
    const url = new URL(req.url);

    // Las APIs de PostgreSQL NUNCA se cachean en el Service Worker
    if (url.pathname.startsWith('/api/')) {
        return;
    }

    // Multimedia pesada en streaming pasa directo por la red
    if (url.pathname.endsWith('.mp4') || url.pathname.endsWith('.mp3')) {
        return;
    }

    // Para recursos estáticos: Cache First con fallback a Red
    if (
        req.destination === 'style' ||
        req.destination === 'script' ||
        req.destination === 'font' ||
        req.destination === 'image' ||
        url.hostname.includes('cdn.jsdelivr.net') ||
        url.hostname.includes('fonts.googleapis.com') ||
        url.hostname.includes('fonts.gstatic.com')
    ) {
        event.respondWith(
            caches.match(req).then((cachedResponse) => {
                if (cachedResponse) {
                    // Si está en caché, servirlo al instante (0ms)
                    // y actualizar en segundo plano silenciosamente
                    fetch(req).then((networkResponse) => {
                        if (networkResponse && networkResponse.status === 200) {
                            caches.open(CACHE_NAME).then((cache) => cache.put(req, networkResponse));
                        }
                    }).catch(() => {});
                    return cachedResponse;
                }
                return fetch(req).then((networkResponse) => {
                    if (networkResponse && networkResponse.status === 200) {
                        const responseClone = networkResponse.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put(req, responseClone));
                    }
                    return networkResponse;
                });
            })
        );
        return;
    }

    // Para navegación HTML (App Shell): Network First con fallback a caché
    if (req.mode === 'navigate') {
        event.respondWith(
            fetch(req).catch(() => caches.match(req).then(cached => cached || caches.match('/')))
        );
    }
});
