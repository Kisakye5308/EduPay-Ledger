// Service Worker for EduPay Ledger PWA
// Provides offline support and caching

const CACHE_NAME = 'edupay-ledger-v1';
const OFFLINE_URL = '/offline.html';

// Assets to cache on install
const PRECACHE_ASSETS = [
  '/',
  '/dashboard',
  '/students',
  '/payments',
  '/reports',
  '/manifest.json',
  '/offline.html',
];

// Install event - cache core assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('EduPay SW: Caching core assets');
      return cache.addAll(PRECACHE_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => cacheName !== CACHE_NAME)
          .map((cacheName) => caches.delete(cacheName))
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip Chrome extension requests
  if (event.request.url.startsWith('chrome-extension://')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Return cached response and update cache in background
        event.waitUntil(
          fetch(event.request).then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, networkResponse.clone());
              });
            }
          }).catch(() => {
            // Network failed, that's okay - we served from cache
          })
        );
        return cachedResponse;
      }

      // Not in cache, fetch from network
      return fetch(event.request)
        .then((networkResponse) => {
          // Cache successful responses
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // Network failed, return offline page for navigation requests
          if (event.request.mode === 'navigate') {
            return caches.match(OFFLINE_URL);
          }
          return new Response('Offline', { status: 503 });
        });
    })
  );
});

// Background sync for offline payments
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-payments') {
    event.waitUntil(syncPendingPayments());
  }
});

async function syncPendingPayments() {
  try {
    // Get pending payments from IndexedDB
    const pendingPayments = await getPendingPaymentsFromDB();
    
    for (const payment of pendingPayments) {
      try {
        const response = await fetch('/api/payments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payment),
        });
        
        if (response.ok) {
          await removePendingPaymentFromDB(payment.id);
          // Notify the client
          self.clients.matchAll().then((clients) => {
            clients.forEach((client) => {
              client.postMessage({
                type: 'PAYMENT_SYNCED',
                paymentId: payment.id,
              });
            });
          });
        }
      } catch (error) {
        console.error('Failed to sync payment:', payment.id, error);
      }
    }
  } catch (error) {
    console.error('Sync failed:', error);
  }
}

// Placeholder functions for IndexedDB operations
async function getPendingPaymentsFromDB() {
  // Implementation would use IndexedDB
  return [];
}

async function removePendingPaymentFromDB(id) {
  // Implementation would use IndexedDB
  return;
}

// Push notification handling
self.addEventListener('push', (event) => {
  const data = event.data?.json() || {};
  
  const options = {
    body: data.body || 'New notification from EduPay Ledger',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/dashboard',
    },
    actions: [
      {
        action: 'view',
        title: 'View',
        icon: '/icons/action-view.png',
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
        icon: '/icons/action-dismiss.png',
      },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'EduPay Ledger', options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  const urlToOpen = event.notification.data?.url || '/dashboard';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if there's already a window open
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(urlToOpen);
          return client.focus();
        }
      }
      // Open new window if none exists
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
    })
  );
});
