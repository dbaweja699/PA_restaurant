import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { type ActivityLog } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { Eye } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

type ActivityIconProps = {
  type: string;
};

function ActivityIcon({ type }: ActivityIconProps) {
  const getIconClass = () => {
    if (!type) {
      return {
        bgColor: "bg-neutral-500",
        icon: "ri-question-line"
      };
    }
    
    switch (type) {
      case "call":
        return {
          bgColor: "bg-primary-light",
          icon: "ri-phone-line"
        };
      case "chat":
        return {
          bgColor: "bg-secondary-light",
          icon: "ri-message-3-line"
        };
      case "order":
        return {
          bgColor: "bg-accent-light",
          icon: "ri-shopping-cart-2-line"
        };
      case "booking":
        return {
          bgColor: "bg-primary-light",
          icon: "ri-calendar-line"
        };
      case "review":
        return {
          bgColor: "bg-secondary-light",
          icon: "ri-star-line"
        };
      default:
        return {
          bgColor: "bg-neutral-500",
          icon: "ri-question-line"
        };
    }
  };

  const { bgColor, icon } = getIconClass();

  return (
    <div className={`${bgColor} p-2 rounded-md text-white`}>
      <i className={`${icon} text-lg`}></i>
    </div>
  );
}

export function LiveActivity() {
  const { data: activities, isLoading } = useQuery<ActivityLog[]>({ 
    queryKey: ['/api/dashboard/activity'],
  });
  
  const [expandedActivity, setExpandedActivity] = useState<number | null>(null);
  
  const toggleExpanded = (id: number) => {
    setExpandedActivity(expandedActivity === id ? null : id);
  };
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium text-neutral-900">
            Active AI Interactions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="w-full h-24" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (!activities || activities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium text-neutral-900">
            Active AI Interactions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-neutral-500 py-8">
            No active interactions at the moment.
          </p>
        </CardContent>
      </Card>
    );
  }
  
  // If we don't have real activity logs, let's generate some from real data
  const { data: calls } = useQuery({ 
    queryKey: ['/api/calls'], 
    enabled: activities?.length === 0 || !activities 
  });
  
  const { data: orders } = useQuery({ 
    queryKey: ['/api/orders'], 
    enabled: activities?.length === 0 || !activities 
  });
  
  const { data: chats } = useQuery({ 
    queryKey: ['/api/chats'], 
    enabled: activities?.length === 0 || !activities 
  });
  
  const { data: bookings } = useQuery({ 
    queryKey: ['/api/bookings'], 
    enabled: activities?.length === 0 || !activities 
  });
  
  // Generate real-time activities from the latest data entries if no activities exist
  const generateActivities = () => {
    const generatedActivities: ActivityLog[] = [];
    
    // Add latest calls
    if (calls && calls.length > 0) {
      const latestCall = calls.sort((a, b) => 
        new Date(b.start_time || b.startTime).getTime() - 
        new Date(a.start_time || a.startTime).getTime()
      )[0];
      
      generatedActivities.push({
        id: 1,
        activityType: "call",
        activityId: latestCall.id?.toString() || "1",
        status: "active",
        timestamp: latestCall.start_time || latestCall.startTime,
        summary: `Phone call from ${latestCall.phone_number || latestCall.phoneNumber}`,
        userId: latestCall.user_id || latestCall.userId
      });
    }
    
    // Add latest chats
    if (chats && chats.length > 0) {
      const latestChat = chats.sort((a, b) => 
        new Date(b.start_time || b.startTime).getTime() - 
        new Date(a.start_time || a.startTime).getTime()
      )[0];
      
      generatedActivities.push({
        id: 2,
        activityType: "chat",
        activityId: latestChat.id?.toString() || "1",
        status: "active",
        timestamp: latestChat.start_time || latestChat.startTime,
        summary: `Chat with ${latestChat.customer_name || latestChat.customerName || "Customer"}`,
        userId: latestChat.user_id || latestChat.userId
      });
    }
    
    // Add latest orders
    if (orders && orders.length > 0) {
      const processingOrders = orders.filter(order => 
        (order.status === "processing" || order.status === "pending")
      );
      
      if (processingOrders.length > 0) {
        const latestOrder = processingOrders.sort((a, b) => 
          new Date(b.order_time || b.orderTime).getTime() - 
          new Date(a.order_time || a.orderTime).getTime()
        )[0];
        
        generatedActivities.push({
          id: 3,
          activityType: "order",
          activityId: latestOrder.id?.toString() || "1",
          status: "active",
          timestamp: latestOrder.order_time || latestOrder.orderTime,
          summary: `Order from ${latestOrder.customer_name || latestOrder.customerName}`,
          userId: latestOrder.user_id || latestOrder.userId
        });
      }
    }
    
    // Add latest bookings for today
    if (bookings && bookings.length > 0) {
      const today = new Date();
      const todayBookings = bookings.filter(booking => {
        const bookingDate = new Date(booking.booking_time || booking.bookingTime);
        return bookingDate.toDateString() === today.toDateString();
      });
      
      if (todayBookings.length > 0) {
        const upcomingBooking = todayBookings.sort((a, b) => 
          new Date(a.booking_time || a.bookingTime).getTime() - 
          new Date(b.booking_time || b.bookingTime).getTime()
        )[0];
        
        generatedActivities.push({
          id: 4,
          activityType: "booking",
          activityId: upcomingBooking.id?.toString() || "1",
          status: "active",
          timestamp: upcomingBooking.booking_time || upcomingBooking.bookingTime,
          summary: `Booking for ${upcomingBooking.customer_name || upcomingBooking.customerName}, party of ${upcomingBooking.party_size || upcomingBooking.partySize}`,
          userId: upcomingBooking.user_id || upcomingBooking.userId
        });
      }
    }
    
    return generatedActivities;
  };
  
  // Use generated activities if no real ones exist
  const activeActivities = activities?.length ? 
    activities.filter(activity => activity.status === "active") : 
    generateActivities();
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-medium text-neutral-900">
          Active AI Interactions
        </CardTitle>
        <span className="text-xs font-medium px-2 py-1 bg-accent-light text-white rounded-full">
          <span className="animate-pulse mr-1">●</span> Live
        </span>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 max-h-96 overflow-y-auto scrollbar-hide">
          {activeActivities.length > 0 ? (
            activeActivities.map((activity) => (
              <div 
                key={activity.id}
                className="border border-neutral-200 rounded-lg p-4 hover:bg-neutral-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start">
                    <ActivityIcon type={activity.activityType} />
                    <div className="ml-4">
                      <h3 className="font-medium text-neutral-900">
                        {activity.activityType && activity.activityType.charAt(0).toUpperCase() + activity.activityType.slice(1) || "Activity"}
                      </h3>
                      <p className="text-sm text-neutral-600">
                        {activity.activityType === "call" ? "+" : ""}
                        ID: {activity.activityId || "N/A"}
                      </p>
                      <div className="flex items-center text-xs text-neutral-500 mt-1">
                        <span>Started {activity.timestamp ? formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true }) : "recently"}</span>
                        <span className="mx-2">•</span>
                        <span>{activity.summary ? activity.summary.split(" ").slice(0, 5).join(" ") + "..." : "No summary available"}</span>
                      </div>
                    </div>
                  </div>
                  <button 
                    className="text-accent hover:text-accent-dark"
                    onClick={() => toggleExpanded(activity.id)}
                  >
                    <Eye size={16} />
                  </button>
                </div>
                
                {expandedActivity === activity.id && (
                  <div className="mt-3 pt-3 border-t border-neutral-100">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-neutral-600">{activity.summary || "No detailed summary available"}</span>
                      <span className="px-2 py-1 bg-accent-light text-white text-xs rounded-full animate-pulse">
                        Active
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ))
          ) : (
            <p className="text-center text-neutral-500 py-8">
              No active interactions at the moment.
            </p>
          )}
        </div>
      </CardContent>
      <CardFooter className="justify-center">
        <Button 
          variant="link" 
          className="text-accent hover:text-accent-dark text-sm font-medium"
          onClick={() => {
            // Force refresh activity data
            refetch();
          }}
        >
          Refresh Activities
        </Button>
      </CardFooter>
    </Card>
  );
}
