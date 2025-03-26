import { useState } from "react";
import { useLocation } from "wouter";
import { 
  BellIcon, 
  HelpCircleIcon, 
  SearchIcon,
  MenuIcon,
  LogOutIcon
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type TopNavProps = {
  openSidebar: () => void;
};

export function TopNav({ openSidebar }: TopNavProps) {
  const [searchQuery, setSearchQuery] = useState("");
  
  return (
    <div className="relative z-10 flex-shrink-0 flex h-16 bg-white shadow">
      <button 
        type="button" 
        className="md:hidden px-4 text-primary"
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
          <button className="p-1 rounded-full hover:bg-neutral-100 relative">
            <BellIcon className="h-5 w-5 text-neutral-500" />
            <span className="absolute top-0 right-0 w-2 h-2 bg-secondary rounded-full"></span>
          </button>
          
          <button className="p-1 rounded-full hover:bg-neutral-100">
            <HelpCircleIcon className="h-5 w-5 text-neutral-500" />
          </button>
          
          <div className="md:hidden flex items-center">
            {/* This will be populated with user avatar for mobile, 
                but we're handling the user profile in the Sidebar component */}
          </div>
        </div>
      </div>
    </div>
  );
}
export default function TopNav() {
  const [, setLocation] = useLocation();

  const handleSignOut = () => {
    // Clear any auth tokens/state if needed
    setLocation('/signin');
  };

  return (
    <header className="flex h-16 items-center gap-4 border-b bg-background px-6">
      <Input
        type="search"
        placeholder="Search..."
        className="w-[300px]"
        prefix={<SearchIcon className="h-4 w-4 text-muted-foreground" />}
      />
      <div className="ml-auto flex items-center gap-4">
        <Button variant="ghost" size="icon">
          <BellIcon className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon">
          <HelpCircleIcon className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={handleSignOut}>
          <LogOutIcon className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
