import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import logoImg from "@/assets/logo.png";

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
  const [location] = useLocation();
  const { data: user } = useQuery<UserResponse>({ 
    queryKey: ['/api/user'],
  });

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
    "bg-primary text-white w-64 flex flex-col",
    isOpen ? "fixed inset-y-0 left-0 z-50" : "hidden md:flex md:flex-shrink-0"
  );
  
  return (
    <div className={sidebarClasses}>
      <div className="flex items-center justify-center h-24 px-4 border-b border-primary-light">
        <div className="flex flex-col items-center">
          <img src={logoImg} alt="Dblytics Logo" className="h-14 w-14 mb-1" />
          <h1 className="text-sm font-display font-bold tracking-wide">
            <span className="text-white">Dblytics</span>
            <span className="block text-xs text-center text-gray-300">Restaurant AI Assistant</span>
          </h1>
        </div>
        
        {isOpen && (
          <button 
            className="md:hidden absolute right-4 text-white"
            onClick={handleCloseSidebar}
          >
            <i className="ri-close-line text-xl"></i>
          </button>
        )}
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
        <div className="flex items-center p-4 border-t border-primary-light">
          <div className="flex-shrink-0">
            <div className="h-10 w-10 rounded-full bg-primary-light flex items-center justify-center">
              {user.avatar_url ? (
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
          <div className="ml-3">
            <p className="text-sm font-medium">{user.full_name || "User"}</p>
            <p className="text-xs text-gray-300">{user.role || "Administrator"}</p>
          </div>
        </div>
      )}
    </div>
  );
}
