import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Mock data for the chart
const mockData = {
  daily: [
    { time: "8AM", interactions: 12 },
    { time: "9AM", interactions: 18 },
    { time: "10AM", interactions: 25 },
    { time: "11AM", interactions: 31 },
    { time: "12PM", interactions: 28, isPeak: true },
    { time: "1PM", interactions: 29 },
    { time: "2PM", interactions: 20 },
    { time: "3PM", interactions: 18 },
    { time: "4PM", interactions: 23 },
    { time: "5PM", interactions: 34 },
    { time: "6PM", interactions: 37 },
    { time: "7PM", interactions: 30 },
    { time: "8PM", interactions: 21 },
  ],
  weekly: [
    { time: "Mon", interactions: 120 },
    { time: "Tue", interactions: 132 },
    { time: "Wed", interactions: 158 },
    { time: "Thu", interactions: 180, isPeak: true },
    { time: "Fri", interactions: 155 },
    { time: "Sat", interactions: 170 },
    { time: "Sun", interactions: 110 },
  ],
  monthly: [
    { time: "Jan", interactions: 1200 },
    { time: "Feb", interactions: 1350 },
    { time: "Mar", interactions: 1460, isPeak: true },
    { time: "Apr", interactions: 1200 },
    { time: "May", interactions: 1400 },
    { time: "Jun", interactions: 1350 },
    { time: "Jul", interactions: 1250 },
    { time: "Aug", interactions: 1300 },
    { time: "Sep", interactions: 1400 },
    { time: "Oct", interactions: 1280 },
    { time: "Nov", interactions: 1220 },
    { time: "Dec", interactions: 1380 },
  ],
};

type TimeRange = "Day" | "Week" | "Month";

export function ActivityChart() {
  const [timeRange, setTimeRange] = useState<TimeRange>("Day");
  
  const handleTimeRangeChange = (range: TimeRange) => {
    setTimeRange(range);
  };
  
  // Get data based on selected time range
  const chartData = 
    timeRange === "Day" ? mockData.daily :
    timeRange === "Week" ? mockData.weekly :
    mockData.monthly;
  
  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-2 border border-neutral-200 shadow rounded-md">
          <p className="text-sm">{`${label}: ${payload[0].value} interactions`}</p>
          {data.isPeak && (
            <p className="text-xs text-secondary font-medium">Peak Hour</p>
          )}
        </div>
      );
    }
    return null;
  };

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
                fill={(entry) => (entry.isPeak ? "hsl(24, 94%, 53%)" : "hsl(222.2, 47.4%, 20%)")}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center justify-center space-x-8 mt-4">
          <div className="flex items-center">
            <span className="w-3 h-3 bg-primary rounded-sm mr-2"></span>
            <span className="text-sm text-neutral-600">AI Interactions</span>
          </div>
          <div className="flex items-center">
            <span className="w-3 h-3 bg-secondary rounded-sm mr-2"></span>
            <span className="text-sm text-neutral-600">Peak Hour</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
