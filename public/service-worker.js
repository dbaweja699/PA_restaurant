// Service Worker for Restaurant AI Management Platform
const CACHE_NAME = 'restaurant-ai-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/sounds/alarm_clock.mp3',
  '/sounds/order-notification.mp3',
  '/sounds/booking-notification.mp3'
];

// Install event - cache essential files
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        return fetch(event.request).then(
          response => {
            // Check if we received a valid response
            if(!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return response;
          }
        );
      })
  );
});

// Handle push notifications
self.addEventListener('push', event => {
  const data = event.data.json();
  
  const options = {
    body: data.message,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/',
      ...data.details
    },
    actions: []
  };

  // Add specific actions for orders
  if (data.type === 'order') {
    options.actions = [
      {
        action: 'accept',
        title: 'Accept Order'
      },
      {
        action: 'dismiss',
        title: 'Dismiss'
      }
    ];
  }

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
  event.notification.close();

  // Handle action buttons
  if (event.action === 'accept') {
    // Process accepting an order
    event.waitUntil(
      clients.openWindow('/orders?action=accept&id=' + event.notification.data.orderId)
    );
  } else {
    // Default action is to open the app
    event.waitUntil(
      clients.openWindow(event.notification.data.url || '/')
    );
  }
});