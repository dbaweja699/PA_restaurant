import { QuickStats } from "@/components/dashboard/QuickStats";
import { ActivityChart } from "@/components/dashboard/ActivityChart";
import { LiveActivity } from "@/components/dashboard/LiveActivity";
import { PerformanceMetrics } from "@/components/dashboard/PerformanceMetrics";
import { RecentReviews } from "@/components/dashboard/RecentReviews";
import { UpcomingBookings } from "@/components/dashboard/UpcomingBookings";
import { InventoryStatsCard } from "@/components/inventory/InventoryStatsCard";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect } from "react";

export default function Dashboard() {
  // Force refresh dashboard data on load
  const { refetch: refetchStats } = useQuery({ 
    queryKey: ['/api/dashboard/stats'],
    refetchOnMount: true
  });
  
  const { refetch: refetchPerformance } = useQuery({ 
    queryKey: ['/api/dashboard/performance'],
    refetchOnMount: true
  });
  
  const { refetch: refetchActivity } = useQuery({ 
    queryKey: ['/api/dashboard/activity'],
    refetchOnMount: true 
  });
  
  useEffect(() => {
    // Refresh all dashboard data on component mount
    refetchStats();
    refetchPerformance();
    refetchActivity();
  }, [refetchStats, refetchPerformance, refetchActivity]);

  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-display font-bold text-neutral-900">Dashboard</h1>
          <p className="mt-1 text-sm text-neutral-600">Overview of your Restaurant AI Assistant</p>
        </div>
      </div>
      
      <QuickStats />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          <ActivityChart />
          <LiveActivity />
        </div>
        
        {/* Right Column */}
        <div className="space-y-6">
          <PerformanceMetrics />
          <InventoryStatsCard />
          <RecentReviews />
          <UpcomingBookings />
        </div>
      </div>
    </div>
  );
}
