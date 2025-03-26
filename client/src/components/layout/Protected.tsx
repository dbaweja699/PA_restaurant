
import { useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { type User } from "@shared/schema";

export function Protected({ children }: { children: React.ReactNode }) {
  const [, setLocation] = useLocation();
  const { data: user, isLoading } = useQuery<User>({ 
    queryKey: ['/api/user'],
  });

  useEffect(() => {
    if (!isLoading && !user) {
      setLocation('/signin');
    }
  }, [user, isLoading, setLocation]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}
