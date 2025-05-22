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
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
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
  const [selectedBooking, setSelectedBooking] = useState<FunctionBooking | null>(null);

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
        if (!booking.event_date) return false;
        const bookingDate = new Date(booking.event_date);
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
                            {booking.event_date 
                              ? format(new Date(booking.event_date), "MMM d, yyyy") 
                              : "No date"}
                          </TableCell>
                          <TableCell>
                            <div>{booking.name || "No name"}</div>
                            <div className="text-xs text-neutral-500">{booking.phone || "No phone"}</div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {booking.event_type || "Unspecified"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <Users className="h-3 w-3 mr-1" />
                              {booking.people || "N/A"}
                            </div>
                          </TableCell>
                          <TableCell>{booking.rooms_hired || "Not specified"}</TableCell>
                          <TableCell>
                            <div className="text-xs space-y-1">
                              <div className="flex items-center">
                                <span className="font-medium mr-2">Setup:</span>
                                {booking.setup_time || "N/A"}
                              </div>
                              <div className="flex items-center">
                                <span className="font-medium mr-2">Start:</span>
                                {booking.start_time || "N/A"}
                              </div>
                              <div className="flex items-center">
                                <span className="font-medium mr-2">End:</span>
                                {booking.finish_time || "N/A"}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setSelectedBooking(booking)}
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

      {/* Booking Details Dialog */}
      {selectedBooking && (
        <Dialog
          open={!!selectedBooking}
          onOpenChange={(open) => !open && setSelectedBooking(null)}
        >
          <DialogContent className="sm:max-w-xl">
            <DialogHeader>
              <DialogTitle>Function Booking Details</DialogTitle>
              <DialogDescription>
                Event information for {selectedBooking.name}
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="border rounded-md p-3">
                  <h3 className="text-sm font-semibold mb-2">Event Details</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-start">
                      <CalendarIcon className="h-4 w-4 mr-2 mt-0.5 text-neutral-500" />
                      <div>
                        <div className="font-medium">Date</div>
                        <div>
                          {selectedBooking.event_date 
                            ? format(new Date(selectedBooking.event_date), "EEEE, MMMM d, yyyy") 
                            : "No date specified"}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <Clock className="h-4 w-4 mr-2 mt-0.5 text-neutral-500" />
                      <div>
                        <div className="font-medium">Times</div>
                        <div>Setup: {selectedBooking.setup_time || "Not specified"}</div>
                        <div>Start: {selectedBooking.start_time || "Not specified"}</div>
                        <div>Finish: {selectedBooking.finish_time || "Not specified"}</div>
                        <div>Food Serving: {selectedBooking.food_serving_time || "Not specified"}</div>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <Users className="h-4 w-4 mr-2 mt-0.5 text-neutral-500" />
                      <div>
                        <div className="font-medium">Party Size</div>
                        <div>
                          {selectedBooking.people 
                            ? `${selectedBooking.people} ${selectedBooking.people > 1 ? 'people' : 'person'}`
                            : "Not specified"}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border rounded-md p-3">
                  <h3 className="text-sm font-semibold mb-2">Event Information</h3>
                  <div className="space-y-2 text-sm">
                    <div className="grid grid-cols-2 gap-1">
                      <div className="font-medium">Event Type:</div>
                      <div className="capitalize">{selectedBooking.event_type || "Not specified"}</div>
                      
                      <div className="font-medium">Room Hired:</div>
                      <div>{selectedBooking.rooms_hired || "Not specified"}</div>
                      
                      <div className="font-medium">Subsidised Drinks:</div>
                      <div>{selectedBooking.subsidised_drinks || "Not specified"}</div>
                      
                      <div className="font-medium">Cake on Table:</div>
                      <div>{selectedBooking.cake_on_table || "Not specified"}</div>
                      
                      <div className="font-medium">Present on Table:</div>
                      <div>{selectedBooking.present_on_table || "Not specified"}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="border rounded-md p-3">
                  <h3 className="text-sm font-semibold mb-2">Contact Information</h3>
                  <div className="space-y-2 text-sm">
                    <div className="grid grid-cols-2 gap-1">
                      <div className="font-medium">Name:</div>
                      <div>{selectedBooking.name || "Not provided"}</div>
                      
                      <div className="font-medium">Phone:</div>
                      <div>{selectedBooking.phone || "Not provided"}</div>
                      
                      <div className="font-medium">Email:</div>
                      <div>{selectedBooking.email || "Not provided"}</div>
                    </div>
                  </div>
                </div>

                <div className="border rounded-md p-3">
                  <h3 className="text-sm font-semibold mb-2">Payment Details</h3>
                  <div className="space-y-2 text-sm">
                    <div className="grid grid-cols-2 gap-1">
                      <div className="font-medium">Account Name:</div>
                      <div>{selectedBooking.account_name || "Not provided"}</div>
                      
                      <div className="font-medium">BSB:</div>
                      <div>{selectedBooking.bsb || "Not provided"}</div>
                      
                      <div className="font-medium">Account Number:</div>
                      <div>{selectedBooking.account_number || "Not provided"}</div>
                    </div>
                  </div>
                </div>
                
                <div className="border rounded-md p-3">
                  <h3 className="text-sm font-semibold mb-2">Booking Information</h3>
                  <div className="space-y-2 text-sm">
                    <div className="grid grid-cols-2 gap-1">
                      <div className="font-medium">Created At:</div>
                      <div>
                        {selectedBooking.created_at 
                          ? format(new Date(selectedBooking.created_at), "MMM d, yyyy h:mm a") 
                          : "Not available"}
                      </div>
                      
                      <div className="font-medium">Booking ID:</div>
                      <div>{selectedBooking.id || "Not available"}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button onClick={() => setSelectedBooking(null)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}