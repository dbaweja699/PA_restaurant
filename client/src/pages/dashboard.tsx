import { QuickStats } from "@/components/dashboard/QuickStats";
import { ActivityChart } from "@/components/dashboard/ActivityChart";
import { LiveActivity } from "@/components/dashboard/LiveActivity";
import { PerformanceMetrics } from "@/components/dashboard/PerformanceMetrics";
import { RecentReviews } from "@/components/dashboard/RecentReviews";
import { UpcomingBookings } from "@/components/dashboard/UpcomingBookings";

export default function Dashboard() {
  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-display font-bold text-neutral-900">Dashboard</h1>
        <p className="mt-1 text-sm text-neutral-600">Overview of your Dblytics Restaurant AI Assistant</p>
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
          <RecentReviews />
          <UpcomingBookings />
        </div>
      </div>
    </div>
  );
}
