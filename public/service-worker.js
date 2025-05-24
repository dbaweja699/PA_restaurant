// Service Worker for Restaurant AI Management Platform
const CACHE_NAME = 'restaurant-ai-v3';

// Files to cache - regular app assets
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// Check if we're in production or development
const isProduction = self.location.hostname !== 'localhost' && !self.location.hostname.includes('replit');

// Get the base path for production URLs
const getBasePath = () => {
  return isProduction ? self.location.origin : '';
};

// Install event - cache essential files
self.addEventListener('install', event => {
  console.log('[Service Worker] Installing...');
  
  // Cache regular app assets
  const cacheRegularAssets = caches.open(CACHE_NAME)
    .then(cache => {
      console.log('[Service Worker] Caching app shell');
      return cache.addAll(urlsToCache);
    });
  
  event.waitUntil(cacheRegularAssets);
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('[Service Worker] Activating...');
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[Service Worker] Activated and controlling clients');
      return self.clients.claim();
    })
  );
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', event => {
  
  // Standard caching strategy for other assets
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        
        // Clone the request because it's a one-time use stream
        const fetchRequest = event.request.clone();
        
        return fetch(fetchRequest).then(
          response => {
            // Check if we received a valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
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

// No sound functions needed

// Handle push notifications
self.addEventListener('push', event => {
  console.log('[Service Worker] Push notification received');
  
  let data;
  try {
    data = event.data.json();
  } catch (e) {
    console.error('[Service Worker] Error parsing push data:', e);
    data = {
      title: 'New Notification',
      message: 'You have a new notification',
      type: 'default'
    };
  }
  
  // Log the push notification data for debugging
  console.log('[Service Worker] Push notification data:', data);
  
  // Get base path for production environment
  const basePath = getBasePath();
  
  const options = {
    body: data.message,
    icon: `${basePath}/icons/icon-192x192.png`,
    badge: `${basePath}/icons/icon-192x192.png`,
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/',
      type: data.type,
      orderId: data.details?.orderId,
      ...data.details
    },
    actions: [],
    requireInteraction: data.type === 'order',  // Keep order notifications visible
    silent: false,  // Allow the browser to play sound
    tag: `restaurant-notification-${data.type}-${data.details?.id || Date.now()}`
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
  console.log('[Service Worker] Notification click received', event.action);
  console.log('[Service Worker] Notification data:', event.notification.data);
  
  // Close the notification right away
  event.notification.close();
  
  // Try to focus an existing window first rather than opening a new one
  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    })
    .then(windowClients => {
      // Get notification data
      const data = event.notification.data;
      const orderId = data?.orderId;
      const notificationType = data?.type;
      
      // Define the URL to navigate to based on the action and notification type
      let targetUrl = '/';
      
      if (event.action === 'accept' && notificationType === 'order' && orderId) {
        // Accept order action
        targetUrl = `/orders?action=accept&id=${orderId}`;
      } else if (notificationType === 'order') {
        // Order notification but not accept action
        targetUrl = `/orders${orderId ? `?id=${orderId}` : ''}`;
      } else if (notificationType === 'booking') {
        // Booking notification
        targetUrl = '/bookings';
      } else if (notificationType === 'function_booking') {
        // Function booking notification
        targetUrl = '/function-bookings';
      } else if (data?.url) {
        // Use provided URL if available
        targetUrl = data.url;
      }
      
      // Log the target URL for debugging
      console.log(`[Service Worker] Navigating to: ${targetUrl}`);
      
      // Check if there's already a window open
      const matchingClient = windowClients.find(client => 
        client.url.includes(self.location.origin) && 
        'focus' in client
      );
      
      if (matchingClient) {
        // If we have an existing window, focus it and navigate
        console.log('[Service Worker] Focusing existing window');
        return matchingClient.focus().then(client => {
          // Only navigate if the client supports it
          if (client && 'navigate' in client) {
            return client.navigate(targetUrl);
          }
        });
      } else {
        // If no existing window, open a new one
        console.log('[Service Worker] Opening new window');
        return clients.openWindow(targetUrl);
      }
    })
    .catch(err => {
      console.error('[Service Worker] Error handling notification click:', err);
      // Fallback to simple window open
      return clients.openWindow(event.notification.data?.url || '/');
    })
  );
});