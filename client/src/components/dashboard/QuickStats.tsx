import { useQuery } from "@tanstack/react-query";
import type { DashboardStats } from "@shared/schema";
import { StatCard } from "@/components/ui/statCard";
import { Skeleton } from "@/components/ui/skeleton";

export function QuickStats() {
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ['/api/dashboard/stats'],
  });
  
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    );
  }
  
  if (!stats) {
    return (
      <div className="bg-white p-6 rounded-lg shadow mb-8">
        <p className="text-center text-neutral-500">No dashboard stats available</p>
      </div>
    );
  }
  
  const statsCards = [
    {
      icon: "ri-customer-service-2-line",
      iconBgColor: "bg-secondary-light",
      title: "Calls Handled Today",
      value: stats.callsHandledToday || 0,
      footer: (
        <>
          <i className="ri-arrow-up-line"></i> 12% from yesterday
        </>
      ),
      footerLink: {
        text: "View",
        href: "/calls"
      }
    },
    {
      icon: "ri-message-3-line",
      iconBgColor: "bg-accent-light",
      title: "Active Chats",
      value: stats.activeChats || 0,
      footer: (
        <>
          <span className="inline-block w-2 h-2 bg-accent rounded-full animate-pulse mr-1"></span>
          2 need attention
        </>
      ),
      footerLink: {
        text: "View",
        href: "/chats"
      }
    },
    {
      icon: "ri-calendar-check-line",
      iconBgColor: "bg-primary-light",
      title: "Today's Bookings",
      value: stats.todaysBookings || 0,
      footer: (
        <>
          <i className="ri-arrow-up-line"></i> 4 in last hour
        </>
      ),
      footerLink: {
        text: "View",
        href: "/bookings"
      }
    },
    {
      icon: "ri-shopping-cart-2-line",
      iconBgColor: "bg-secondary-light",
      title: "Orders Processed",
      value: stats.ordersProcessed || 0,
      footer: (
        <>{stats.ordersTotalValue || "$0"} total value</>
      ),
      footerLink: {
        text: "View",
        href: "/orders"
      }
    }
  ];
  
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
      {statsCards.map((card, index) => (
        <StatCard
          key={index}
          icon={card.icon}
          iconBgColor={card.iconBgColor}
          title={card.title}
          value={card.value}
          footer={card.footer}
          footerLink={card.footerLink}
        />
      ))}
    </div>
  );
}
