'use client';

import { useEffect, useState } from 'react';

/**
 * This component preloads sound files to ensure they're available for notifications,
 * especially important for PWA environments and production deployment.
 */
export default function SoundPreloader() {
  const [loaded, setLoaded] = useState(false);
  
  useEffect(() => {
    // Only load sounds once
    if (loaded) return;
    
    // List of sounds to preload
    const soundsToPreload = [
      '/sounds/alarm_clock.mp3',
      '/sounds/order-notification.mp3',
      '/sounds/booking-notification.mp3'
    ];
    
    // Function to preload a single sound and return a promise
    const preloadSound = (url: string): Promise<boolean> => {
      return new Promise((resolve) => {
        // Get base path for production vs development environment
        const getBasePath = () => {
          // Check if we're in a production domain
          if (window.location.hostname !== 'localhost' && !window.location.hostname.includes('replit')) {
            return window.location.origin;
          }
          return '';
        };
        
        const basePath = getBasePath();
        const fullUrl = `${basePath}${url}`;
        
        console.log(`Preloading sound: ${fullUrl}`);
        
        const audio = new Audio();
        
        // Set up events
        audio.oncanplaythrough = () => {
          console.log(`Sound preloaded successfully: ${fullUrl}`);
          resolve(true);
        };
        
        audio.onerror = (err) => {
          console.error(`Failed to preload sound ${fullUrl}:`, err);
          resolve(false);
        };
        
        // Try to load the audio file
        audio.src = fullUrl;
        audio.load();
        
        // Add to cache via service worker if available
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
          // Send message to service worker to ensure the sound is cached
          navigator.serviceWorker.controller.postMessage({
            action: 'cacheSound',
            soundPath: fullUrl
          });
        }
      });
    };
    
    // Preload all sounds
    Promise.all(soundsToPreload.map(preloadSound))
      .then(results => {
        const successCount = results.filter(Boolean).length;
        console.log(`Preloaded ${successCount}/${soundsToPreload.length} sounds`);
        setLoaded(true);
      });
    
    // Add sound prefetch links to head
    const addPrefetchLinks = () => {
      soundsToPreload.forEach(sound => {
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = sound;
        link.as = 'audio';
        document.head.appendChild(link);
      });
    };
    
    addPrefetchLinks();
    
    // Clean up function
    return () => {
      // Remove prefetch links on unmount
      document.querySelectorAll('link[rel="prefetch"][as="audio"]').forEach(link => {
        document.head.removeChild(link);
      });
    };
  }, [loaded]);
  
  // This component doesn't render anything visible
  return null;
}