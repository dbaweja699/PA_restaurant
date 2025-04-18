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
      <Card className="bg-card border-accent/20 shadow-md animate-pulse-glow">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium text-primary-foreground flex items-center">
            <span className="bg-primary px-2 py-1 rounded-md mr-2">Today's</span> Bookings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="w-full h-12 bg-accent/10" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!bookings || bookings.length === 0) {
    return (
      <Card className="bg-card border-accent/20 shadow-md animate-pulse-glow">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium text-primary-foreground flex items-center">
            <span className="bg-primary px-2 py-1 rounded-md mr-2">Today's</span> Bookings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8 border border-dashed border-accent/30 rounded-md bg-background/50">
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
      return "bg-primary text-primary-foreground";
    }
    return "bg-accent text-accent-foreground";
  };

  const getStatusClass = (status: string | null | undefined) => {
    if (!status) return "bg-secondary/80 text-secondary-foreground";

    switch (status.toLowerCase()) {
      case "confirmed":
        return "bg-green-600 text-white";
      case "pending":
        return "bg-yellow-500 text-white";
      case "cancelled":
        return "bg-red-500 text-white";
      default:
        return "bg-secondary/80 text-secondary-foreground";
    }
  };

  return (
    <Card className="bg-card border-accent/20 shadow-md animate-pulse-glow">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium text-primary-foreground flex items-center">
          <span className="bg-primary px-2 py-1 rounded-md mr-2">Today's</span> Bookings
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-1 max-h-80 overflow-y-auto scrollbar-hide">
          {todaysBookings.map((booking) => (
            <div 
              key={booking.id} 
              className="flex items-center justify-between p-2 hover:bg-accent/10 rounded-md border-l-2 border-accent/50 mb-2 bg-card shadow-sm"
            >
              <div className="flex items-center">
                <div className={cn(
                  "font-medium rounded-md px-2 py-1 text-xs w-16 text-center",
                  getTimeClass(new Date(booking.bookingTime))
                )}>
                  {format(new Date(booking.bookingTime), "h:mm a")}
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-primary">{booking.customerName}</p>
                  <p className="text-xs text-accent-foreground">
                    Table for {booking.partySize} • {booking.notes || booking.specialOccasion || "No notes"}
                  </p>
                </div>
              </div>
              <div className={cn(
                "text-xs px-2 py-1 rounded-md font-medium shadow-sm",
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
      <CardFooter className="justify-center pt-2 border-t border-accent/20">
        <Button variant="outline" size="sm" asChild className="hover:bg-primary hover:text-primary-foreground button-glow">
          <Link href="/bookings" className="text-sm font-medium">
            Manage Bookings
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}