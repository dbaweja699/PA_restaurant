import { useEffect, useState } from 'react';

/**
 * Component to preload notification sounds to ensure they play correctly
 * This is especially important for production deployments
 */
const SoundPreloader = () => {
  const [preloadStatus, setPreloadStatus] = useState<Record<string, string>>({});
  
  useEffect(() => {
    const getBasePath = () => {
      // Check if we're in a production domain
      if (window.location.hostname !== 'localhost' && !window.location.hostname.includes('replit')) {
        return window.location.origin;
      }
      return '';
    };

    const preloadAudio = async () => {
      const basePath = getBasePath();
      const soundFiles = ['alarm_clock.mp3'];
      const soundLocations = [
        '/api/sound/',
        '/sounds/',
        `${basePath}/api/sound/`,
        `${basePath}/sounds/`,
      ];
      
      // Create a status object for tracking
      const status: Record<string, string> = {};
      
      // Try to preload each sound from each location
      for (const file of soundFiles) {
        for (const location of soundLocations) {
          const url = `${location}${file}`;
          
          try {
            // Try to load the audio file
            const audio = new Audio();
            audio.preload = 'auto';
            
            // Create a promise that resolves when the audio loads or errors
            const loadPromise = new Promise<void>((resolve, reject) => {
              audio.oncanplaythrough = () => {
                status[url] = 'loaded';
                console.log(`Sound preloaded successfully: ${url}`);
                resolve();
              };
              
              audio.onerror = (e) => {
                status[url] = `error: ${audio.error?.code || 'unknown'}`;
                console.error(`Failed to preload sound from ${url}:`, e);
                reject(new Error(`Failed to load sound: ${audio.error?.message || 'unknown error'}`));
              };
              
              // Set a timeout in case the audio hangs
              setTimeout(() => {
                if (!status[url]) {
                  status[url] = 'timeout';
                  console.warn(`Timeout preloading sound from ${url}`);
                  reject(new Error('Timeout loading sound'));
                }
              }, 5000);
            });
            
            // Set the source and start loading
            audio.src = url;
            status[url] = 'loading';
            
            try {
              await loadPromise;
              // Store this successful audio element in window for later use
              (window as any).preloadedAudios = (window as any).preloadedAudios || {};
              (window as any).preloadedAudios[file] = audio;
            } catch (err) {
              console.warn(`Couldn't preload ${url}, trying next source`);
            }
          } catch (err) {
            status[url] = `exception: ${err instanceof Error ? err.message : String(err)}`;
            console.error(`Exception preloading ${url}:`, err);
          }
        }
      }
      
      // Check if service worker is registered for notifications
      if ('serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.getRegistration();
          status['serviceWorker'] = registration ? 'registered' : 'not registered';
          
          // Check notification permission
          if ('Notification' in window) {
            status['notificationPermission'] = Notification.permission;
          }
        } catch (err) {
          status['serviceWorker'] = `error: ${err instanceof Error ? err.message : String(err)}`;
        }
      }
      
      // Update status for debugging
      setPreloadStatus(status);
      console.log('Sound preload status:', status);
      
      // Try to ping the check-sounds endpoint to verify server-side sounds
      try {
        const checkResponse = await fetch('/api/check-sounds');
        const checkData = await checkResponse.json();
        console.log('Sound file check from server:', checkData);
      } catch (err) {
        console.error('Failed to check sound files from server:', err);
      }
    };

    // Run the preloader
    preloadAudio();
    
    // Debug message for production
    console.log('Sound preloader initialized, running in:', 
      process.env.NODE_ENV || 'development',
      'on host:', window.location.hostname);
    
  }, []);

  // This component doesn't render anything visible
  return null;
};

export default SoundPreloader;