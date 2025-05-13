import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { format, subDays, startOfWeek, startOfMonth, addDays, addMonths } from "date-fns";

type TimeRange = "Day" | "Week" | "Month";
type ActivityDataPoint = {
  time: string;
  interactions: number;
  isPeak?: boolean;
};

export function ActivityChart() {
  const [timeRange, setTimeRange] = useState<TimeRange>("Day");
  const [chartData, setChartData] = useState<ActivityDataPoint[]>([]);
  
  // Fetch raw data
  const { data: calls, isLoading: isLoadingCalls } = useQuery({ 
    queryKey: ['/api/calls'],
  });
  
  const { data: chats, isLoading: isLoadingChats } = useQuery({ 
    queryKey: ['/api/chats'],
  });
  
  const { data: orders, isLoading: isLoadingOrders } = useQuery({ 
    queryKey: ['/api/orders'],
  });
  
  const { data: bookings, isLoading: isLoadingBookings } = useQuery({ 
    queryKey: ['/api/bookings'],
  });
  
  const isLoading = isLoadingCalls || isLoadingChats || isLoadingOrders || isLoadingBookings;
  
  useEffect(() => {
    if (isLoading) return;
    
    // Process data based on timeRange
    const processData = () => {
      const allData = [
        ...(calls || []).map(call => ({ 
          type: 'call', 
          time: call.start_time || call.startTime
        })),
        ...(chats || []).map(chat => ({ 
          type: 'chat', 
          time: chat.start_time || chat.startTime
        })),
        ...(orders || []).map(order => ({ 
          type: 'order', 
          time: order.order_time || order.orderTime
        })),
        ...(bookings || []).map(booking => ({ 
          type: 'booking', 
          time: booking.booking_time || booking.bookingTime
        }))
      ].filter(item => item.time); // Filter out items without a timestamp
      
      const now = new Date();
      let timeFormat = "ha"; // Default format for hours
      let groupedData: Record<string, number> = {};
      
      if (timeRange === "Day") {
        // Group by hour for the last 24 hours
        allData.forEach(item => {
          const itemDate = new Date(item.time);
          // Only include items from today
          if (itemDate.toDateString() === now.toDateString()) {
            const hourKey = format(itemDate, "ha");
            groupedData[hourKey] = (groupedData[hourKey] || 0) + 1;
          }
        });
        
        // Create a full day of hours (8AM to 8PM for restaurant)
        const hourKeys = [];
        for (let i = 8; i <= 20; i++) {
          const hour = i % 12 || 12; // Convert 0 to 12 for 12PM
          const ampm = i < 12 ? 'AM' : 'PM';
          hourKeys.push(`${hour}${ampm}`);
        }
        
        // Fill in missing hours with zeros
        hourKeys.forEach(hour => {
          if (!groupedData[hour]) {
            groupedData[hour] = 0;
          }
        });
      } else if (timeRange === "Week") {
        // Group by day for the last 7 days
        timeFormat = "EEE"; // Format for day of week (Mon, Tue, etc.)
        
        // Get start of week
        const startDay = startOfWeek(now);
        
        // Create all days of the week
        for (let i = 0; i < 7; i++) {
          const day = addDays(startDay, i);
          const dayKey = format(day, timeFormat);
          groupedData[dayKey] = 0;
        }
        
        // Fill in the data
        allData.forEach(item => {
          const itemDate = new Date(item.time);
          // Only include items from this week
          if (itemDate >= startDay && itemDate <= now) {
            const dayKey = format(itemDate, timeFormat);
            groupedData[dayKey] = (groupedData[dayKey] || 0) + 1;
          }
        });
      } else { // Month
        // Group by month for the last 12 months
        timeFormat = "MMM"; // Format for month (Jan, Feb, etc.)
        
        // Get start of 12 months ago
        const startMonth = startOfMonth(subDays(now, 365));
        
        // Create all months
        for (let i = 0; i < 12; i++) {
          const month = addMonths(startMonth, i);
          const monthKey = format(month, timeFormat);
          groupedData[monthKey] = 0;
        }
        
        // Fill in the data
        allData.forEach(item => {
          const itemDate = new Date(item.time);
          // Only include items from the last 12 months
          if (itemDate >= startMonth && itemDate <= now) {
            const monthKey = format(itemDate, timeFormat);
            groupedData[monthKey] = (groupedData[monthKey] || 0) + 1;
          }
        });
      }
      
      // Convert to chart data format and find peak
      const formattedData = Object.entries(groupedData)
        .map(([time, interactions]) => ({
          time,
          interactions
        }))
        .sort((a, b) => {
          // Sort by time according to the correct temporal order
          if (timeRange === "Day") {
            // For day, convert hour strings to numbers for correct sorting
            const hourA = parseInt(a.time.replace(/[APM]/g, ""));
            const hourB = parseInt(b.time.replace(/[APM]/g, ""));
            const isAMa = a.time.includes("AM");
            const isAMb = b.time.includes("AM");
            
            // Adjust 12AM and 12PM
            const adjustedHourA = isAMa ? (hourA === 12 ? 0 : hourA) : (hourA === 12 ? 12 : hourA + 12);
            const adjustedHourB = isAMb ? (hourB === 12 ? 0 : hourB) : (hourB === 12 ? 12 : hourB + 12);
            
            return adjustedHourA - adjustedHourB;
          }
          return 0; // Default sorting (for week and month timeFormat already ensures correct order)
        });
      
      // Find and mark peak
      if (formattedData.length > 0) {
        const maxInteractions = Math.max(...formattedData.map(d => d.interactions));
        formattedData.forEach(data => {
          if (data.interactions === maxInteractions && data.interactions > 0) {
            data.isPeak = true;
          }
        });
      }
      
      setChartData(formattedData);
    };
    
    processData();
  }, [timeRange, calls, chats, orders, bookings, isLoading]);
  
  const handleTimeRangeChange = (range: TimeRange) => {
    setTimeRange(range);
  };
  
  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-2 border border-neutral-200 shadow rounded-md">
          <p className="text-sm">{`${label}: ${payload[0].value} interactions`}</p>
          {data.isPeak && (
            <p className="text-xs text-gray-600 font-medium">Peak Activity</p>
          )}
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg font-medium text-neutral-900">
            Activity Overview
          </CardTitle>
          <div className="inline-flex bg-neutral-100 rounded-md h-8 w-32">
            <Skeleton className="h-full w-full" />
          </div>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-medium text-neutral-900">
          Activity Overview
        </CardTitle>
        <div className="inline-flex bg-neutral-100 rounded-md">
          {(["Day", "Week", "Month"] as TimeRange[]).map((range) => (
            <Button
              key={range}
              variant="ghost"
              size="sm"
              onClick={() => handleTimeRangeChange(range)}
              className={cn(
                "px-3 py-1 text-sm rounded-md",
                timeRange === range
                  ? "bg-primary text-white"
                  : "text-neutral-600 hover:bg-neutral-200"
              )}
            >
              {range}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 10, left: -20, bottom: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="time" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="interactions"
                fill={(entry) => (entry.isPeak ? "hsl(0, 0%, 40%)" : "hsl(0, 0%, 0%)")}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center justify-center space-x-8 mt-4">
          <div className="flex items-center">
            <span className="w-3 h-3 bg-black rounded-sm mr-2"></span>
            <span className="text-sm text-neutral-600">AI Interactions</span>
          </div>
          <div className="flex items-center">
            <span className="w-3 h-3 bg-gray-500 rounded-sm mr-2"></span>
            <span className="text-sm text-neutral-600">Peak Activity</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
