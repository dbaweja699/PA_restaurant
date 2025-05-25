import { useEffect, useState } from 'react';

interface SoundFallbackProps {
  notificationType: 'order' | 'booking' | 'function_booking';
  enabled: boolean;
}

/**
 * Component that provides a fallback method for playing notification sounds
 * This component is designed to work around autoplay restrictions in browsers
 */
const SoundFallback = ({ notificationType, enabled }: SoundFallbackProps) => {
  const [fallbackElement, setFallbackElement] = useState<HTMLDivElement | null>(null);
  
  useEffect(() => {
    if (!enabled) return;
    
    // Create a visual fallback that users can click to enable sound
    const createFallbackElement = () => {
      // Create fallback element if it doesn't exist
      if (!fallbackElement) {
        const div = document.createElement('div');
        div.style.position = 'fixed';
        div.style.bottom = '20px';
        div.style.right = '20px';
        div.style.backgroundColor = '#f44336';
        div.style.color = 'white';
        div.style.padding = '10px 15px';
        div.style.borderRadius = '4px';
        div.style.zIndex = '9999';
        div.style.cursor = 'pointer';
        div.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
        div.style.display = 'flex';
        div.style.alignItems = 'center';
        div.style.gap = '10px';
        
        // Add sound icon
        const iconSpan = document.createElement('span');
        iconSpan.innerHTML = '🔔';
        iconSpan.style.fontSize = '24px';
        div.appendChild(iconSpan);
        
        // Add text content based on notification type
        const textSpan = document.createElement('span');
        textSpan.style.fontWeight = 'bold';
        
        if (notificationType === 'order') {
          div.style.backgroundColor = '#f44336'; // Red for orders
          textSpan.textContent = 'New Order! Click to enable sound';
          // Flash the title to draw attention
          let originalTitle = document.title;
          let titleInterval = setInterval(() => {
            document.title = document.title === originalTitle ? 
              '🔔 New Order!' : originalTitle;
          }, 1000);
          
          // Clear interval after 30 seconds
          setTimeout(() => clearInterval(titleInterval), 30000);
        } else if (notificationType === 'booking') {
          div.style.backgroundColor = '#2196F3'; // Blue for bookings
          textSpan.textContent = 'New Booking! Click to enable sound';
        } else {
          div.style.backgroundColor = '#4CAF50'; // Green for function bookings
          textSpan.textContent = 'New Function Booking! Click to enable sound';
        }
        
        div.appendChild(textSpan);
        
        // Add click handler to play sound
        div.onclick = () => {
          console.log('Fallback element clicked, trying to play sound');
          
          // Try to play the sound
          const soundSources = [
            '/api/sound/alarm_clock.mp3',
            '/sounds/alarm_clock.mp3',
            `${window.location.origin}/api/sound/alarm_clock.mp3`,
            `${window.location.origin}/sounds/alarm_clock.mp3`,
            'https://princealberthotel.dblytics.com/api/sound/alarm_clock.mp3',
            'https://princealberthotel.dblytics.com/sounds/alarm_clock.mp3'
          ];
          
          const tryPlaySound = (sources: string[]) => {
            if (!sources.length) {
              console.error('All sound sources failed');
              return;
            }
            
            const currentSource = sources[0];
            const remainingSources = sources.slice(1);
            
            const audio = new Audio(currentSource);
            audio.volume = 1.0;
            
            // For orders, loop the sound
            if (notificationType === 'order') {
              audio.loop = true;
            }
            
            const playPromise = audio.play();
            if (playPromise !== undefined) {
              playPromise
                .then(() => {
                  console.log(`Successfully playing sound from: ${currentSource}`);
                  // Store in window for other components to access
                  (window as any).currentNotificationAudio = audio;
                  
                  // Remove the fallback element
                  if (div.parentNode) {
                    div.parentNode.removeChild(div);
                  }
                })
                .catch(err => {
                  console.error(`Error playing from ${currentSource}:`, err);
                  // Try next source
                  if (remainingSources.length) {
                    tryPlaySound(remainingSources);
                  }
                });
            }
          };
          
          tryPlaySound(soundSources);
        };
        
        // Add to document
        document.body.appendChild(div);
        setFallbackElement(div);
        
        // Remove after 30 seconds if not clicked
        setTimeout(() => {
          if (div.parentNode) {
            div.parentNode.removeChild(div);
            setFallbackElement(null);
          }
        }, 30000);
      }
    };
    
    // Create the fallback element
    createFallbackElement();
    
    // Cleanup
    return () => {
      if (fallbackElement && fallbackElement.parentNode) {
        fallbackElement.parentNode.removeChild(fallbackElement);
      }
    };
  }, [enabled, notificationType, fallbackElement]);
  
  // This component doesn't render anything in the DOM
  return null;
};

export default SoundFallback;