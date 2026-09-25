// IronTracker Service Worker v1.0.0
// High-Performance Fitness PWA with Offline-First Caching & Background Sync

const CACHE_NAME = 'irontracker-pwa-v1';
const PRECACHE_ASSETS = [
  '/',
  '/manifest.webmanifest',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/icon.svg',
  '/icons/apple-touch-icon.png',
  '/favicon.svg',
];

// Install: Pre-cache core shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => self.skipWaiting())
      .catch((err) => console.warn('[SW] Pre-cache failed partially:', err))
  );
});

// Activate: Clean up previous caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((name) => {
            if (name !== CACHE_NAME) {
              console.log('[SW] Removendo cache obsoleto:', name);
              return caches.delete(name);
            }
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event handler with smart routing
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip chrome-extension, non-http, or non-origin analytics
  if (!url.protocol.startsWith('http')) return;

  // 1. Next.js Static Chunks & Media: Stale-While-Revalidate
  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.woff2')
  ) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cachedResponse = await cache.match(request);
        const fetchPromise = fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              cache.put(request, networkResponse.clone());
            }
            return networkResponse;
          })
          .catch(() => cachedResponse);

        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // 2. GET API requests (workouts, metrics, exercises, routines): Network First with Cache Fallback
  if (url.pathname.startsWith('/api/') && request.method === 'GET') {
    event.respondWith(
      fetch(request)
        .then(async (networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, networkResponse.clone());
          }
          return networkResponse;
        })
        .catch(async () => {
          // Device is offline or server unreachable - serve cached API snapshot
          const cachedResponse = await caches.match(request);
          if (cachedResponse) {
            return cachedResponse;
          }
          return new Response(
            JSON.stringify({ offline: true, data: null, error: 'Dispositivo offline.' }),
            {
              status: 503,
              headers: { 'Content-Type': 'application/json' },
            }
          );
        })
    );
    return;
  }

  // 3. Navigation Requests (HTML Pages): Network First, fallback to cached App Shell
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(async (networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, networkResponse.clone());
          }
          return networkResponse;
        })
        .catch(async () => {
          const cachedResponse = await caches.match(request);
          if (cachedResponse) return cachedResponse;

          // Fallback to cached home page
          const homeFallback = await caches.match('/');
          if (homeFallback) return homeFallback;

          return new Response(
            `<!DOCTYPE html>
            <html lang="pt-BR">
            <head>
              <meta charset="utf-8"/>
              <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
              <title>IronTracker - Modo Offline</title>
              <style>
                body { background: #090d14; color: #f8fafc; font-family: system-ui, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; text-align: center; padding: 20px; }
                h1 { color: #10b981; margin-bottom: 8px; }
                p { color: #94a3b8; max-width: 400px; line-height: 1.5; font-size: 14px; }
                button { margin-top: 16px; background: #10b981; color: #020617; border: 0; padding: 10px 20px; border-radius: 999px; font-weight: bold; cursor: pointer; }
              </style>
            </head>
            <body>
              <div>
                <h1>🏋️‍♂️ IronTracker Offline</h1>
                <p>Você está desconectado da internet. Seus dados e treinos salvos localmente serão sincronizados assim que a conexão retornar.</p>
                <button onclick="window.location.reload()">Tentar Reconectar</button>
              </div>
            </body>
            </html>`,
            { headers: { 'Content-Type': 'text/html' } }
          );
        })
    );
    return;
  }

  // Default: Network with Cache fallback
  event.respondWith(
    fetch(request).catch(async () => {
      const match = await caches.match(request);
      return match || Promise.reject('offline');
    })
  );
});

// Background Sync Event (Standard Web API)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-workouts' || event.tag === 'irontracker-sync') {
    event.waitUntil(broadcastSyncTrigger());
  }
});

// Broadcast sync triggers to active open tabs/windows
async function broadcastSyncTrigger() {
  const clients = await self.clients.matchAll({ includeUncontrolled: true, type: 'window' });
  for (const client of clients) {
    client.postMessage({ type: 'TRIGGER_BACKGROUND_SYNC', timestamp: Date.now() });
  }
}

// Communication with frontend
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
