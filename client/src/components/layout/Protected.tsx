
import { useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { type User } from "@shared/schema";
import { Loader2 } from "lucide-react";

export function Protected({ children }: { children: React.ReactNode }) {
  const [, setLocation] = useLocation();
  
  // Get the token from localStorage if available
  const authToken = localStorage.getItem('auth_token');
  
  const { data: user, isLoading, error } = useQuery<User>({ 
    queryKey: ['/api/user'],
    // Only enable the query if we have an auth token
    enabled: !!authToken,
    // Configure the request to include the auth token
    queryFn: async ({ queryKey }) => {
      const response = await fetch(queryKey[0] as string, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Not authenticated');
      }
      
      return response.json();
    }
  });

  useEffect(() => {
    // If not loading and either no user or error, redirect to signin
    if (!isLoading && (!user || error)) {
      // Clear localStorage if there was an auth error
      if (error) {
        localStorage.removeItem('auth_token');
      }
      setLocation('/signin');
    }
  }, [user, isLoading, error, setLocation]);

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}
