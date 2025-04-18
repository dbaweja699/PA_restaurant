
import { useState } from "react";
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
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { 
  Command, 
  CommandEmpty, 
  CommandGroup, 
  CommandInput, 
  CommandItem, 
  CommandList
} from "@/components/ui/command";

type TopNavProps = {
  openSidebar: () => void;
};

export default function TopNav({ openSidebar }: TopNavProps) {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [, setLocation] = useLocation();

  // Define navigation pages
  const navigationPages = [
    { name: "Dashboard", path: "/" },
    { name: "Reviews", path: "/reviews" },
    { name: "Orders", path: "/orders" },
    { name: "Bookings", path: "/bookings" },
    { name: "Calls", path: "/calls" },
    { name: "Chats", path: "/chats" },
    { name: "Social Media", path: "/social" },
    { name: "Settings", path: "/settings" }
  ];

  const handleNavigate = (path: string) => {
    setIsSearchOpen(false);
    setSearchQuery('');
    setLocation(path);
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
                    placeholder="Find pages quickly..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onClick={() => setIsSearchOpen(true)}
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
              <PopoverContent className="p-0 w-[320px]" align="start">
                <Command>
                  <CommandInput 
                    placeholder="Search pages..." 
                    value={searchQuery} 
                    onValueChange={setSearchQuery} 
                  />
                  <CommandList>
                    <CommandEmpty>
                      <div className="py-2">
                        <div className="text-sm text-neutral-500 mb-2">Navigation</div>
                        <div className="grid grid-cols-2 gap-2 mt-1">
                          {navigationPages.map(page => (
                            <CommandItem 
                              key={page.path}
                              onSelect={() => handleNavigate(page.path)}
                              className="cursor-pointer flex items-center px-2 py-1 rounded-md hover:bg-neutral-100"
                            >
                              <span className="text-xs">{page.name}</span>
                            </CommandItem>
                          ))}
                        </div>
                      </div>
                    </CommandEmpty>
                    <CommandGroup heading="Pages">
                      {navigationPages
                        .filter(page => 
                          page.name.toLowerCase().includes(searchQuery.toLowerCase())
                        )
                        .map(page => (
                          <CommandItem 
                            key={page.path}
                            onSelect={() => handleNavigate(page.path)}
                            className="cursor-pointer"
                          >
                            <span>{page.name}</span>
                          </CommandItem>
                        ))
                      }
                    </CommandGroup>
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
