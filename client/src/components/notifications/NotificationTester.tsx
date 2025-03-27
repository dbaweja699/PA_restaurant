import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export function NotificationTester() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Create a mutation to add a notification
  const createNotificationMutation = useMutation({
    mutationFn: async () => {
      setIsLoading(true);
      try {
        const response = await apiRequest(
          'POST',
          '/api/ai-agent/notify',
          {
            type: 'call',
            message: 'Test notification - AI Assistant answered a call',
            details: {
              phoneNumber: '+1-555-123-4567',
              topic: 'Reservation inquiry',
              duration: 2.5,
              startTime: new Date().toISOString()
            }
          }
        );
        return response.json();
      } finally {
        setIsLoading(false);
      }
    },
    onSuccess: () => {
      toast({
        title: 'Test notification created',
        description: 'A test notification has been added to your notifications',
        variant: 'default',
      });
      // Invalidate notifications queries to refresh the list
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to create test notification',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  const handleCreateTestNotification = () => {
    createNotificationMutation.mutate();
  };

  return (
    <Button 
      onClick={handleCreateTestNotification} 
      disabled={isLoading} 
      size="sm"
      variant="outline"
    >
      {isLoading ? 'Creating...' : 'Create Test Notification'}
    </Button>
  );
}