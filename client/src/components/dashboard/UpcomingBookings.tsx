import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { type Booking } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { Link } from "wouter";
import { cn } from "@/lib/utils";

export function UpcomingBookings() {
  const { data: bookings, isLoading } = useQuery<Booking[]>({ 
    queryKey: ['/api/bookings'],
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium text-neutral-900">
            Today's Bookings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="w-full h-12" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!bookings || bookings.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium text-neutral-900">
            Today's Bookings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-neutral-500 py-8">
            No bookings scheduled for today.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Filter bookings for today and sort by time
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todaysBookings = bookings
    .filter(booking => {
      const bookingDate = new Date(booking.bookingTime);
      return bookingDate >= today && bookingDate < tomorrow;
    })
    .sort((a, b) => 
      new Date(a.bookingTime).getTime() - new Date(b.bookingTime).getTime()
    );

  const getTimeClass = (bookingTime: Date) => {
    const now = new Date();
    const bookingHour = new Date(bookingTime).getHours();
    const isPrimaryTime = bookingHour >= 17; // After 5pm is dinner time

    if (isPrimaryTime) {
      return "bg-black text-white";
    }
    return "bg-neutral-100 text-neutral-800";
  };

  const getStatusClass = (status: string | null | undefined) => {
    if (!status) return "bg-neutral-100 text-neutral-600";

    switch (status.toLowerCase()) {
      case "confirmed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-neutral-100 text-neutral-600";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-medium text-neutral-900">
          Today's Bookings
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-80 overflow-y-auto scrollbar-hide">
          {todaysBookings.map((booking) => (
            <div key={booking.id} className="flex items-center justify-between p-2 hover:bg-neutral-50 rounded-md">
              <div className="flex items-center">
                <div className={cn(
                  "font-medium rounded-md px-2 py-1 text-xs w-16 text-center",
                  getTimeClass(new Date(booking.bookingTime))
                )}>
                  {format(new Date(booking.bookingTime), "h:mm a")}
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-neutral-800">{booking.customerName}</p>
                  <p className="text-xs text-neutral-500">
                    Table for {booking.partySize} • {booking.notes || booking.specialOccasion || "No notes"}
                  </p>
                </div>
              </div>
              <div className={cn(
                "text-xs px-2 py-1 rounded-md",
                getStatusClass(booking.status)
              )}>
                {booking.status ? 
                  booking.status.charAt(0).toUpperCase() + booking.status.slice(1) : 
                  "Confirmed"
                }
              </div>
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter className="justify-center">
        <Button variant="link" asChild>
          <Link href="/bookings" className="text-accent hover:text-accent-dark text-sm font-medium">
            Manage Bookings
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}