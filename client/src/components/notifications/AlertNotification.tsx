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
      const soundPath = '/sounds/alarm_clock.mp3';

      // Create and configure audio element immediately
      audioRef.current = new Audio(soundPath);
      audioRef.current.volume = 1.0;
      audioRef.current.preload = 'auto';

      // Add event listener for when audio is ready to play
      audioRef.current.addEventListener('canplaythrough', () => {
        console.log("Alert sound loaded and ready to play");
        // Play audio after a small delay to ensure browser is ready
        setTimeout(() => {
          if (audioRef.current) {
            const playPromise = audioRef.current.play();
            if (playPromise !== undefined) {
              playPromise.catch(err => {
                console.error("Failed to play alert notification sound:", err);
                // Try playing on user interaction as fallback
                document.addEventListener('click', function playOnInteraction() {
                  if (audioRef.current) audioRef.current.play();
                  document.removeEventListener('click', playOnInteraction);
                }, { once: true });
              });
            }
          }
        }, 100);
      });

      // Load the audio
      audioRef.current.load();
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
        audioRef.current = null;
      }
      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, [autoClose, autoCloseTime, onClose]);

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
  const handleClose = async () => {
    // If this is an order notification and it's in processing status, set it back to "new"
    if (type === 'order' && details.orderId && details.status === 'processing') {
      setIsProcessing(true);
      try {
        // Update the order status to "new"
        const response = await apiRequest(
          'PATCH',
          `/api/orders/${details.orderId}/status`,
          { status: 'new' }
        );

        if (!response.ok) {
          throw new Error('Failed to update order status');
        }

        // Invalidate orders query to refresh the data
        queryClient.invalidateQueries({ queryKey: ['/api/orders'] });

        toast({
          title: "Order Status Updated",
          description: `Order #${details.orderId} has been set to new`,
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
          <Button 
            variant="outline" 
            onClick={handleClose} 
            disabled={isProcessing}
          >
            {isProcessing ? 'Processing...' : type === 'order' ? 'Dismiss' : 'Close'}
          </Button>
        </div>
      </Card>
    </div>
  );
}