import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Call } from "@shared/schema";

export default function Calls() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: calls = [] } = useQuery<Call[]>({
    queryKey: ["calls"],
    queryFn: async () => {
      const response = await fetch("/api/calls");
      return response.json();
    },
  });

  const formatPhoneNumber = (phone: string) => {
    if (!phone) return '';
    return phone.replace(/(\+\d{1})(\d{3})(\d{3})(\d{4})/, '$1 ($2) $3-$4');
  };

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return '-';
    try {
      return format(new Date(dateStr), "MMM d, h:mm a");
    } catch (e) {
      return dateStr;
    }
  };

  const filteredCalls = calls.filter((call) =>
    call.phoneNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    call.topic?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search calls..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
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
                  <TableCell>{formatDate(call.startTime?.toString())}</TableCell>
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