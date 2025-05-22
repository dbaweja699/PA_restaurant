
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, isSameDay, parseISO } from "date-fns";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarIcon, Users, Clock, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface FunctionBooking {
  id: number;
  name: string;
  phone: string;
  email: string;
  event_date: string;
  setup_time: string;
  start_time: string;
  finish_time: string;
  event_type: string;
  people: number;
  rooms_hired: string;
  food_serving_time: string;
  subsidised_drinks: string;
  cake_on_table: string;
  present_on_table: string;
  account_name: string;
  bsb: string;
  account_number: string;
  created_at: string;
}

export default function FunctionBookings() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  const {
    data: bookings = [],
    isLoading,
    refetch,
  } = useQuery<FunctionBooking[]>({
    queryKey: ["/api/function-bookings"],
  });

  // Filter bookings by selected date
  const filteredBookings = selectedDate
    ? bookings.filter((booking) => {
        const bookingDate = parseISO(booking.event_date);
        return isSameDay(bookingDate, selectedDate);
      })
    : bookings;

  if (isLoading) {
    return (
      <div className="py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            <Skeleton className="h-80 w-full" />
          </div>
          <div className="md:col-span-2">
            <Skeleton className="h-96 w-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-display font-bold text-neutral-900">
          Function Bookings
        </h1>
        <p className="mt-1 text-sm text-neutral-600">
          Manage special events and function bookings
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Calendar Sidebar */}
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-medium">Select Date</CardTitle>
              <CardDescription>
                Click on a date to filter function bookings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="rounded-md border shadow-sm w-full"
                classNames={{
                  months: "flex flex-col space-y-4",
                  month: "space-y-4 w-full",
                  caption: "flex justify-center pt-1 relative items-center",
                  caption_label: "text-sm font-medium",
                  nav: "space-x-1 flex items-center",
                  nav_button: cn(
                    "h-7 w-7 bg-transparent p-0 hover:bg-neutral-100 rounded-full transition-colors",
                    "inline-flex items-center justify-center"
                  ),
                  table: "w-full border-collapse space-y-1",
                  head_row: "grid grid-cols-7 w-full",
                  head_cell: "text-neutral-500 text-center text-[0.8rem] font-normal",
                  row: "grid grid-cols-7 w-full mt-2",
                  cell: cn(
                    "text-center p-0 relative focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-neutral-100",
                    "first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md"
                  ),
                  day: cn(
                    "h-9 w-full p-0 mx-auto flex items-center justify-center font-normal aria-selected:opacity-100",
                    "hover:bg-neutral-100 rounded-md focus:bg-neutral-100 focus:outline-none"
                  ),
                  day_selected:
                    "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                  day_today: "bg-accent text-accent-foreground",
                  day_outside: "text-neutral-400 opacity-50",
                  day_disabled: "text-neutral-400 opacity-50",
                  day_hidden: "invisible",
                }}
              />
              <div className="mt-6">
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => setSelectedDate(undefined)}
                >
                  Clear Filter
                </Button>
              </div>
              <div className="mt-6">
                <h3 className="text-sm font-medium mb-2">Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Total Functions:</span>
                    <span className="font-medium">
                      {filteredBookings.length}
                    </span>
                  </div>
                  {selectedDate && (
                    <div className="flex justify-between">
                      <span className="text-neutral-600">Selected Date:</span>
                      <span className="font-medium">
                        {format(selectedDate, "MMM d, yyyy")}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-medium flex items-center">
                <CalendarIcon className="mr-2 h-5 w-5" />
                {selectedDate
                  ? format(selectedDate, "EEEE, MMMM d, yyyy")
                  : "All Function Bookings"}
              </CardTitle>
              <CardDescription>
                {filteredBookings.length} function{filteredBookings.length !== 1 ? "s" : ""}{" "}
                {selectedDate ? "on this day" : ""}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredBookings.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-neutral-500">No function bookings {selectedDate ? "for this date." : "found."}</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Event Date</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>People</TableHead>
                        <TableHead>Room</TableHead>
                        <TableHead>Times</TableHead>
                        <TableHead>Details</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredBookings.map((booking) => (
                        <TableRow key={booking.id}>
                          <TableCell>
                            {format(parseISO(booking.event_date), "MMM d, yyyy")}
                          </TableCell>
                          <TableCell>
                            <div>{booking.name}</div>
                            <div className="text-xs text-neutral-500">{booking.phone}</div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {booking.event_type}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <Users className="h-3 w-3 mr-1" />
                              {booking.people}
                            </div>
                          </TableCell>
                          <TableCell>{booking.rooms_hired}</TableCell>
                          <TableCell>
                            <div className="text-xs space-y-1">
                              <div className="flex items-center">
                                <span className="font-medium mr-2">Setup:</span>
                                {booking.setup_time}
                              </div>
                              <div className="flex items-center">
                                <span className="font-medium mr-2">Start:</span>
                                {booking.start_time}
                              </div>
                              <div className="flex items-center">
                                <span className="font-medium mr-2">End:</span>
                                {booking.finish_time}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                alert(
                                  `Additional Details for ${booking.name}:\n` +
                                  `Email: ${booking.email}\n` +
                                  `Food Serving Time: ${booking.food_serving_time}\n` +
                                  `Subsidised Drinks: ${booking.subsidised_drinks}\n` +
                                  `Cake on Table: ${booking.cake_on_table}\n` +
                                  `Present on Table: ${booking.present_on_table}\n` +
                                  `Account Name: ${booking.account_name}\n` +
                                  `BSB: ${booking.bsb}\n` +
                                  `Account Number: ${booking.account_number}`
                                );
                              }}
                            >
                              <Info className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
