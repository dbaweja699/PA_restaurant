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
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Order ID text for display
  const orderIdText = type === 'order' && details.orderId ? ` #${details.orderId}` : '';

  // Play alert notification sound when component mounts
  useEffect(() => {
    // Try to play the notification sound
    try {
      // Create an embedded audio element that's visible in the DOM
      // This helps bypass some browser autoplay restrictions
      const audioElement = new Audio();
      audioElement.src = '/sounds/alarm_clock.mp3';
      audioElement.id = 'alert-notification-sound';
      audioElement.volume = 1.0;
      audioElement.preload = 'auto';
      audioElement.loop = false;
      audioElement.muted = false;

      // Force the browser to load the audio file
      fetch('/sounds/alarm_clock.mp3')
        .then(response => {
          if (!response.ok) {
            throw new Error('Sound file not found');
          }
          console.log('Alert sound file confirmed available');
          return response.blob();
        })
        .then(blob => {
          // Create a direct object URL from the blob for more reliable playback
          const objectUrl = URL.createObjectURL(blob);
          audioElement.src = objectUrl;

          // Store reference with the object URL for cleanup
          audioRef.current = audioElement;
          document.body.appendChild(audioElement);

          console.log("Alert sound element created with direct blob URL");

          // Play using multiple strategies
          const playStrategies = () => {
            console.log("Attempting to play notification sound with multiple strategies");

            // Strategy 1: Direct play
            const playPromise = audioElement.play();

            if (playPromise !== undefined) {
              playPromise.then(() => {
                console.log("Alert sound playing successfully");
              }).catch(err => {
                console.error("Strategy 1 failed to play alert sound:", err);

                // Strategy 2: Play via user interaction simulation
                // Use a click event to trigger playback
                const simulateUserInteraction = () => {
                  console.log("Trying strategy 2: User interaction simulation");

                  // Add an inline play button that auto-clicks itself
                  const tempButton = document.createElement('button');
                  tempButton.textContent = 'Play Sound';
                  tempButton.style.position = 'absolute';
                  tempButton.style.left = '-9999px';

                  tempButton.onclick = () => {
                    const newPlayPromise = audioElement.play();
                    if (newPlayPromise) {
                      newPlayPromise.catch(e => {
                        console.error("Strategy 2 failed:", e);
                        // Strategy 3: Fall back to beep only as last resort
                        playCustomAlarmBeep();
                      });
                    }
                    document.body.removeChild(tempButton);
                  };

                  document.body.appendChild(tempButton);
                  setTimeout(() => tempButton.click(), 50);
                };

                simulateUserInteraction();
              });
            }
          };

          // Create a pattern of beeps that mimics the alarm_clock.mp3 file
          const playCustomAlarmBeep = () => {
            console.log("Playing custom alarm beep pattern");
            try {
              // Create audio context
              const audioContext = new (window.AudioContext || window.webkitAudioContext)();
              const gainNode = audioContext.createGain();
              gainNode.gain.value = 0.5; // Set volume to 50%
              gainNode.connect(audioContext.destination);

              // Create a pattern of beeps that mimics our alarm_clock.mp3
              const beepPattern = [
                { frequency: 880, duration: 200, gap: 100 },
                { frequency: 880, duration: 200, gap: 100 },
                { frequency: 1046, duration: 300, gap: 0 }
              ];

              // Play the pattern
              let startTime = audioContext.currentTime;

              beepPattern.forEach(beep => {
                // Create oscillator for this beep
                const oscillator = audioContext.createOscillator();
                oscillator.type = 'sine';
                oscillator.frequency.value = beep.frequency;

                // Connect to gain node
                oscillator.connect(gainNode);

                // Schedule start and stop times
                oscillator.start(startTime);
                oscillator.stop(startTime + beep.duration / 1000);

                // Update the start time for the next beep
                startTime += (beep.duration + beep.gap) / 1000;
              });

              console.log("Alarm beep pattern scheduled successfully");
              return true;
            } catch (err) {
              console.error("Failed to play custom alarm beep:", err);
              return false;
            }
          };

          // Try playing after a short delay
          setTimeout(playStrategies, 200);

          // Also try to play on first click anywhere
          document.addEventListener('click', function playOnFirstClick() {
            audioElement.play().catch(e => console.log("Click-triggered play failed:", e));
            document.removeEventListener('click', playOnFirstClick);
          }, { once: true });
        })
        .catch(err => {
          console.error('Error loading sound file:', err);
          // Fall back to inline audio data if file fetch fails
          const base64Sound = 'data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAASAAAeMwAUFBQUFCgUFBQUFDMzMzMzM0dHR0dHR1paWlpaWm5ubm5ubm5HR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0c=';

          // Create a fallback audio element with the base64 data
          const fallbackAudio = new Audio(base64Sound);
          audioRef.current = fallbackAudio;
          fallbackAudio.volume = 1.0;
          fallbackAudio.play().catch(e => {
            console.error("Base64 fallback failed:", e);
            // Use beep as absolute last resort
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            oscillator.type = 'sine';
            oscillator.frequency.value = 800;
            oscillator.connect(audioContext.destination);
            oscillator.start();
            setTimeout(() => oscillator.stop(), 300);
          });
        });
    } catch (err) {
      console.error("Error setting up alert notification sound:", err);
    }

    // Auto-close the notification after the specified time if autoClose is true
    let timeout: NodeJS.Timeout | null = null;
    if (autoClose) {
      timeout = setTimeout(() => {
        onClose();
      }, autoCloseTime);
    }

    // Clean up
    return () => {
      if (audioRef.current) {
        // Stop any playback
        audioRef.current.pause();

        // Reset to beginning
        try {
          audioRef.current.currentTime = 0;
        } catch (e) {
          console.log("Error resetting audio time:", e);
        }

        // Release any media streams
        if (audioRef.current.srcObject) {
          audioRef.current.srcObject = null;
        }

        // Release any object URLs to prevent memory leaks
        if (audioRef.current.src && audioRef.current.src.startsWith('blob:')) {
          URL.revokeObjectURL(audioRef.current.src);
        }

        // Remove from DOM if it was added
        if (audioRef.current.parentNode) {
          audioRef.current.parentNode.removeChild(audioRef.current);
        }

        audioRef.current = null;
      }

      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, [autoClose, autoCloseTime, onClose]);

  // Attempt to play sound again when the alert becomes visible
  useEffect(() => {
    // This second effect helps ensure the sound plays even if browser needs user interaction first
    const playAfterDelay = setTimeout(() => {
      console.log("Second attempt to play notification sound");

      // Try beep pattern first (most reliable method)
      if (!playCustomAlarmBeep() && audioRef.current) {
        // Only try MP3 if beep failed
        audioRef.current.play().catch(err => {
          console.log("Second play attempt failed:", err);
          // Try one more beep as last resort
          playCustomAlarmBeep();
        });
      }
    }, 800);

    return () => clearTimeout(playAfterDelay);
  }, []);

  // This component renders a full-screen notification, so ensure the UI is accessible
  useEffect(() => {
    // Set focus trap for accessibility
    const prevFocusedElement = document.activeElement as HTMLElement;

    // Return focus when component unmounts
    return () => {
      if (prevFocusedElement && 'focus' in prevFocusedElement) {
        try {
          prevFocusedElement.focus();
        } catch (e) {
          console.log("Error returning focus:", e);
        }
      }
    };
  }, []);

  // Handle Accept action (for orders)
  const handleAccept = async () => {
    setIsProcessing(true);

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

        toast({
          title: "Order Status Updated",
          description: `Order #${details.orderId} is now processing`,
          variant: "default",
        });
      } catch (error) {
        console.error('Error updating order status:', error);
        toast({
          title: "Failed to Update Order Status",
          description: error instanceof Error ? error.message : 'Unknown error occurred',
          variant: "destructive",
        });
      } finally {
        setIsProcessing(false);
      }
    }

    // Call the original onAccept callback
    if (onAccept) {
      onAccept();
    }

    onClose();
  };

  // Handle close action
  const handleClose = () => {
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
        <div className="flex items-center mb-4">
          {getIcon()}
          <div className="ml-4 flex-1">
            <h2 className="text-xl font-bold">{title}{orderIdText}</h2>
            <p className="text-gray-600">{message}</p>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          {type === 'order' && (
            <Button 
              onClick={handleAccept} 
              className="bg-green-600 hover:bg-green-700"
              disabled={isProcessing}
            >
              {isProcessing ? 'Processing...' : 'Accept Order'}
            </Button>
          )}
          <Button variant="outline" onClick={handleClose} disabled={isProcessing}>
            {type === 'order' ? 'Dismiss' : 'Close'}
          </Button>
        </div>
      </Card>
    </div>
  );
}