
import { useState, useEffect } from 'react';
import { X, Bell, Calendar, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface AlertNotificationProps {
  type: 'order' | 'booking' | 'function_booking';
  title: string;
  message: string;
  onAccept?: () => void;
  onClose: () => void;
  autoClose?: boolean;
  autoCloseTime?: number;
  details?: any; // Order details if available
}

export function AlertNotification({
  type,
  title,
  message,
  onAccept,
  onClose,
  autoClose = false,
  autoCloseTime = 5000,
  details
}: AlertNotificationProps) {
  const [audio] = useState(() => {
    const audioElement = new Audio('/sounds/alarm_clock.mp3');
    // Set preload attribute to ensure the audio file is loaded before attempting to play
    audioElement.preload = 'auto';
    return audioElement;
  });
  const [isVisible, setIsVisible] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  // Status update mutation for orders
  const updateOrderStatusMutation = useMutation({
    mutationFn: async (orderId: number) => {
      setIsProcessing(true);
      const response = await apiRequest("PATCH", `/api/orders/${orderId}`, { 
        status: "processing" 
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update order status");
      }

      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Order Accepted",
        description: "The order status has been changed to processing.",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      handleClose();
    },
    onError: (error) => {
      setIsProcessing(false);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update status",
        variant: "destructive",
      });
    }
  });

  useEffect(() => {
    // Play the sound when the notification appears
    const playSound = () => {
      try {
        // Check if the audio file exists first
        fetch('/sounds/alarm_clock.mp3', { method: 'HEAD' })
          .then(() => {
            // Reset the audio to ensure it plays from the start
            audio.pause();
            audio.currentTime = 0;
            
            // Configure audio
            audio.volume = 1.0;
            audio.loop = type === 'order'; // Loop only for orders that require acceptance
            
            // Ensure audio is loaded before attempting to play
            audio.load();
            
            // Play with a small delay to ensure DOM is ready
            setTimeout(() => {
              console.log('Attempting to play notification sound');
              const playPromise = audio.play();
              
              if (playPromise !== undefined) {
                playPromise.catch(err => {
                  console.error(`Failed to play alert notification sound:`, err);
                  // Try again with user interaction requirement workaround
                  document.addEventListener('click', function playOnClick() {
                    audio.play().catch(e => console.warn('Still unable to play audio:', e));
                    document.removeEventListener('click', playOnClick);
                  }, { once: true });
                });
              }
            }, 300);
          })
          .catch(err => {
            console.error('Audio file not found:', err);
          });
        
        console.log(`Playing alert sound for ${type} notification`);
      } catch (err) {
        console.error('Error setting up audio:', err);
      }
    };
    
    // Call the function to play sound
    playSound();

    // Auto-close for bookings after specified time
    let timeoutId: NodeJS.Timeout | null = null;
    
    if (autoClose) {
      timeoutId = setTimeout(() => {
        handleClose();
      }, autoCloseTime);
    }

    return () => {
      // Clean up
      audio.pause();
      audio.currentTime = 0;
      
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    audio.pause();
    audio.currentTime = 0;
    onClose();
  };

  const handleAccept = () => {
    if (type === 'order' && details?.orderId) {
      console.log("Accepting order and updating status to processing:", details.orderId);
      // Update order status to "processing"
      updateOrderStatusMutation.mutate(details.orderId);
    } else if (onAccept) {
      onAccept();
      handleClose();
    } else {
      handleClose();
    }
  };

  if (!isVisible) return null;

  const getIcon = () => {
    switch (type) {
      case 'order':
        return <ShoppingCart className="h-10 w-10 text-orange-500" />;
      case 'booking':
      case 'function_booking':
        return <Calendar className="h-10 w-10 text-green-500" />;
      default:
        return <Bell className="h-10 w-10 text-primary" />;
    }
  };

  // Extract order number for display
  const orderIdText = type === 'order' && details?.orderId ? ` #${details.orderId}` : '';

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
