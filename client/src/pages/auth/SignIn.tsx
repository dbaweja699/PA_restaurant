import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import logoImg from "@/assets/prince-albert-logo.png";

export default function SignIn() {
  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Check if user is already logged in
  const { data: user } = useQuery({ 
    queryKey: ['/api/user'],
    retry: false,
    enabled: !!localStorage.getItem('auth_token')  // Only check if we have a token
  });
  
  useEffect(() => {
    if (user) {
      setLocation("/");
    }
  }, [user, setLocation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    
    if (!usernameOrEmail || !password) {
      setError("Please enter both username/email and password");
      setIsSubmitting(false);
      return;
    }
    
    try {
      // First, trim the username to handle any whitespace
      const trimmedUsername = usernameOrEmail.trim();
      
      // Authenticate with trimmed username
      const response = await fetch("/api/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          username: trimmedUsername,
          password 
        }),
      });

      if (response.ok) {
        const userData = await response.json();
        
        // Store user credentials for future requests
        localStorage.setItem('auth_token', userData.username || userData.id.toString());
        
        // Update React Query cache
        queryClient.setQueryData(['/api/user'], userData);
        
        toast({
          title: "Signed in successfully",
          description: `Welcome back, ${userData.full_name || userData.username}!`,
        });
        
        // Use window.location for a hard refresh to ensure all state is updated
        window.location.href = "/";
      } else {
        const data = await response.json();
        console.error("Sign in failed:", data);
        setError(data.error || "Invalid credentials");
      }
    } catch (err) {
      console.error("Sign in exception:", err);
      setError("Failed to sign in. Please check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-4xl flex overflow-hidden rounded-lg shadow-lg">
        {/* Left side - form */}
        <div className="w-full md:w-1/2 bg-white p-8">
          <div className="flex flex-col items-center mb-6">
            <div className="bg-black rounded-full p-3 mb-2">
              <img src={logoImg} alt="Prince Albert Hotel Gawler Logo" className="h-20 w-auto mb-0 mx-auto" />
            </div>
            <h1 className="text-2xl font-bold text-center bg-gradient-to-r from-black to-gray-700 bg-clip-text text-transparent">
              Prince Albert Hotel AI
            </h1>
          </div>
          
          <h2 className="text-xl font-medium text-center mb-6">Sign in to your account</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="usernameOrEmail">Username</Label>
              <Input
                id="usernameOrEmail"
                type="text"
                placeholder="Enter your username"
                value={usernameOrEmail}
                onChange={(e) => setUsernameOrEmail(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
            
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-md text-sm">
                {error}
              </div>
            )}
            
            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-black to-[#1a1a1a] hover:from-[#0a0a0a] hover:to-[#2a2a2a]" 
              disabled={isSubmitting}
            >
              {isSubmitting ? "Signing in..." : "Sign in"}
            </Button>
            
            <p className="text-sm text-center text-gray-600">
              Contact your administrator for credentials.
            </p>
          </form>
        </div>
        
        {/* Right side - hero */}
        <div className="hidden md:block md:w-1/2 bg-gradient-to-r from-black to-[#1a1a1a] p-8 text-white">
          <div className="h-full flex flex-col justify-center">
            <h2 className="text-3xl font-bold mb-4 text-white">Prince Albert Hotel Gawler</h2>
            <p className="mb-6 text-white/90">
              Your all-in-one AI solution for managing hotel operations, guest interactions, reviews, 
              bookings, and social media presence.
            </p>
            <ul className="space-y-2">
              <li className="flex items-center">
                <span className="mr-2">✓</span>
                Automated guest communication
              </li>
              <li className="flex items-center">
                <span className="mr-2">✓</span>
                AI-powered review responses
              </li>
              <li className="flex items-center">
                <span className="mr-2">✓</span>
                Smart room booking management
              </li>
              <li className="flex items-center">
                <span className="mr-2">✓</span>
                Hotel inventory and order tracking
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}