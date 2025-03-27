import { ReactNode } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";

export function AuthLayout({ children }: { children: ReactNode }) {
  const [, setLocation] = useLocation();
  
  // Check if user is already logged in
  const { data: user, isLoading } = useQuery({
    queryKey: ['/api/user'],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: false,
  });
  
  // If we have a user, redirect to dashboard
  if (!isLoading && user) {
    setLocation('/');
    return null;
  }
  
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}