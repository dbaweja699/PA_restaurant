
import { useState, useEffect } from 'react';
import { X, Bell, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface AlertNotificationProps {
  type: 'order' | 'booking' | 'function_booking';
  title: string;
  message: string;
  onAccept?: () => void;
  onClose: () => void;
  autoClose?: boolean;
  autoCloseTime?: number;
}

export function AlertNotification({
  type,
  title,
  message,
  onAccept,
  onClose,
  autoClose = false,
  autoCloseTime = 5000
}: AlertNotificationProps) {
  const [audio] = useState(new Audio('/sounds/alarm_clock.mp3'));
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Play the sound when the notification appears
    try {
      audio.volume = 1.0;
      audio.loop = type === 'order'; // Loop only for orders that require acceptance
      audio.play().catch(err => {
        console.error(`Failed to play alert notification sound:`, err);
      });
    } catch (err) {
      console.error('Error setting up audio:', err);
    }

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
    if (onAccept) {
      onAccept();
    }
    handleClose();
  };

  if (!isVisible) return null;

  const getIcon = () => {
    switch (type) {
      case 'order':
        return <Bell className="h-10 w-10 text-orange-500" />;
      case 'booking':
      case 'function_booking':
        return <Calendar className="h-10 w-10 text-green-500" />;
      default:
        return <Bell className="h-10 w-10 text-primary" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <Card className="w-full max-w-md p-6 shadow-lg animate-in fade-in zoom-in duration-300">
        <div className="flex items-center mb-4">
          {getIcon()}
          <div className="ml-4 flex-1">
            <h2 className="text-xl font-bold">{title}</h2>
            <p className="text-gray-600">{message}</p>
          </div>
        </div>
        
        <div className="flex justify-end gap-2 mt-6">
          {type === 'order' && onAccept && (
            <Button onClick={handleAccept} className="bg-green-600 hover:bg-green-700">
              Accept Order
            </Button>
          )}
          <Button variant="outline" onClick={handleClose}>
            {type === 'order' ? 'Dismiss' : 'Close'}
          </Button>
        </div>
      </Card>
    </div>
  );
}
