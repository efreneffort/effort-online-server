// Effort Online — Service Worker
// Versión: cambia este número al desplegar para forzar actualización
const CACHE_VERSION = 'effort-v3';

const PAGES_TO_CACHE = [
    '/login.html',
    '/dashboard.html',
    '/admin.html',
    '/reset-password.html',
    '/success.html',
    '/cancel.html',
    '/manifest.json',
    '/icon-180.png',
    '/icon-192.png',
    '/icon-512.png',
];

// ── Instalación: precaché de páginas ────────────────────────────
self.addEventListener('install', e => {
    e.waitUntil(
        caches.open(CACHE_VERSION)
            .then(cache => cache.addAll(PAGES_TO_CACHE))
            .then(() => self.skipWaiting())
    );
});

// ── Activación: limpia cachés antiguas ──────────────────────────
self.addEventListener('activate', e => {
    e.waitUntil(
        caches.keys()
            .then(keys => Promise.all(
                keys.filter(k => k !== CACHE_VERSION).map(k => caches.delete(k))
            ))
            .then(() => self.clients.claim())
    );
});

// ── Fetch: Network-first con fallback a caché ───────────────────
self.addEventListener('fetch', e => {
    const url = e.request.url;

    // Las llamadas API siempre van a red (nunca cachear datos dinámicos)
    if (url.includes('/api/')) return;

    // Solo GET
    if (e.request.method !== 'GET') return;

    // Solo recursos de nuestro propio origen
    if (!url.startsWith(self.location.origin)) return;

    e.respondWith(
        fetch(e.request)
            .then(fresh => {
                // Actualiza la caché con la versión fresca
                const copy = fresh.clone();
                caches.open(CACHE_VERSION)
                    .then(cache => cache.put(e.request, copy));
                return fresh;
            })
            .catch(() =>
                // Sin red → sirve desde caché (funciona offline)
                caches.match(e.request)
            )
    );
});
