import { Link, useLocation } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import logoImg from "@/assets/dblytics-logo.png";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

// Define the user interface to match the actual API response
interface UserResponse {
  id: number;
  username: string;
  password: string;
  full_name: string;
  role: string;
  avatar_url: string;
}

type SidebarProps = {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
};

export function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
  const [location, setLocation] = useLocation();
  const { data: user } = useQuery<UserResponse>({ 
    queryKey: ['/api/user'],
  });
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const navigationItems = [
    { icon: "ri-dashboard-line", label: "Dashboard", path: "/" },
    { icon: "ri-phone-line", label: "Call Management", path: "/calls" },
    { icon: "ri-message-3-line", label: "Chat Interactions", path: "/chats" },
    { icon: "ri-star-line", label: "Reviews", path: "/reviews" },
    { icon: "ri-shopping-cart-2-line", label: "Orders", path: "/orders" },
    { icon: "ri-calendar-line", label: "Bookings", path: "/bookings" },
    { icon: "ri-global-line", label: "Social Media", path: "/social" },
    { icon: "ri-settings-line", label: "Settings", path: "/settings" },
  ];

  const handleCloseSidebar = () => {
    setIsOpen(false);
  };

  // Base classes for the sidebar
  const sidebarClasses = cn(
    "bg-gradient-to-r from-[hsl(270,80%,55%)] to-[hsl(210,80%,55%)] text-white w-72 flex flex-col",
    isOpen ? "fixed inset-y-0 left-0 z-50" : "hidden md:flex md:flex-shrink-0"
  );

  return (
    <div className={sidebarClasses}>
      <div className="flex items-center justify-start h-auto py-6 px-6">
        <div className="flex flex-col items-start w-full">
          <img src={logoImg} alt="Restaurant AI Assistant Logo" className="w-20 h-auto mb-2" />
          <h1 className="text-xl font-bold mt-2 px-1 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            Restaurant AI Assistant
          </h1>
        </div>
      </div>

      <div className="flex flex-col flex-grow pt-5 pb-4 overflow-y-auto">
        <nav className="flex-1 px-2 space-y-1">
          {navigationItems.map((item) => {
            const isActive = location === item.path;
            const itemClasses = cn(
              "flex items-center px-2 py-3 text-sm font-medium rounded-md transition-colors",
              isActive 
                ? "bg-primary-light"
                : "hover:bg-primary-light"
            );

            return (
              <Link 
                key={item.path} 
                href={item.path} 
                className={itemClasses}
                onClick={handleCloseSidebar}
              >
                <i className={`${item.icon} text-lg mr-3`}></i>
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {user && (
        <div className="border-t border-primary-light">
          <div className="flex items-center p-4">
            <div className="flex-shrink-0">
              <div className="h-10 w-10 rounded-full bg-primary-light flex items-center justify-center">
                {user.avatar_url && !user.avatar_url.includes("images.app.goo.gl") ? (
                  <img 
                    className="h-10 w-10 rounded-full" 
                    src={user.avatar_url} 
                    alt={user.full_name || "User"}
                  />
                ) : (
                  <span className="text-xl">{user.full_name && user.full_name.charAt(0) || "U"}</span>
                )}
              </div>
            </div>
            <div className="ml-3 flex-grow">
              <p className="text-sm font-medium">{user.full_name || "User"}</p>
              <p className="text-xs text-gray-300">{user.username}</p>
            </div>
            <button 
              onClick={() => {
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
              }}
              className="text-sm text-gray-300 hover:text-white p-1 rounded-full"
              title="Logout"
            >
              <i className="ri-logout-box-line text-lg"></i>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}