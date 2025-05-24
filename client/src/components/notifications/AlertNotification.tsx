import { useState, useEffect, useRef } from 'react';
import { ShoppingBag, Calendar, X, Music, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { apiRequest } from '@/lib/queryClient';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

type AlertNotificationProps = {
  type: 'order' | 'booking' | 'function_booking';
  title: string;
  message: string;
  details: Record<string, any>;
  onClose: () => void;
  onAccept?: () => void;
  autoClose?: boolean;
  autoCloseTime?: number;
};

export function AlertNotification({
  type,
  title,
  message,
  details,
  onClose,
  onAccept,
  autoClose = false,
  autoCloseTime = 7000,
}: AlertNotificationProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioIntervalRef = useRef<number | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [hasRequestedPermission, setHasRequestedPermission] = useState(false);

  // Order ID text for display
  const orderIdText = type === 'order' && details.orderId ? ` #${details.orderId}` : '';

  // Check if we've already seen this notification
  const [notificationAlreadySeen, setNotificationAlreadySeen] = useState<boolean>(() => {
    try {
      const seenNotifications = localStorage.getItem('processedNotificationIds');
      if (seenNotifications && details.id) {
        const ids = JSON.parse(seenNotifications);
        return ids.includes(details.id);
      }
      return false;
    } catch (e) {
      return false;
    }
  });

  // Request notification permission
  useEffect(() => {
    if (!hasRequestedPermission && 'Notification' in window) {
      setHasRequestedPermission(true);
      
      if (Notification.permission !== "granted" && Notification.permission !== "denied") {
        Notification.requestPermission().then(permission => {
          console.log(`Notification permission ${permission}`);
          
          // If permission granted and we have a service worker, register for push
          if (permission === "granted" && 'serviceWorker' in navigator && 'PushManager' in window) {
            console.log("Push notification supported and permission granted");
          }
        });
      }
    }
  }, [hasRequestedPermission]);

  // Play alert notification sound when component mounts
  useEffect(() => {
    // Skip playing sound if we've already seen this notification
    if (notificationAlreadySeen) {
      console.log("Notification already seen, skipping sound playback");
      return;
    }
    
    // Try to play the notification sound
    try {
      // Make sure we use the proper base URL for production
      const getBasePath = () => {
        // Check if we're in a production domain
        if (window.location.hostname !== 'localhost' && !window.location.hostname.includes('replit')) {
          return window.location.origin;
        }
        return '';
      };

      const basePath = getBasePath();
      const soundPath = `${basePath}/sounds/alarm_clock.mp3`;
      console.log(`Loading sound from: ${soundPath}`);

      // Create and configure audio element immediately
      audioRef.current = new Audio(soundPath);
      audioRef.current.volume = 1.0;
      audioRef.current.preload = 'auto';
      
      // Add error handler for debugging production issues
      audioRef.current.onerror = (e) => {
        console.error('Audio error:', e);
        console.error('Audio error code:', audioRef.current?.error?.code);
        console.error('Audio error message:', audioRef.current?.error?.message);
      };
      
      // For orders, we'll loop the sound until it's accepted or dismissed
      if (type === 'order') {
        // Loop continuously for orders until accepted or dismissed
        // Using a clean implementation that works across browsers
        const handleAudioEnded = () => {
          if (audioRef.current) {
            audioRef.current.currentTime = 0;
            // Try to play again
            const playPromise = audioRef.current.play();
            if (playPromise !== undefined) {
              playPromise.catch(err => {
                console.error("Failed to replay notification sound:", err);
              });
            }
          }
        };
        
        // Add the event listener for continuous play
        audioRef.current.addEventListener('ended', handleAudioEnded);
        
        // Save the handler for cleanup
        audioIntervalRef.current = window.setInterval(() => {
          // If sound stopped for any reason, try to restart it
          if (audioRef.current && audioRef.current.paused) {
            audioRef.current.play().catch(err => {
              console.error("Failed to restart notification sound:", err);
            });
          }
        }, 2000); // Check every 2 seconds
      }
      
      // Also show a system notification if permission is granted
      if ('Notification' in window && Notification.permission === "granted") {
        let icon = '/icons/icon-192x192.png';
        let typeText = type === 'order' ? 'Order' : type === 'booking' ? 'Booking' : 'Function Booking';
        
        try {
          const notification = new Notification(`New ${typeText}: ${title}`, {
            body: message,
            icon: icon,
            tag: `restaurant-notification-${type}-${details.id || Date.now()}`,
            // Set silent to false to let the browser play its own sound too
            silent: false
          });
          
          notification.onclick = () => {
            window.focus();
            notification.close();
          };
        } catch (notificationErr) {
          console.error("Error creating system notification:", notificationErr);
        }
      }
      
      // Play the sound - multiple strategies for cross-browser compatibility
      const playSound = () => {
        if (!audioRef.current) return;
        
        console.log("Attempting to play notification sound");
        
        // Check if running in standalone mode (PWA installed)
        const isPwa = window.matchMedia('(display-mode: standalone)').matches;
        console.log("Is running as PWA:", isPwa);
        
        // For PWA, try to create and use an AudioContext first (more reliable in PWAs)
        if (isPwa) {
          try {
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
            if (AudioContext) {
              const audioContext = new AudioContext();
              console.log("Using AudioContext for PWA sound playback");
              
              fetch(soundPath)
                .then(response => response.arrayBuffer())
                .then(arrayBuffer => audioContext.decodeAudioData(arrayBuffer))
                .then(audioBuffer => {
                  const source = audioContext.createBufferSource();
                  source.buffer = audioBuffer;
                  source.connect(audioContext.destination);
                  
                  // For orders, loop the sound
                  if (type === 'order') {
                    source.loop = true;
                  }
                  
                  source.start(0);
                  console.log("AudioContext sound started successfully");
                  
                  // Save the audio context for cleanup
                  (window as any).currentAudioContext = audioContext;
                  (window as any).currentAudioSource = source;
                })
                .catch(audioContextErr => {
                  console.error("AudioContext sound playback failed, falling back to HTML Audio:", audioContextErr);
                  tryHTMLAudioPlayback();
                });
              
              return; // Exit if we're using AudioContext
            }
          } catch (err) {
            console.error("Failed to initialize AudioContext:", err);
          }
        }
        
        // Fallback to regular HTML Audio API
        tryHTMLAudioPlayback();
        
        function tryHTMLAudioPlayback() {
          // Strategy 1: Normal play with error handling
          const playPromise = audioRef.current!.play();
          if (playPromise !== undefined) {
            playPromise.catch(err => {
              console.error("Failed to play notification sound:", err);
              
              // Strategy 2: Create a user gesture requirement message
              const message = document.createElement('div');
              message.style.position = 'fixed';
              message.style.bottom = '20px';
              message.style.left = '50%';
              message.style.transform = 'translateX(-50%)';
              message.style.backgroundColor = '#f44336';
              message.style.color = 'white';
              message.style.padding = '10px 20px';
              message.style.borderRadius = '4px';
              message.style.zIndex = '9999';
              message.textContent = 'Click here to enable sound notifications';
              message.style.cursor = 'pointer';
              
              // Play sound on click
              message.onclick = () => {
                if (audioRef.current) {
                  audioRef.current.play().catch(e => console.error("Still couldn't play:", e));
                }
                document.body.removeChild(message);
              };
              
              document.body.appendChild(message);
              
              // Remove after 10 seconds if not clicked
              setTimeout(() => {
                if (document.body.contains(message)) {
                  document.body.removeChild(message);
                }
              }, 10000);
              
              // Also try to use system beep as a fallback
              if ('Notification' in window) {
                try {
                  new Notification("New notification", { silent: false });
                } catch (e) {
                  console.error("Could not use system notification for sound:", e);
                }
              }
            });
          }
        }
      };
      
      // Load the audio first
      audioRef.current.addEventListener('canplaythrough', playSound, { once: true });
      audioRef.current.load();
      
      // Fallback: If canplaythrough doesn't fire within 1 second, try to play anyway
      const fallbackTimer = setTimeout(() => {
        if (audioRef.current) {
          console.log("Canplaythrough event didn't fire, trying fallback play");
          playSound();
        }
      }, 1000);
      
      // Auto-close the notification after the specified time if autoClose is true
      let closeTimeout: NodeJS.Timeout | null = null;
      if (autoClose) {
        closeTimeout = setTimeout(() => {
          onClose();
        }, autoCloseTime);
      }

      // Clean up
      return () => {
        if (fallbackTimer) clearTimeout(fallbackTimer);
        
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.removeEventListener('canplaythrough', playSound);
          audioRef.current = null;
        }
        
        if (audioIntervalRef.current) {
          clearInterval(audioIntervalRef.current);
          audioIntervalRef.current = null;
        }
        
        if (closeTimeout) {
          clearTimeout(closeTimeout);
        }
      };
    } catch (err) {
      console.error("Error setting up alert notification sound:", err);
    }
  }, [type, autoClose, autoCloseTime, onClose, notificationAlreadySeen, title, message, details.id]);

  // Handle Accept action (for orders)
  const handleAccept = async () => {
    setIsProcessing(true);

    // Stop the sound
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    // Only update order status if this is an order type and we have an orderId
    if (type === 'order' && details.orderId) {
      try {
        // Update the order status to "processing"
        const response = await apiRequest(
          'PATCH',
          `/api/orders/${details.orderId}/status`,
          { status: 'processing' }
        );

        if (!response.ok) {
          throw new Error('Failed to update order status');
        }

        // Invalidate orders query to refresh the data
        queryClient.invalidateQueries({ queryKey: ['/api/orders'] });

        // Show success toast
        toast({
          title: "Order Status Updated",
          description: `Order #${details.orderId} is now processing`,
          variant: "default",
        });
        
        // Call the original onAccept callback if provided
        if (onAccept) {
          onAccept();
        }
        
        // Close the notification after successful update
        onClose();
      } catch (error) {
        console.error('Error updating order status:', error);
        toast({
          title: "Failed to Update Order Status",
          description: error instanceof Error ? error.message : 'Unknown error occurred',
          variant: "destructive",
        });
        setIsProcessing(false);
      }
    } else {
      // If not an order or no orderId, just close
      if (onAccept) {
        onAccept();
      }
      onClose();
      setIsProcessing(false);
    }
  };

  // Handle close action
  const handleClose = () => {
    // Stop the sound
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    
    // If this is an order notification, update its status to "new"
    if (type === 'order' && details.orderId) {
      apiRequest(
        'PATCH',
        `/api/orders/${details.orderId}/status`,
        { status: 'new' }
      )
      .then(() => {
        queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      })
      .catch(error => {
        console.error('Error updating order status to "new":', error);
      });
    }
    
    onClose();
  };

  // Get the appropriate icon based on notification type
  const getIcon = () => {
    switch (type) {
      case 'order':
        return <div className="bg-orange-500 p-3 rounded-full text-white"><ShoppingBag className="h-6 w-6" /></div>;
      case 'booking':
        return <div className="bg-green-500 p-3 rounded-full text-white"><Calendar className="h-6 w-6" /></div>;
      case 'function_booking':
        return <div className="bg-blue-500 p-3 rounded-full text-white"><Music className="h-6 w-6" /></div>;
      default:
        return <div className="bg-neutral-500 p-3 rounded-full text-white"><ShoppingBag className="h-6 w-6" /></div>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <Card className="w-full max-w-md p-6 shadow-lg animate-in fade-in zoom-in duration-300">
        <div className="absolute top-2 right-2">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 rounded-full"
            onClick={handleClose}
            disabled={isProcessing}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex items-center mb-4">
          {getIcon()}
          <div className="ml-4 flex-1">
            <h2 className="text-xl font-bold">{title}{orderIdText}</h2>
            <p className="text-gray-600">{message}</p>
          </div>
        </div>

        {/* Display additional details based on notification type */}
        <div className="mt-4 p-3 bg-gray-50 rounded-md">
          {type === 'order' && (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Order ID:</span>
                <span className="text-sm">{details.orderId}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Customer:</span>
                <span className="text-sm">{details.customerName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Amount:</span>
                <span className="text-sm">${details.total}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Status:</span>
                <Badge variant="outline" className="text-xs">
                  {details.status || 'New'}
                </Badge>
              </div>
            </div>
          )}
          
          {(type === 'booking' || type === 'function_booking') && (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Booking ID:</span>
                <span className="text-sm">{details.bookingId}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Customer:</span>
                <span className="text-sm">{details.customerName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Party Size:</span>
                <span className="text-sm">{details.partySize} people</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Time:</span>
                <span className="text-sm">{details.bookingTime ? new Date(details.bookingTime).toLocaleString() : 'Not specified'}</span>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 mt-6">
          {type === 'order' && (
            <Button 
              onClick={handleAccept} 
              className="bg-green-600 hover:bg-green-700 text-white"
              disabled={isProcessing}
            >
              {isProcessing ? 'Processing...' : 'Accept Order'}
            </Button>
          )}
          <Button 
            variant="outline" 
            onClick={handleClose} 
            disabled={isProcessing}
          >
            {type === 'order' ? 'Dismiss' : 'Close'}
          </Button>
        </div>
      </Card>
    </div>
  );
}