// Service Worker for Restaurant AI Management Platform
const CACHE_NAME = 'restaurant-ai-v2';
const AUDIO_CACHE_NAME = 'restaurant-ai-audio-v2';

// Files to cache - regular app assets
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// Audio files to cache with high priority
const audioFilesToCache = [
  '/sounds/alarm_clock.mp3',
  '/sounds/order-notification.mp3',
  '/sounds/booking-notification.mp3'
];

// Install event - cache essential files
self.addEventListener('install', event => {
  console.log('[Service Worker] Installing...');
  
  // Cache regular app assets
  const cacheRegularAssets = caches.open(CACHE_NAME)
    .then(cache => {
      console.log('[Service Worker] Caching app shell');
      return cache.addAll(urlsToCache);
    });
    
  // Cache audio files with high priority
  const cacheAudioAssets = caches.open(AUDIO_CACHE_NAME)
    .then(cache => {
      console.log('[Service Worker] Caching audio files');
      return cache.addAll(audioFilesToCache);
    });
  
  event.waitUntil(Promise.all([cacheRegularAssets, cacheAudioAssets]));
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('[Service Worker] Activating...');
  
  const currentCaches = [CACHE_NAME, AUDIO_CACHE_NAME];
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (currentCaches.indexOf(cacheName) === -1) {
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

// Fetch event - serve from cache or network with special handling for audio files
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // Special handling for audio files - prioritize fresh network responses
  if (url.pathname.startsWith('/sounds/') && url.pathname.endsWith('.mp3')) {
    console.log('[Service Worker] Fetching audio file:', url.pathname);
    
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Clone the response for caching
          const responseToCache = response.clone();
          
          // Update the cache with the fresh audio file
          caches.open(AUDIO_CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
          
          return response;
        })
        .catch(() => {
          // If network fails, try to serve from cache
          console.log('[Service Worker] Serving audio from cache after network failure');
          return caches.match(event.request);
        })
    );
    return;
  }
  
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

// Function to play notification sound
async function playNotificationSound(type) {
  console.log('[Service Worker] Attempting to play notification sound for', type);
  
  try {
    // Try to find all clients of this service worker
    const clients = await self.clients.matchAll({
      includeUncontrolled: true,
      type: 'window'
    });
    
    if (clients && clients.length > 0) {
      // Send message to all clients to play sound
      clients.forEach(client => {
        console.log('[Service Worker] Sending play sound message to client');
        client.postMessage({
          action: 'playSound',
          soundType: type,
          soundPath: '/sounds/alarm_clock.mp3'
        });
      });
    } else {
      console.log('[Service Worker] No clients found to play sound');
    }
  } catch (error) {
    console.error('[Service Worker] Error playing notification sound:', error);
  }
}

// Handle push notifications
self.addEventListener('push', event => {
  console.log('[Service Worker] Push notification received');
  
  let data;
  try {
    data = event.data.json();
  } catch (e) {
    data = {
      title: 'New Notification',
      message: 'You have a new notification',
      type: 'default'
    };
  }
  
  const options = {
    body: data.message,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/',
      type: data.type,
      ...data.details
    },
    actions: [],
    requireInteraction: data.type === 'order',  // Keep order notifications visible
    silent: false  // Allow the browser to play sound
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

  // Try to play notification sound
  playNotificationSound(data.type);
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
  console.log('[Service Worker] Notification click received', event.action);
  
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