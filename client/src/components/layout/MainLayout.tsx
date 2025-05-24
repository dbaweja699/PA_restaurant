import { ReactNode, useState } from "react";
import { Sidebar } from "./Sidebar";
import { TopNav } from "./TopNav";
import { Toaster } from "@/components/ui/toaster";
import { AlertNotification } from "@/components/notifications/AlertNotification";
import PwaPrompt from "@/components/notifications/PwaPrompt";

export function MainLayout({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      <div className="flex flex-col flex-1 overflow-hidden">
        <TopNav openSidebar={() => setSidebarOpen(true)} />

        <main className="flex-1 relative overflow-y-auto focus:outline-none bg-white dark:bg-gray-900">
          {children}
        </main>
        <AlertNotification />
        <PwaPrompt />
        <Toaster />
      </div>
    </div>
  );
}