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
    return phone.replace(/(\+\d{1})(\d{3})(\d{3})(\d{4})/, '$1 ($2) $3-$4');
  };

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

  const filteredCalls = calls?.filter(call => {
    if (filter === "all") return true;
    return call.status === filter;
  }) || [];

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
          <CardTitle className="text-lg font-medium flex items-center">
            <PhoneCall className="mr-2 h-5 w-5" />
            Call History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredCalls.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-neutral-500">No calls matching the selected filter.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Phone Number</TableHead>
                  <TableHead>Start Time</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Topic</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>AI Handled</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCalls.map((call) => (
                  <TableRow key={call.id}>
                    <TableCell>
                      <div className="flex items-center">
                        {call.status === "active" ? (
                          <PhoneIncoming className="mr-2 h-4 w-4 text-accent" />
                        ) : (
                          <PhoneOutgoing className="mr-2 h-4 w-4 text-primary" />
                        )}
                        {call.phoneNumber}
                      </div>
                    </TableCell>
                    <TableCell>
                      {call.startTime ? format(new Date(call.startTime), "MMM d, h:mm a") : "Invalid date"}
                    </TableCell>
                    <TableCell>
                      {call.duration ? (
                        `${call.duration} sec`
                      ) : (
                        <div className="flex items-center text-accent">
                          <Clock className="mr-1 h-3 w-3" />
                          {call.startTime ? formatDistanceToNow(new Date(call.startTime)) : "Unknown"}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>{call.topic || "Unknown"}</TableCell>
                    <TableCell>
                      <Badge variant={call.status === "active" ? "default" : "secondary"}>
                        {call.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {call.aiHandled ? (
                        <Badge variant="outline" className="bg-accent-light/10 text-accent">
                          AI
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-primary-light/10 text-primary">
                          Human
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm">
                        Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}