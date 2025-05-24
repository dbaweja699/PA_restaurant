import { useEffect, useRef } from 'react';

export function ServiceWorkerHandler() {
  const audioRef = useRef<Record<string, HTMLAudioElement | null>>({
    order: null,
    booking: null,
    function_booking: null,
    default: null
  });

  // Listen for messages from service worker
  useEffect(() => {
    // Initialize audio elements for different notification types
    audioRef.current.order = new Audio('/sounds/alarm_clock.mp3');
    audioRef.current.booking = new Audio('/sounds/alarm_clock.mp3');
    audioRef.current.function_booking = new Audio('/sounds/alarm_clock.mp3');
    audioRef.current.default = new Audio('/sounds/alarm_clock.mp3');
    
    // For orders, enable looping to make sure it gets attention
    if (audioRef.current.order) {
      audioRef.current.order.loop = true;
    }
    
    // Preload all audio files
    Object.values(audioRef.current).forEach(audio => {
      if (audio) {
        audio.load();
      }
    });

    // Handler for service worker messages
    const handleServiceWorkerMessage = (event: MessageEvent) => {
      if (event.data && event.data.action === 'playSound') {
        const { soundType, soundPath } = event.data;
        console.log('Received request to play sound from service worker:', soundType, soundPath);
        
        try {
          // Determine which audio element to use
          let audioElement = audioRef.current.default;
          
          if (soundType === 'order' && audioRef.current.order) {
            audioElement = audioRef.current.order;
          } else if (soundType === 'booking' && audioRef.current.booking) {
            audioElement = audioRef.current.booking;
          } else if (soundType === 'function_booking' && audioRef.current.function_booking) {
            audioElement = audioRef.current.function_booking;
          }
          
          if (audioElement) {
            // Make sure the sound is loaded
            audioElement.src = soundPath;
            audioElement.load();
            
            // Try to play the sound
            const playPromise = audioElement.play();
            if (playPromise !== undefined) {
              playPromise.catch(err => {
                console.error('Failed to play notification sound from service worker:', err);
                
                // We're in a PWA context, so we should be able to play audio
                // But if not, we can try again after user interaction
                const handleUserGesture = () => {
                  audioElement?.play().catch(e => {
                    console.error('Still failed to play sound after user interaction:', e);
                  });
                };
                
                // Listen for user interaction once
                document.addEventListener('click', handleUserGesture, { once: true });
              });
            }
          }
        } catch (err) {
          console.error('Error playing notification sound from service worker:', err);
        }
      }
    };

    // Register the message listener
    navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);

    // Clean up
    return () => {
      navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage);
      
      // Clean up audio elements
      Object.values(audioRef.current).forEach(audio => {
        if (audio) {
          audio.pause();
          audio.src = '';
        }
      });
      
      audioRef.current = {
        order: null,
        booking: null,
        function_booking: null,
        default: null
      };
    };
  }, []);

  // This component doesn't render anything
  return null;
}