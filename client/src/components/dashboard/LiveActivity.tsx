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
  
  // Filter for active activities only
  const activeActivities = activities.filter(activity => 
    activity.status === "active"
  );
  
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
          {activeActivities.map((activity) => (
            <div 
              key={activity.id}
              className="border border-neutral-200 rounded-lg p-4 hover:bg-neutral-50 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start">
                  <ActivityIcon type={activity.activityType} />
                  <div className="ml-4">
                    <h3 className="font-medium text-neutral-900">
                      {activity.activityType.charAt(0).toUpperCase() + activity.activityType.slice(1)}
                    </h3>
                    <p className="text-sm text-neutral-600">
                      {activity.activityType === "call" ? "+" : ""}
                      ID: {activity.activityId}
                    </p>
                    <div className="flex items-center text-xs text-neutral-500 mt-1">
                      <span>Started {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}</span>
                      <span className="mx-2">•</span>
                      <span>{activity.summary.split(" ").slice(0, 3).join(" ")}</span>
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
                    <span className="text-neutral-600">{activity.summary}</span>
                    <span className="px-2 py-1 bg-accent-light text-white text-xs rounded-full animate-pulse">
                      Active
                    </span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter className="justify-center">
        <Button variant="link" className="text-accent hover:text-accent-dark text-sm font-medium">
          View All Activities
        </Button>
      </CardFooter>
    </Card>
  );
}
