
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { 
  HelpCircleIcon, 
  SearchIcon,
  MenuIcon,
  LogOutIcon,
  X
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";
import { useQuery } from '@tanstack/react-query';
import { getQueryFn } from '@/lib/queryClient';
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Command, 
  CommandEmpty, 
  CommandGroup, 
  CommandInput, 
  CommandItem, 
  CommandList, 
  CommandSeparator
} from "@/components/ui/command";

type TopNavProps = {
  openSidebar: () => void;
};

type SearchResult = {
  id: number;
  type: 'review' | 'order' | 'booking' | 'call' | 'chat';
  title: string;
  subtitle?: string;
  href: string;
  date?: string;
}

export default function TopNav({ openSidebar }: TopNavProps) {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [, setLocation] = useLocation();

  // Load all data that needs to be searched
  const { data: reviews } = useQuery({ queryKey: ['/api/reviews'] });
  const { data: orders } = useQuery({ queryKey: ['/api/orders'] });
  const { data: bookings } = useQuery({ queryKey: ['/api/bookings'] });
  const { data: calls } = useQuery({ queryKey: ['/api/calls'] });
  const { data: chats } = useQuery({ queryKey: ['/api/chats'] });

  // Function to handle search
  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    
    // Small delay to avoid too many searches while typing
    const timer = setTimeout(() => {
      const results: SearchResult[] = [];
      const query = searchQuery.toLowerCase();

      // Search in reviews
      if (reviews) {
        reviews
          .filter(review => 
            (review.customerName && review.customerName.toLowerCase().includes(query)) ||
            (review.customer_name && review.customer_name.toLowerCase().includes(query)) ||
            (review.comment && review.comment.toLowerCase().includes(query))
          )
          .slice(0, 5)
          .forEach(review => {
            results.push({
              id: review.id,
              type: 'review',
              title: review.customerName || review.customer_name || 'Unknown customer',
              subtitle: review.comment || 'No comment',
              href: `/reviews?id=${review.id}`,
              date: review.date
            });
          });
      }

      // Search in orders
      if (orders) {
        orders
          .filter(order => 
            (order.customerName && order.customerName.toLowerCase().includes(query)) ||
            (order.customer_name && order.customer_name.toLowerCase().includes(query)) ||
            (order.tableNumber && order.tableNumber.toLowerCase().includes(query)) ||
            (order.table_number && order.table_number.toLowerCase().includes(query))
          )
          .slice(0, 5)
          .forEach(order => {
            results.push({
              id: order.id,
              type: 'order',
              title: order.customerName || order.customer_name || 'Unknown customer',
              subtitle: `$${order.total} - ${order.status}`,
              href: `/orders?id=${order.id}`,
              date: order.orderTime || order.order_time
            });
          });
      }

      // Search in bookings
      if (bookings) {
        bookings
          .filter(booking => 
            (booking.customerName && booking.customerName.toLowerCase().includes(query)) ||
            (booking.customer_name && booking.customer_name.toLowerCase().includes(query)) ||
            (booking.notes && booking.notes.toLowerCase().includes(query)) ||
            (booking.specialOccasion && booking.specialOccasion.toLowerCase().includes(query))
          )
          .slice(0, 5)
          .forEach(booking => {
            results.push({
              id: booking.id,
              type: 'booking',
              title: booking.customerName || booking.customer_name || 'Unknown customer',
              subtitle: `${booking.partySize || booking.party_size} people`,
              href: `/bookings?id=${booking.id}`,
              date: booking.bookingTime || booking.booking_time
            });
          });
      }

      // Search in calls
      if (calls) {
        calls
          .filter(call => 
            (call.phoneNumber && call.phoneNumber.toLowerCase().includes(query)) ||
            (call.phone_number && call.phone_number.toLowerCase().includes(query)) ||
            (call.notes && call.notes.toLowerCase().includes(query))
          )
          .slice(0, 5)
          .forEach(call => {
            results.push({
              id: call.id,
              type: 'call',
              title: call.phoneNumber || call.phone_number || 'Unknown number',
              subtitle: call.type || 'Call',
              href: `/calls?id=${call.id}`,
              date: call.startTime || call.start_time
            });
          });
      }

      // Search in chats
      if (chats) {
        chats
          .filter(chat => 
            (chat.customerName && chat.customerName.toLowerCase().includes(query)) ||
            (chat.customer_name && chat.customer_name.toLowerCase().includes(query)) ||
            (chat.transcript && chat.transcript.toLowerCase().includes(query))
          )
          .slice(0, 5)
          .forEach(chat => {
            results.push({
              id: chat.id,
              type: 'chat',
              title: chat.customerName || chat.customer_name || 'Unknown customer',
              subtitle: chat.status || 'Chat',
              href: `/chats?id=${chat.id}`,
              date: chat.startTime || chat.start_time
            });
          });
      }

      setSearchResults(results);
      setIsSearching(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, reviews, orders, bookings, calls, chats]);

  const handleSearchNavigate = (result: SearchResult) => {
    setIsSearchOpen(false);
    setSearchQuery('');
    setLocation(result.href);
  };

  const handleSignOut = () => {
    // Clear token
    localStorage.removeItem('auth_token');

    // Use queryClient to clear all cached data
    queryClient.clear();

    // Notify user
    toast({
      title: "Logged out successfully",
      description: "You have been logged out of your account",
    });

    // Use setLocation instead of window.location for smoother transition
    setLocation('/auth');
  };

  return (
    <div className="relative z-10 flex-shrink-0 flex h-16 bg-gradient-to-r from-[#5229bd] to-[#1357bf] shadow">
      <button 
        type="button" 
        className="md:hidden px-4 text-white"
        onClick={openSidebar}
      >
        <MenuIcon className="h-6 w-6" />
      </button>

      <div className="flex-1 px-4 flex justify-between">
        <div className="flex-1 flex items-center">
          <div className="max-w-2xl w-full">
            <Popover open={isSearchOpen} onOpenChange={setIsSearchOpen}>
              <PopoverTrigger asChild>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                    <SearchIcon className="h-4 w-4 text-neutral-400" />
                  </div>
                  <Input
                    className="block w-full pl-10 pr-3 py-2 border border-neutral-200 rounded-md text-sm placeholder-neutral-500"
                    placeholder="Search reviews, orders, bookings..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      if (e.target.value.length > 1) {
                        setIsSearchOpen(true);
                      }
                    }}
                    onClick={() => {
                      if (searchQuery.length > 1) {
                        setIsSearchOpen(true);
                      }
                    }}
                  />
                  {searchQuery && (
                    <button 
                      className="absolute inset-y-0 right-0 flex items-center pr-3" 
                      onClick={() => {
                        setSearchQuery('');
                        setIsSearchOpen(false);
                      }}
                    >
                      <X className="h-4 w-4 text-neutral-400" />
                    </button>
                  )}
                </div>
              </PopoverTrigger>
              <PopoverContent className="p-0 w-[400px]" align="start">
                <Command>
                  <CommandInput placeholder="Search across all data..." value={searchQuery} onValueChange={setSearchQuery} />
                  <CommandList>
                    <CommandEmpty>
                      {isSearching ? 'Searching...' : (
                        <div className="py-2">
                          <div className="text-sm text-neutral-500 mb-2">No results found.</div>
                          <div className="text-xs font-medium text-neutral-600 mb-1">Try visiting these pages:</div>
                          <div className="grid grid-cols-2 gap-2 mt-1">
                            <CommandItem 
                              onSelect={() => setLocation('/reviews')}
                              className="cursor-pointer flex items-center px-2 py-1 rounded-md hover:bg-neutral-100"
                            >
                              <span className="text-xs">Reviews</span>
                            </CommandItem>
                            <CommandItem 
                              onSelect={() => setLocation('/orders')}
                              className="cursor-pointer flex items-center px-2 py-1 rounded-md hover:bg-neutral-100"
                            >
                              <span className="text-xs">Orders</span>
                            </CommandItem>
                            <CommandItem 
                              onSelect={() => setLocation('/bookings')}
                              className="cursor-pointer flex items-center px-2 py-1 rounded-md hover:bg-neutral-100"
                            >
                              <span className="text-xs">Bookings</span>
                            </CommandItem>
                            <CommandItem 
                              onSelect={() => setLocation('/chats')}
                              className="cursor-pointer flex items-center px-2 py-1 rounded-md hover:bg-neutral-100"
                            >
                              <span className="text-xs">Chats</span>
                            </CommandItem>
                            <CommandItem 
                              onSelect={() => setLocation('/calls')}
                              className="cursor-pointer flex items-center px-2 py-1 rounded-md hover:bg-neutral-100"
                            >
                              <span className="text-xs">Calls</span>
                            </CommandItem>
                            <CommandItem 
                              onSelect={() => setLocation('/social')}
                              className="cursor-pointer flex items-center px-2 py-1 rounded-md hover:bg-neutral-100"
                            >
                              <span className="text-xs">Social Media</span>
                            </CommandItem>
                          </div>
                        </div>
                      )}
                    </CommandEmpty>
                    {searchResults.length > 0 && (
                      <>
                        <CommandGroup heading="Search Results">
                          {searchResults.map(result => (
                            <CommandItem 
                              key={`${result.type}-${result.id}`}
                              onSelect={() => handleSearchNavigate(result)}
                              className="cursor-pointer"
                            >
                              <div className="flex flex-col">
                                <div className="flex items-center">
                                  <span className="capitalize text-xs bg-neutral-100 rounded-full px-2 py-0.5 mr-2">
                                    {result.type}
                                  </span>
                                  <span className="font-medium">{result.title}</span>
                                </div>
                                {result.subtitle && (
                                  <span className="text-xs text-neutral-500 truncate max-w-[350px]">{result.subtitle}</span>
                                )}
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </>
                    )}
                    {isSearching && (
                      <div className="p-2">
                        <Skeleton className="h-5 w-full mb-2" />
                        <Skeleton className="h-5 w-full mb-2" />
                        <Skeleton className="h-5 w-full" />
                      </div>
                    )}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div className="ml-4 flex items-center md:ml-6 space-x-4">
          {/* Notification Center with animation when new notifications arrive */}
          <div className="relative">
            <NotificationCenter />
          </div>

          <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
            <HelpCircleIcon className="h-5 w-5" />
          </Button>

          <Button variant="ghost" size="icon" onClick={handleSignOut} className="text-white hover:bg-white/10">
            <LogOutIcon className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
