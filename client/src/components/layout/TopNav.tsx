import { useState } from "react";
import { useLocation } from "wouter";
import { 
  HelpCircleIcon, 
  SearchIcon,
  MenuIcon,
  LogOutIcon
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";
import { useQuery } from '@tanstack/react-query';
import { getQueryFn } from '@/lib/queryClient';

type TopNavProps = {
  openSidebar: () => void;
};

export default function TopNav({ openSidebar }: TopNavProps) {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [, setLocation] = useLocation();

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
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                <SearchIcon className="h-4 w-4 text-neutral-400" />
              </div>
              <Input
                className="block w-full pl-10 pr-3 py-2 border border-neutral-200 rounded-md text-sm placeholder-neutral-500"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
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