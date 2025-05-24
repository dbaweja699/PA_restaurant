import { useState, useEffect, useRef } from 'react';
import { Bell, BellDot, X, Check, Volume2, VolumeX } from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { getQueryFn, apiRequest, queryClient } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { AlertNotification } from '@/components/notifications/AlertNotification';

// Define the Notification type here to avoid importing from server code
type Notification = {
  id: number;
  type: string;
  message: string;
  details: any;
  isRead: boolean;
  createdAt: Date;
  userId: number | null;
};

// Helper function to format time
function timeAgo(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  return `${Math.floor(diffInSeconds / 86400)}d ago`;
}

function NotificationCard({ notification, onMarkAsRead }: { 
  notification: Notification, 
  onMarkAsRead: (id: number) => void 
}) {
  // Map notification types to icons and colors
  const typeConfig: Record<string, { bgColor: string, icon: React.ReactNode }> = {
    call: { 
      bgColor: 'bg-blue-100', 
      icon: <div className="bg-blue-500 p-2 rounded-full text-white">📞</div>
    },
    booking: { 
      bgColor: 'bg-green-100', 
      icon: <div className="bg-green-500 p-2 rounded-full text-white">📅</div>
    },
    review: { 
      bgColor: 'bg-yellow-100', 
      icon: <div className="bg-yellow-500 p-2 rounded-full text-white">⭐</div>
    },
    order: { 
      bgColor: 'bg-orange-100', 
      icon: <div className="bg-orange-500 p-2 rounded-full text-white">🛒</div>
    },
    conversation: { 
      bgColor: 'bg-slate-100', 
      icon: <div className="bg-slate-600 p-2 rounded-full text-white">💬</div>
    },
    chat: { 
      bgColor: 'bg-slate-100', 
      icon: <div className="bg-slate-600 p-2 rounded-full text-white">💬</div>
    },
    default: { 
      bgColor: 'bg-gray-100', 
      icon: <div className="bg-gray-500 p-2 rounded-full text-white">🔔</div>
    }
  };
  
  const config = typeConfig[notification.type] || typeConfig.default;
  
  return (
    <Card className={cn(
      "mb-2 p-3 relative", 
      config.bgColor,
      !notification.isRead && "border-l-4 border-l-primary"
    )}>
      <div className="flex items-start">
        <div className="mr-3 mt-1">{config.icon}</div>
        <div className="flex-grow">
          <p className="font-medium">{notification.message}</p>
          <div className="flex justify-between items-center mt-2">
            <p className="text-xs text-muted-foreground">
              {timeAgo(new Date(notification.createdAt))}
            </p>
            {!notification.isRead && (
              <Button 
                size="sm" 
                variant="ghost" 
                className="h-6 px-2"
                onClick={() => onMarkAsRead(notification.id)}
              >
                <Check className="h-3 w-3 mr-1" />
                <span className="text-xs">Mark read</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

export function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [lastNotificationCount, setLastNotificationCount] = useState(0);
  const notificationSound = useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();
  
  // Audio sounds for different notification types
  const notificationSounds = useRef<Record<string, HTMLAudioElement | null>>({
    default: null,
    order: null,
    booking: null,
    function_booking: null,
  });
  
  useEffect(() => {
    // Create audio elements for different notification sounds
    // Using alarm_clock.mp3 for all notification types
    const alarmSound = '/sounds/alarm_clock.mp3';
    // Create audio elements with preload attribute
    const createAudio = (src: string) => {
      const audio = new Audio(src);
      audio.preload = 'auto';
      return audio;
    };
    
    notificationSounds.current.default = createAudio(alarmSound);
    notificationSounds.current.order = createAudio(alarmSound);
    notificationSounds.current.booking = createAudio(alarmSound);
    notificationSounds.current.function_booking = createAudio(alarmSound);
    
    // Try to preload all sounds
    Object.values(notificationSounds.current).forEach(sound => {
      if (sound) {
        sound.load();
      }
    });
    
    // Fallback sounds if the files don't exist
    const fallbackBase64 = 'data:audio/mp3;base64,SUQzAwAAAAABOlRJVDIAAAAZAAAAbm90aWZpY2F0aW9uLXNvdW5kLm1wMwBUWVhYAAAADwAAAHVzZXIAAHgAYQBtAHAAVEVOQwAAAA8AAABpAFQAdQBuAGUAcwAgADEAMgAuADkALgAwAC4AMQAwADMAVENPTgAAAA8AAABTA09VTkQgRUZGRUNUAAA=';
    
    // Set error handlers for all sounds
    Object.keys(notificationSounds.current).forEach(key => {
      const sound = notificationSounds.current[key];
      if (sound) {
        sound.onerror = () => {
          notificationSounds.current[key] = new Audio(fallbackBase64);
        };
      }
    });
    
    // Reference for easy access in other methods
    notificationSound.current = notificationSounds.current.default;
    
    return () => {
      // Clean up all audio elements
      Object.keys(notificationSounds.current).forEach(key => {
        notificationSounds.current[key] = null;
      });
      notificationSound.current = null;
    };
  }, []);
  
  // Fetch all notifications
  const { data: notifications = [], refetch } = useQuery<Notification[]>({
    queryKey: ['/api/notifications'],
    queryFn: getQueryFn({ on401: 'returnNull' }),
    refetchInterval: 15000, // Refetch every 15 seconds
  });
  
  // Fetch unread notifications count
  const { data: unreadNotifications = [] } = useQuery<Notification[]>({
    queryKey: ['/api/notifications/unread'],
    queryFn: getQueryFn({ on401: 'returnNull' }),
    refetchInterval: 8000, // Refetch more frequently - every 8 seconds
  });
  
  // Function to play the alarm clock notification sound for all notification types
  const playNotificationSound = (type: string) => {
    if (!soundEnabled) return;
    
    // Use the alarm clock sound for all notification types
    let soundToPlay = notificationSounds.current.default;
    
    if (type === 'order' && notificationSounds.current.order) {
      soundToPlay = notificationSounds.current.order;
    } else if (type === 'booking' && notificationSounds.current.booking) {
      soundToPlay = notificationSounds.current.booking;
    } else if (type === 'function_booking' && notificationSounds.current.function_booking) {
      soundToPlay = notificationSounds.current.function_booking;
    }
    
    // Play the selected sound
    if (soundToPlay) {
      // Make sure the audio is loaded before playing
      soundToPlay.load();
      // Add a small delay to ensure the audio is loaded
      setTimeout(() => {
        soundToPlay.play().catch(err => {
          console.error(`Failed to play ${type} notification sound:`, err);
        });
      }, 100);
    }
  };
  
  // State for alert notification
  const [showAlertNotification, setShowAlertNotification] = useState(false);
  const [alertNotification, setAlertNotification] = useState<Notification | null>(null);
  
  // Check for new notifications and play sound
  useEffect(() => {
    const currentCount = unreadNotifications.length;
    
    // Check if we have new notifications since last check
    if (currentCount > 0) {
      // Get the newest notification (first one in the list)
      const newestNotification = unreadNotifications[0];
      
      // Check if this is a new notification we haven't processed yet
      const isNewNotification = newestNotification && 
        (!alertNotification || newestNotification.id !== alertNotification.id);
      
      if (isNewNotification) {
        console.log("New notification detected:", newestNotification.type, newestNotification.message);
        
        // For orders or call type notifications about orders, show the alert notification
        if (newestNotification.type === 'order' || 
           (newestNotification.type === 'call' && newestNotification.message.toLowerCase().includes('order'))) {
          setAlertNotification(newestNotification);
          setShowAlertNotification(true);
          // Play order notification sound
          playNotificationSound('order');
        } 
        // For bookings and function_bookings, show the temporary alert notification
        else if (newestNotification.type === 'booking' || newestNotification.type === 'function_booking') {
          setAlertNotification(newestNotification);
          setShowAlertNotification(true);
          // Play booking notification sound
          playNotificationSound(newestNotification.type);
        }
        // For other notification types, show toast
        else {
          toast({
            title: `New ${newestNotification.type.charAt(0).toUpperCase() + newestNotification.type.slice(1)}`,
            description: newestNotification.message,
            variant: "default",
          });
          
          // Play appropriate sound based on notification type
          playNotificationSound(newestNotification.type);
        }
      }
    }
    
    // Update the last count
    setLastNotificationCount(currentCount);
  }, [unreadNotifications]);
  
  // Mark a notification as read
  const markAsReadMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest(
        'PATCH',
        `/api/notifications/${id}/read`,
        {}
      );
      return response.json();
    },
    onSuccess: () => {
      // Invalidate both notifications queries
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to mark notification as read",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Mark all notifications as read
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest(
        'POST',
        '/api/notifications/read-all',
        {}
      );
      return response.json();
    },
    onSuccess: () => {
      // Invalidate both notifications queries
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread'] });
      toast({
        title: "All notifications marked as read",
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to mark all notifications as read",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  const handleMarkAsRead = (id: number) => {
    markAsReadMutation.mutate(id);
  };
  
  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };
  
  return (
    <>
      {/* Alert Notification for orders and bookings */}
      {showAlertNotification && alertNotification && (
        <AlertNotification 
          type={alertNotification.type as 'order' | 'booking' | 'function_booking'} 
          title={alertNotification.type === 'order' 
            ? 'New Order Received!' 
            : alertNotification.type === 'booking' 
              ? 'New Booking Received!' 
              : 'New Function Booking Received!'
          }
          message={alertNotification.message}
          onAccept={alertNotification.type === 'order' ? () => {
            // Mark as read
            if (alertNotification) {
              markAsReadMutation.mutate(alertNotification.id);
            }
          } : undefined}
          onClose={() => {
            setShowAlertNotification(false);
            // Don't automatically mark bookings as read when dismissed
            if (alertNotification.type === 'order') {
              markAsReadMutation.mutate(alertNotification.id);
            }
          }}
          autoClose={alertNotification.type !== 'order'} // Auto close for bookings, not for orders
          autoCloseTime={5000} // 5 seconds
        />
      )}
      
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="relative text-white">
            {unreadNotifications.length > 0 ? (
              <>
                <BellDot className="h-5 w-5 text-white" />
                <Badge className="absolute -top-2 -right-1 h-5 min-w-[1.25rem] px-1 bg-white text-black">
                  {unreadNotifications.length}
                </Badge>
              </>
            ) : (
              <Bell className="h-5 w-5 text-white" />
            )}
          </Button>
        </PopoverTrigger>
      <PopoverContent 
        className="w-80 p-0" 
        align="end"
        onInteractOutside={() => setOpen(false)}
      >
        <div className="flex justify-between items-center p-4 border-b">
          <div className="font-semibold">Notifications</div>
          <div className="flex gap-2">
            <Button 
              variant="ghost" 
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? "Mute notification sounds" : "Enable notification sounds"}
            >
              {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </Button>
            {unreadNotifications.length > 0 && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={handleMarkAllAsRead}
                disabled={markAllAsReadMutation.isPending}
              >
                Mark all read
              </Button>
            )}
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 w-8 p-0" 
              onClick={() => setOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <ScrollArea className="h-[calc(80vh-8rem)] max-h-[400px]">
          <div className="p-4">
            {notifications.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                No notifications yet
              </div>
            ) : (
              notifications.map((notification) => (
                <NotificationCard 
                  key={notification.id} 
                  notification={notification} 
                  onMarkAsRead={handleMarkAsRead}
                />
              ))
            )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  </>
  );
}