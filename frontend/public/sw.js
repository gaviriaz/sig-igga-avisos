const CACHE_NAME = 'sig-igga-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/src/main.tsx'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                return cache.addAll(urlsToCache);
            })
    );
});

self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);

    // 🛠️ SENIOR MASTER FIX: NO interceptar peticiones al API o a Supabase
    // Esto evita errores de CORS falsos y permite que el backend responda directamente.
    if (url.port === '8000' || url.hostname.includes('supabase.co')) {
        return; // Deja que el navegador maneje la petición normalmente
    }

    event.respondWith(
        caches.match(event.request)
            .then(response => {
                if (response) return response;
                return fetch(event.request);
            })
    );
});
