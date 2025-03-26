import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";
import { type PerformanceMetrics as PerformanceMetricsType } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";

function MetricItem({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm font-medium text-neutral-700">{label}</span>
        <span className="text-sm font-medium text-neutral-900">{value}%</span>
      </div>
      <Progress value={value} className="h-2 bg-neutral-200" indicatorClassName={color} />
    </div>
  );
}

export function PerformanceMetrics() {
  const { data: metrics, isLoading } = useQuery<PerformanceMetricsType>({ 
    queryKey: ['/api/dashboard/performance'],
  });
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium text-neutral-900">
            AI Performance Metrics
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="w-full h-8" />
          ))}
        </CardContent>
      </Card>
    );
  }
  
  if (!metrics) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium text-neutral-900">
            AI Performance Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-neutral-500 py-8">
            No performance metrics available.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-medium text-neutral-900">
          AI Performance Metrics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <MetricItem 
          label="Customer Satisfaction" 
          value={metrics.customerSatisfaction} 
          color="bg-secondary" 
        />
        
        <MetricItem 
          label="Response Time" 
          value={metrics.responseTime} 
          color="bg-accent" 
        />
        
        <MetricItem 
          label="Issue Resolution" 
          value={metrics.issueResolution} 
          color="bg-primary" 
        />
        
        <MetricItem 
          label="Handoff Rate" 
          value={metrics.handoffRate} 
          color="bg-secondary" 
        />
      </CardContent>
      <CardFooter className="border-t border-neutral-200 pt-4">
        <div className="flex justify-between items-center w-full">
          <span className="text-sm font-medium text-neutral-600">Overall AI Efficiency</span>
          <span className="text-sm font-bold text-accent">
            {metrics.overallEfficiency}%
          </span>
        </div>
      </CardFooter>
    </Card>
  );
}
