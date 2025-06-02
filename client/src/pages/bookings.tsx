import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { type Booking } from "@shared/schema";
import { useLocation } from "wouter";
import { MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar } from "@/components/ui/calendar";
import { format, isSameDay } from "date-fns";
import {
  Calendar as CalendarIcon,
  Users,
  Clock,
  Info,
  CalendarDays,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { BookingForm } from "@/components/booking/BookingForm";
import { useToast } from "@/hooks/use-toast";

export default function Bookings() {
  const { toast } = useToast();
  const {
    data: bookings,
    isLoading,
    refetch,
  } = useQuery<Booking[]>({
    queryKey: ["/api/bookings"],
    refetchInterval: 5000, // Refetch every 5 seconds for real-time updates
  });

  // Debug log to see what data we're getting from the API
  console.log("Bookings data received:", bookings);

  // Initialize with undefined to show all bookings by default
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [viewMode, setViewMode] = useState<"calendar" | "list">("list");
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [, setLocation] = useLocation();

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

  // Debug the dates to see what's going on
  console.log("Selected date:", selectedDate);

  const filteredBookings =
    bookings?.filter((booking) => {
      if (!selectedDate) return true;
      const bookingDate = new Date(booking.bookingTime);
      console.log(
        `Comparing booking date ${bookingDate} with selected date ${selectedDate}`,
      );
      return isSameDay(bookingDate, selectedDate);
    }) || [];

  // Group bookings by time slot for calendar view
  const bookingsByTime: Record<string, Booking[]> = {};
  filteredBookings.forEach((booking) => {
    const timeKey = format(new Date(booking.bookingTime), "h:mm a");
    if (!bookingsByTime[timeKey]) {
      bookingsByTime[timeKey] = [];
    }
    bookingsByTime[timeKey].push(booking);
  });

  // Sort time slots
  const sortedTimeSlots = Object.keys(bookingsByTime).sort((a, b) => {
    return (
      new Date(`01/01/2023 ${a}`).getTime() -
      new Date(`01/01/2023 ${b}`).getTime()
    );
  });

  const getStatusBadge = (status: string | null | undefined) => {
    if (!status)
      return <Badge className="bg-neutral-100 text-neutral-800">Unknown</Badge>;

    switch (status.toLowerCase()) {
      case "confirmed":
        return <Badge className="bg-green-100 text-green-800">Confirmed</Badge>;
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case "cancelled":
        return <Badge className="bg-red-100 text-red-800">Cancelled</Badge>;
      default:
        return (
          <Badge className="bg-neutral-100 text-neutral-800">{status}</Badge>
        );
    }
  };

  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-neutral-900">
            Bookings
          </h1>
          <p className="mt-1 text-sm text-neutral-600">
            Manage reservations and bookings handled by your AI assistant
          </p>
        </div>

        <div className="mt-4 md:mt-0 flex items-center space-x-2">
          <Button
            variant="default"
            size="sm"
            onClick={() => setShowBookingForm(true)}
            className="mr-2"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Booking
          </Button>
          <Button
            variant={viewMode === "calendar" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("calendar")}
          >
            <CalendarDays className="h-4 w-4 mr-2" />
            Calendar View
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("list")}
          >
            <Users className="h-4 w-4 mr-2" />
            List View
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Calendar Sidebar */}
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-medium">Select Date</CardTitle>
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
                  day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                  day_today: "bg-accent text-accent-foreground",
                  day_outside: "text-neutral-400 opacity-50",
                  day_disabled: "text-neutral-400 opacity-50",
                  day_hidden: "invisible",
                }}
              />
              <div className="mt-6">
                <h3 className="text-sm font-medium mb-2">Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Total Bookings:</span>
                    <span className="font-medium">
                      {filteredBookings.length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Confirmed:</span>
                    <span className="font-medium">
                      {
                        filteredBookings.filter(
                          (b) => b.status?.toLowerCase() === "confirmed",
                        ).length
                      }
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Pending:</span>
                    <span className="font-medium">
                      {
                        filteredBookings.filter(
                          (b) => b.status?.toLowerCase() === "pending",
                        ).length
                      }
                    </span>
                  </div>
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
                  : "All Bookings"}
              </CardTitle>
              <CardDescription>
                {filteredBookings.length} bookings{" "}
                {selectedDate ? "on this day" : ""}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredBookings.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-neutral-500">No bookings for this date.</p>
                </div>
              ) : viewMode === "calendar" ? (
                <div className="space-y-6">
                  {sortedTimeSlots.map((timeSlot) => (
                    <div key={timeSlot}>
                      <h3 className="text-sm font-medium bg-neutral-100 p-2 rounded mb-2">
                        {timeSlot}
                      </h3>
                      <div className="space-y-2">
                        {bookingsByTime[timeSlot].map((booking) => (
                          <div
                            key={booking.id}
                            className="border border-neutral-200 rounded-lg p-3 hover:bg-neutral-50 cursor-pointer"
                            onClick={() => setSelectedBooking(booking)}
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-medium">
                                  {booking.customerName}
                                </h4>
                                <div className="flex items-center text-sm text-neutral-600 mt-1">
                                  <Users className="h-3 w-3 mr-1" />
                                  {booking.partySize}{" "}
                                  {booking.partySize > 1 ? "people" : "person"}
                                  {booking.specialOccasion && (
                                    <>
                                      <span className="mx-1">•</span>
                                      <span className="text-secondary-dark">
                                        {booking.specialOccasion}
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onSelect={() => setSelectedBooking(booking)}
                                  >
                                    View Details
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    className="text-red-600"
                                    onSelect={async () => {
                                      try {
                                        const response = await fetch(
                                          `/api/bookings/${booking.id}`,
                                          {
                                            method: "DELETE",
                                          },
                                        );

                                        if (!response.ok) {
                                          throw new Error(
                                            "Failed to delete booking",
                                          );
                                        }

                                        await refetch();
                                        toast({
                                          title: "Success",
                                          description: `Booking for ${booking.customerName} has been cancelled.`,
                                          variant: "default",
                                        });
                                      } catch (error) {
                                        console.error(
                                          "Failed to cancel booking:",
                                          error,
                                        );
                                        toast({
                                          title: "Error",
                                          description:
                                            "Failed to cancel booking. Please try again.",
                                          variant: "destructive",
                                        });
                                      }
                                    }}
                                  >
                                    Cancel Booking
                                  </DropdownMenuItem>
                                  {booking.source === "Phone Call" &&
                                    booking.callId && (
                                      <DropdownMenuItem
                                        onSelect={() =>
                                          setLocation(
                                            `/calls?id=${booking.callId}`,
                                          )
                                        }
                                      >
                                        View Call Details
                                      </DropdownMenuItem>
                                    )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                            {booking.notes && (
                              <p className="text-xs text-neutral-500 mt-2">
                                Note: {booking.notes}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Time</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Party Size</TableHead>
                      <TableHead>Special Request</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBookings.map((booking) => (
                      <TableRow
                        key={booking.id}
                        className="cursor-pointer hover:bg-neutral-50"
                        onClick={() => setSelectedBooking(booking)}
                      >
                        <TableCell>
                          <div className="font-medium">
                            {format(new Date(booking.bookingTime), "h:mm a")}
                          </div>
                        </TableCell>
                        <TableCell>
                          {booking.customerName}
                        </TableCell>
                        <TableCell>{booking.partySize}</TableCell>
                        <TableCell>
                          {booking.notes || booking.specialOccasion || "-"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {booking.source}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onSelect={() => setSelectedBooking(booking)}
                              >
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-red-600"
                                onSelect={async () => {
                                  try {
                                    const response = await fetch(
                                      `/api/bookings/${booking.id}`,
                                      {
                                        method: "DELETE",
                                      },
                                    );

                                    if (!response.ok) {
                                      throw new Error(
                                        "Failed to delete booking",
                                      );
                                    }

                                    await refetch();
                                    toast({
                                      title: "Success",
                                      description: `Booking for ${booking.customerName} has been cancelled.`,
                                      variant: "default",
                                    });
                                  } catch (error) {
                                    console.error(
                                      "Failed to cancel booking:",
                                      error,
                                    );
                                    toast({
                                      title: "Error",
                                      description:
                                        "Failed to cancel booking. Please try again.",
                                      variant: "destructive",
                                    });
                                  }
                                }}
                              >
                                Cancel Booking
                              </DropdownMenuItem>
                              {booking.source === "Phone Call" &&
                                booking.callId && (
                                  <DropdownMenuItem
                                    onSelect={() =>
                                      setLocation(`/calls?id=${booking.callId}`)
                                    }
                                  >
                                    View Call Details
                                  </DropdownMenuItem>
                                )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
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
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Booking Details</DialogTitle>
              <DialogDescription>
                Reservation information for{" "}
                {selectedBooking.customerName}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="flex flex-col space-y-1.5">
                <h3 className="text-sm font-semibold">Date & Time</h3>
                <p className="flex items-center text-sm">
                  <CalendarIcon className="h-4 w-4 mr-2 text-neutral-500" />
                  {format(
                    new Date(selectedBooking.bookingTime),
                    "EEEE, MMMM d, yyyy",
                  )}
                </p>
                <p className="flex items-center text-sm">
                  <Clock className="h-4 w-4 mr-2 text-neutral-500" />
                  {format(new Date(selectedBooking.bookingTime), "h:mm a")}
                </p>
              </div>

              <div className="flex flex-col space-y-1.5">
                <h3 className="text-sm font-semibold">Customer Details</h3>
                <p className="flex items-center text-sm">
                  <Users className="h-4 w-4 mr-2 text-neutral-500" />
                  Party of {selectedBooking.partySize}
                </p>
                {selectedBooking.specialOccasion && (
                  <p className="text-sm pl-6">
                    Special Occasion: {selectedBooking.specialOccasion}
                  </p>
                )}
                {selectedBooking.notes && (
                  <p className="text-sm pl-6">Notes: {selectedBooking.notes}</p>
                )}
              </div>

              <div className="flex flex-col space-y-1.5">
                <h3 className="text-sm font-semibold">Booking Information</h3>
                <p className="flex items-center text-sm">
                  Source:{" "}
                  <Badge variant="outline" className="ml-2 capitalize">
                    {selectedBooking.source}
                  </Badge>
                </p>
                <p className="flex items-center text-sm">
                  AI Processed:{" "}
                  <Badge
                    variant={
                      selectedBooking.aiProcessed ? "default" : "outline"
                    }
                    className="ml-2 bg-accent"
                  >
                    {selectedBooking.aiProcessed ? "Yes" : "No"}
                  </Badge>
                </p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Add Booking Form */}
      <BookingForm open={showBookingForm} onOpenChange={setShowBookingForm} />
    </div>
  );
}
