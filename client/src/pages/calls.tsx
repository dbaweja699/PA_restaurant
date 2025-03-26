import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { type Call } from "@shared/schema";
import { 
  Table, 
  TableHeader, 
  TableRow, 
  TableHead, 
  TableBody, 
  TableCell 
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow, format } from "date-fns";
import { PhoneCall, PhoneIncoming, PhoneOutgoing, Clock } from "lucide-react";

export default function Calls() {
  const { data: calls, isLoading } = useQuery<Call[]>({ 
    queryKey: ['/api/calls'],
  });

  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");

  const formatPhoneNumber = (phone: string) => {
    return phone?.replace(/(\+\d{1})(\d{3})(\d{3})(\d{4})/, '$1 ($2) $3-$4') || '';
  };

  const filteredCalls = calls?.filter(call => {
    if (filter === "all") return true;
    return call.status === filter;
  }) || [];

  if (isLoading) {
    return (
      <div className="py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Call History</CardTitle>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-display font-bold text-neutral-900">Call Management</h1>
          <p className="mt-1 text-sm text-neutral-600">Monitor and manage AI-handled customer calls</p>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant={filter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("all")}
          >
            All Calls
          </Button>
          <Button
            variant={filter === "active" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("active")}
          >
            <span className="inline-block w-2 h-2 bg-accent rounded-full animate-pulse mr-2"></span>
            Active
          </Button>
          <Button
            variant={filter === "completed" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("completed")}
          >
            Completed
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Call History</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Phone Number</TableHead>
                <TableHead>Start Time</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Duration</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCalls.map((call) => (
                <TableRow key={call.id}>
                  <TableCell>{formatPhoneNumber(call.phoneNumber)}</TableCell>
                  <TableCell>{format(new Date(call.startTime), "MMM d, h:mm a")}</TableCell>
                  <TableCell>{call.status}</TableCell>
                  <TableCell>{call.duration ? `${call.duration}s` : '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}