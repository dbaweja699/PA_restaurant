import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import logoImg from "@assets/logoo.png";
import { useToast } from "@/hooks/use-toast";

export default function SignUp() {
  const { toast } = useToast();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [, setLocation] = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    
    try {
      // Use the snake_case field name for full_name to match the API expectations
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          username, 
          email,
          password, 
          full_name: fullName 
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        toast({
          title: "Account created successfully!",
          description: "Redirecting to login...",
        });
        setTimeout(() => {
          window.location.href = "/auth";
        }, 2000);
      } else {
        console.error("Signup error:", data);
        setError(data.error || "Failed to sign up");
      }
    } catch (err) {
      console.error("Signup exception:", err);
      setError("Failed to sign up. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-4xl flex overflow-hidden rounded-lg shadow-lg">
        {/* Left side - form */}
        <div className="w-full md:w-1/2 bg-white p-8">
          <div className="flex justify-center mb-6">
            <img src={logoImg} alt="Dblytics Logo" className="h-12 w-12" />
          </div>
          
          <h1 className="text-2xl font-bold text-center mb-6">Create your account</h1>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="Enter your full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
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
              className="w-full" 
              disabled={isSubmitting}
            >
              {isSubmitting ? "Creating Account..." : "Sign Up"}
            </Button>
            
            <p className="text-sm text-center text-gray-600">
              Already have an account?{" "}
              <a href="/auth" className="text-primary hover:underline">
                Sign In
              </a>
            </p>
          </form>
        </div>
        
        {/* Right side - hero */}
        <div className="hidden md:block md:w-1/2 bg-primary p-8 text-white">
          <div className="h-full flex flex-col justify-center">
            <h2 className="text-2xl font-bold mb-4">Restaurant AI Assistant</h2>
            <p className="mb-6">
              Your all-in-one AI solution for managing customer interactions, reviews, 
              orders, and social media presence. 
            </p>
            <ul className="space-y-2">
              <li className="flex items-center">
                <span className="mr-2">✓</span>
                Automated call and chat handling
              </li>
              <li className="flex items-center">
                <span className="mr-2">✓</span>
                AI-powered review responses
              </li>
              <li className="flex items-center">
                <span className="mr-2">✓</span>
                Smart booking management
              </li>
              <li className="flex items-center">
                <span className="mr-2">✓</span>
                Social media engagement tools
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}