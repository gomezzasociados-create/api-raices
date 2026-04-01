// sw.js - Service Worker Básico para Instalación de PWA

const CACHE_NAME = 'raices-cache-v1';

// Evento de instalación
self.addEventListener('install', (event) => {
    console.log('[Service Worker] Instalado');
    // Fuerza al SW a activarse inmediatamente
    self.skipWaiting();
});

// Evento de activación
self.addEventListener('activate', (event) => {
    console.log('[Service Worker] Activado');
    // Toma el control de los clientes de inmediato
    return self.clients.claim();
});

// Evento fetch (Requisito OBLIGATORIO de Chrome para permitir la instalación)
self.addEventListener('fetch', (event) => {
    // Por ahora, solo dejamos que las peticiones pasen normalmente a internet.
    // Esto cumple el requisito del navegador sin guardar tu app en caché
    // (lo que evita que te quedes viendo versiones viejas cuando actualizas el código).
});