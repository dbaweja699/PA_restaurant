import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Phone,
  MessageSquare,
  CalendarDays,
  ClipboardList,
  Star,
  CircleUserRound,
  UsersRound,
  Settings,
  ChevronDown,
  ChevronUp,
  PackageOpen,
  UtensilsCrossed,
  GlassWater,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function Sidebar() {
  const [location, setLocation] = useLocation();
  const [additionalOpen, setAdditionalOpen] = useState(false);

  const navigate = (path: string) => {
    setLocation(path);
  };

  const isActive = (path: string) => {
    // Special case for root path
    if (path === "/dashboard" && location === "/") {
      return true;
    }
    return location === path;
  };

  return (
    <div className="h-full py-8 flex flex-col overflow-hidden min-w-[250px]">
      <div className="px-6 mb-8">
        <h2 className="text-lg font-medium text-white tracking-wide md:text-2xl">
          Restaurant<span className="font-bold ml-1">AI</span>
        </h2>
        <p className="text-gray-500 text-[13px] -mt-1">AI-powered assistant</p>
      </div>

      <div className="flex flex-col space-y-1 px-2 flex-1 overflow-auto">
        <Button
          onClick={() => navigate("/dashboard")}
          variant="ghost"
          className={cn(
            "justify-start p-2 h-10 text-muted-foreground hover:text-white rounded-md hover:bg-accent transition-all",
            isActive("/dashboard") || isActive("/")
              ? "bg-accent/60 text-white"
              : ""
          )}
        >
          <LayoutDashboard className="h-5 w-5 mr-3" />
          Dashboard
        </Button>

        <Button
          onClick={() => navigate("/calls")}
          variant="ghost"
          className={cn(
            "justify-start p-2 h-10 text-muted-foreground hover:text-white rounded-md hover:bg-accent transition-all",
            isActive("/calls") ? "bg-accent/60 text-white" : ""
          )}
        >
          <Phone className="h-5 w-5 mr-3" />
          Calls
        </Button>

        <Button
          onClick={() => navigate("/chats")}
          variant="ghost"
          className={cn(
            "justify-start p-2 h-10 text-muted-foreground hover:text-white rounded-md hover:bg-accent transition-all",
            isActive("/chats") ? "bg-accent/60 text-white" : ""
          )}
        >
          <MessageSquare className="h-5 w-5 mr-3" />
          Chats
        </Button>

        <Button
          onClick={() => navigate("/bookings")}
          variant="ghost"
          className={cn(
            "justify-start p-2 h-10 text-muted-foreground hover:text-white rounded-md hover:bg-accent transition-all",
            isActive("/bookings") ? "bg-accent/60 text-white" : ""
          )}
        >
          <CalendarDays className="h-5 w-5 mr-3" />
          Bookings
        </Button>

        <Button
          onClick={() => navigate("/function-bookings")}
          variant="ghost"
          className={cn(
            "justify-start p-2 h-10 text-muted-foreground hover:text-white rounded-md hover:bg-accent transition-all",
            isActive("/function-bookings") ? "bg-accent/60 text-white" : ""
          )}
        >
          <GlassWater className="h-5 w-5 mr-3" />
          Functions
        </Button>

        <Button
          onClick={() => navigate("/orders")}
          variant="ghost"
          className={cn(
            "justify-start p-2 h-10 text-muted-foreground hover:text-white rounded-md hover:bg-accent transition-all",
            isActive("/orders") ? "bg-accent/60 text-white" : ""
          )}
        >
          <ClipboardList className="h-5 w-5 mr-3" />
          Orders
        </Button>

        <Button
          onClick={() => navigate("/reviews")}
          variant="ghost"
          className={cn(
            "justify-start p-2 h-10 text-muted-foreground hover:text-white rounded-md hover:bg-accent transition-all",
            isActive("/reviews") ? "bg-accent/60 text-white" : ""
          )}
        >
          <Star className="h-5 w-5 mr-3" />
          Reviews
        </Button>

        <Button
          onClick={() => navigate("/inventory")}
          variant="ghost"
          className={cn(
            "justify-start p-2 h-10 text-muted-foreground hover:text-white rounded-md hover:bg-accent transition-all",
            isActive("/inventory") ? "bg-accent/60 text-white" : ""
          )}
        >
          <PackageOpen className="h-5 w-5 mr-3" />
          Inventory
        </Button>

        <Button
          onClick={() => navigate("/recipes")}
          variant="ghost"
          className={cn(
            "justify-start p-2 h-10 text-muted-foreground hover:text-white rounded-md hover:bg-accent transition-all",
            isActive("/recipes") ? "bg-accent/60 text-white" : ""
          )}
        >
          <UtensilsCrossed className="h-5 w-5 mr-3" />
          Recipes
        </Button>

        <Button
          onClick={() => navigate("/social")}
          variant="ghost"
          className={cn(
            "justify-start p-2 h-10 text-muted-foreground hover:text-white rounded-md hover:bg-accent transition-all",
            isActive("/social") ? "bg-accent/60 text-white" : ""
          )}
        >
          <UsersRound className="h-5 w-5 mr-3" />
          Social
        </Button>

        <Button
          onClick={() => navigate("/gallery")}
          variant="ghost"
          className={cn(
            "justify-start p-2 h-10 text-muted-foreground hover:text-white rounded-md hover:bg-accent transition-all",
            isActive("/gallery") ? "bg-accent/60 text-white" : ""
          )}
        >
          <CircleUserRound className="h-5 w-5 mr-3" />
          Gallery
        </Button>

        <div className="pt-4">
          <Button
            variant="ghost"
            className="justify-start w-full p-2 h-9 text-sm text-muted-foreground hover:text-white rounded-md hover:bg-accent/50 transition-all"
            onClick={() => setAdditionalOpen(!additionalOpen)}
          >
            {additionalOpen ? (
              <ChevronUp className="h-4 w-4 mr-2" />
            ) : (
              <ChevronDown className="h-4 w-4 mr-2" />
            )}
            Additional
          </Button>
          {additionalOpen && (
            <div className="ml-4 mt-1 flex flex-col space-y-1">
              <Button
                onClick={() => navigate("/settings")}
                variant="ghost"
                className={cn(
                  "justify-start p-2 h-9 text-sm text-muted-foreground hover:text-white rounded-md hover:bg-accent/50 transition-all",
                  isActive("/settings") ? "bg-accent/40 text-white" : ""
                )}
              >
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}