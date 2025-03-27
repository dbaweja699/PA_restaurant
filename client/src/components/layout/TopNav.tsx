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

export default function TopNav({ openSidebar }: TopNavProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [, setLocation] = useLocation();

  const handleSignOut = () => {
    setLocation('/signin');
  };

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
          <Button variant="ghost" size="icon">
            <BellIcon className="h-5 w-5" />
          </Button>

          <Button variant="ghost" size="icon">
            <HelpCircleIcon className="h-5 w-5" />
          </Button>

          <Button variant="ghost" size="icon" onClick={handleSignOut}>
            <LogOutIcon className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}