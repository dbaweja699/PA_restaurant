import { useState, useEffect } from 'react';
import { ShoppingBag, Calendar, X, Check } from 'lucide-react';
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
  const queryClient = useQueryClient();
  const { toast } = useToast();

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

  // Auto close the notification after a certain time if enabled
  useEffect(() => {
    if (autoClose && !notificationAlreadySeen) {
      const timer = setTimeout(() => {
        onClose();
      }, autoCloseTime);
      
      return () => clearTimeout(timer);
    }
  }, [autoClose, autoCloseTime, onClose, notificationAlreadySeen]);

  // Show a system notification if permission is granted
  useEffect(() => {
    if (!notificationAlreadySeen && 'Notification' in window) {
      if (Notification.permission === "granted") {
        try {
          // Get a base path for icons
          const getBasePath = () => {
            // Check if we're in a production domain
            if (window.location.hostname !== 'localhost' && !window.location.hostname.includes('replit')) {
              return window.location.origin;
            }
            return '';
          };
          
          let basePath = getBasePath();
          let icon = `${basePath}/icons/icon-192x192.png`;
          let typeText = type === 'order' ? 'Order' : type === 'booking' ? 'Booking' : 'Function Booking';
          
          const notification = new Notification(`New ${typeText}: ${title}`, {
            body: message,
            icon: icon,
            tag: `restaurant-notification-${type}-${details.id || Date.now()}`,
            silent: false
          });
          
          notification.onclick = () => {
            window.focus();
            notification.close();
          };
        } catch (error) {
          console.error("Error showing system notification:", error);
        }
      } else if (Notification.permission !== "denied") {
        Notification.requestPermission();
      }
    }
  }, [type, title, message, details.id, notificationAlreadySeen]);

  // Save notification ID as processed to localStorage
  const markNotificationAsSeen = () => {
    if (details.id) {
      try {
        const seenNotifications = localStorage.getItem('processedNotificationIds');
        let ids = seenNotifications ? JSON.parse(seenNotifications) : [];
        
        if (!ids.includes(details.id)) {
          ids.push(details.id);
          localStorage.setItem('processedNotificationIds', JSON.stringify(ids));
        }
        
        setNotificationAlreadySeen(true);
      } catch (e) {
        console.error("Error marking notification as seen:", e);
      }
    }
  };

  // Handle accepting an order
  const handleAccept = async () => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    markNotificationAsSeen();
    
    try {
      if (type === 'order' && details.id) {
        // Update order status to processing
        await apiRequest(`/api/orders/${details.id}/status`, 'PATCH', { 
          status: 'processing' 
        });
        
        // Invalidate queries to refresh data
        queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
        
        // Mark notification as read
        if (details.notificationId) {
          await apiRequest(`/api/notifications/${details.notificationId}/read`, 'PATCH');
          queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
          queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread'] });
        }
      }
      
      // Call onAccept callback if provided
      if (onAccept) {
        onAccept();
      }
      
      // Close the notification
      onClose();
      
      // Show success toast
      toast({
        title: "Order accepted",
        description: `Order ${details.orderId || ''} has been accepted and marked as processing.`,
        variant: "default",
      });
    } catch (error) {
      console.error("Error accepting order:", error);
      setIsProcessing(false);
      
      // Show error toast
      toast({
        title: "Error accepting order",
        description: "There was a problem accepting the order. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle dismissing a notification without accepting
  const handleDismiss = async () => {
    if (isProcessing) return;
    
    markNotificationAsSeen();
    
    // Mark notification as read if it has an ID
    if (details.notificationId) {
      try {
        await apiRequest(`/api/notifications/${details.notificationId}/read`, 'PATCH');
        queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
        queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread'] });
      } catch (error) {
        console.error("Error marking notification as read:", error);
      }
    }
    
    // Close the notification
    onClose();
  };

  // Get the appropriate icon based on notification type
  const getIcon = () => {
    switch (type) {
      case 'order':
        return <div className="bg-red-500 p-3 rounded-full text-white"><ShoppingBag className="h-6 w-6" /></div>;
      case 'booking':
        return <div className="bg-blue-500 p-3 rounded-full text-white"><Calendar className="h-6 w-6" /></div>;
      case 'function_booking':
        return <div className="bg-green-500 p-3 rounded-full text-white"><Calendar className="h-6 w-6" /></div>;
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
            onClick={handleDismiss}
            disabled={isProcessing}
          >
            {type === 'order' ? 'Dismiss' : 'Close'}
          </Button>
        </div>
      </Card>
    </div>
  );
  
  // Helper function to close the notification
  function handleClose() {
    if (type === 'order') {
      handleDismiss();
    } else {
      onClose();
    }
  }
}