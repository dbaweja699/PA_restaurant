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
  '/api/sound/alarm_clock.mp3',
  '/sounds/order-notification.mp3',
  '/sounds/booking-notification.mp3'
];

// Check if we're in production or development
const isProduction = self.location.hostname !== 'localhost' && !self.location.hostname.includes('replit');

// Get the base path for production URLs
const getBasePath = () => {
  return isProduction ? self.location.origin : '';
};

// Correct audio file paths for production
const correctAudioPaths = audioFilesToCache.map(path => {
  return `${getBasePath()}${path}`;
});

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
      // Use the corrected paths that account for production vs dev
      return cache.addAll(correctAudioPaths);
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
  if (url.pathname.includes('/sounds/') && url.pathname.endsWith('.mp3')) {
    console.log('[Service Worker] Fetching audio file:', url.pathname);
    
    event.respondWith(
      // Try the network first
      fetch(event.request)
        .then(response => {
          if (!response || response.status !== 200) {
            throw new Error('Network response was not ok');
          }
          
          // Clone the response for caching
          const responseToCache = response.clone();
          
          // Update the cache with the fresh audio file
          caches.open(AUDIO_CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
          
          return response;
        })
        .catch(error => {
          console.log('[Service Worker] Network fetch failed for audio, trying cache:', error);
          
          // If network fails, try to serve from cache
          return caches.match(event.request)
            .then(cachedResponse => {
              if (cachedResponse) {
                console.log('[Service Worker] Found audio in cache');
                return cachedResponse;
              }
              
              // If not in cache, try alternative URLs (with and without origin)
              const audioName = url.pathname.split('/').pop();
              const alternativeUrls = [
                `/sounds/${audioName}`,
                `${self.location.origin}/sounds/${audioName}`
              ];
              
              console.log('[Service Worker] Trying alternative audio URLs:', alternativeUrls);
              
              // Try each alternative URL
              return Promise.any(
                alternativeUrls.map(altUrl => 
                  caches.match(new Request(altUrl))
                  .then(altResponse => {
                    if (altResponse) {
                      console.log('[Service Worker] Found audio in cache with alternative URL:', altUrl);
                      return altResponse;
                    }
                    throw new Error(`No cached response for ${altUrl}`);
                  })
                )
              ).catch(() => {
                console.log('[Service Worker] Could not find audio in cache, returning empty response');
                return new Response('Audio not found', { status: 404 });
              });
            });
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
    // Determine sound file based on notification type
    let soundFile = 'alarm_clock.mp3';
    if (type === 'booking') {
      soundFile = 'booking-notification.mp3';
    } else if (type === 'function_booking') {
      soundFile = 'booking-notification.mp3';
    }
    
    // Get base path for production vs development environment
    const basePath = getBasePath();
    const soundUrl = `${basePath}/sounds/${soundFile}`;
    
    console.log(`[Service Worker] Using sound URL: ${soundUrl}`);
    
    // Try to find all clients of this service worker
    const allClients = await self.clients.matchAll({
      includeUncontrolled: true,
      type: 'window'
    });
    
    if (allClients && allClients.length > 0) {
      // Send message to all clients to play sound
      allClients.forEach(client => {
        console.log('[Service Worker] Sending play sound message to client:', client.id);
        
        // Send multiple possible paths to the client
        // This helps ensure at least one path works in production
        client.postMessage({
          action: 'playSound',
          soundType: type,
          soundPath: soundUrl,
          // Include alternative paths for better cross-environment compatibility
          alternativePaths: [
            `/api/sound/${soundFile}`,
            `/sounds/${soundFile}`,
            `${self.location.origin}/api/sound/${soundFile}`,
            `${self.location.origin}/sounds/${soundFile}`,
            `https://${self.location.hostname}/api/sound/${soundFile}`,
            `https://${self.location.hostname}/sounds/${soundFile}`
          ]
        });
      });
      
      // Also try to ensure the sound is cached for future use
      try {
        const cache = await caches.open(AUDIO_CACHE_NAME);
        const cachedResponse = await cache.match(soundUrl);
        
        if (!cachedResponse || !cachedResponse.ok) {
          console.log('[Service Worker] Sound not in cache, attempting to fetch and cache it');
          fetch(soundUrl)
            .then(response => {
              if (response.ok) {
                cache.put(soundUrl, response.clone());
                console.log('[Service Worker] Successfully cached sound for future use');
              }
            })
            .catch(err => {
              console.error('[Service Worker] Failed to fetch and cache sound:', err);
            });
        }
      } catch (cacheError) {
        console.error('[Service Worker] Error with cache operations:', cacheError);
      }
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

  // Try to play notification sound
  playNotificationSound(data.type);
  
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