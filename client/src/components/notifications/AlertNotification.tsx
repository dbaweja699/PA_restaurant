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
      // Create an audio element directly in the component for better browser support
      const audioElement = document.createElement('audio');
      audioElement.src = '/sounds/alarm_clock.mp3';
      audioElement.id = 'alert-notification-sound';
      audioElement.volume = 1.0;
      audioElement.preload = 'auto';
      document.body.appendChild(audioElement);
      
      // Store reference for cleanup
      audioRef.current = audioElement;
      
      console.log("Alert sound element created");
      
      // Force immediate play attempt after a small delay
      setTimeout(() => {
        console.log("Attempting to play notification sound now");
        
        // Play the sound with user interaction context
        const playSound = () => {
          if (audioRef.current) {
            // Play it twice to ensure it works (browser quirk workaround)
            const promise = audioRef.current.play();
            
            if (promise !== undefined) {
              promise.then(() => {
                console.log("Alert sound playing successfully");
              }).catch(err => {
                console.error("Failed to play alert sound:", err);
                
                // Create and play a very short beep as fallback
                try {
                  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                  const oscillator = audioContext.createOscillator();
                  oscillator.type = 'sine';
                  oscillator.frequency.value = 800;
                  oscillator.connect(audioContext.destination);
                  oscillator.start();
                  setTimeout(() => oscillator.stop(), 200);
                  console.log("Played fallback beep sound");
                } catch (err) {
                  console.error("Even fallback sound failed:", err);
                }
              });
            }
          }
        };
        
        // Try to play immediately
        playSound();
        
        // Also add a click handler to ensure it works on first user interaction
        document.addEventListener('click', function playOnFirstClick() {
          playSound();
          document.removeEventListener('click', playOnFirstClick);
        }, { once: true });
        
      }, 300);
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
        audioRef.current.pause();
        // Remove the element from DOM if it was added
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
      if (audioRef.current) {
        console.log("Second attempt to play notification sound");
        audioRef.current.play().catch(err => {
          console.log("Second play attempt failed:", err);
        });
      }
    }, 800);
    
    return () => clearTimeout(playAfterDelay);
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