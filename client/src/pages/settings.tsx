import React, { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { type User } from "@shared/schema";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription,
  CardFooter
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Settings as SettingsIcon,
  Sliders,
  MessageSquare,
  Bell,
  Users,
  Globe,
  Lock,
  Save,
  Loader2
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Settings form with unsaved changes warning
function SettingsForm({
  title,
  description,
  children,
  onSave,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  onSave?: () => Promise<void>;
}) {
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  
  const handleInputChange = () => {
    setHasChanges(true);
  };
  
  const handleSave = async () => {
    if (onSave) {
      setIsSaving(true);
      try {
        await onSave();
        setHasChanges(false);
        toast({
          title: "Changes saved",
          description: "Your changes have been saved successfully.",
        });
      } catch (error) {
        toast({
          title: "Error saving changes",
          description: error instanceof Error ? error.message : "An unknown error occurred",
          variant: "destructive",
        });
      } finally {
        setIsSaving(false);
      }
    } else {
      // No save handler provided, just reset state
      setHasChanges(false);
      toast({
        title: "Changes saved",
        description: "Your changes have been saved successfully.",
      });
    }
  };
  
  // Add onChange event to all children
  const childrenWithProps = React.Children.map(children, child => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child, {
        onChange: () => handleInputChange(),
      });
    }
    return child;
  });
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent onChange={handleInputChange}>
        {childrenWithProps}
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button 
          disabled={!hasChanges || isSaving}
          onClick={handleSave}
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}

export default function Settings() {
  // Fetch user data
  const { data: user, isLoading, error } = useQuery<User>({ 
    queryKey: ['/api/user'],
  });
  
  // Refs for the input fields
  const fullNameRef = useRef<HTMLInputElement>(null);
  const usernameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  
  // User update mutation
  const updateUserMutation = useMutation({
    mutationFn: async (userData: Partial<{ username: string, email: string, full_name: string }>) => {
      const response = await apiRequest('PATCH', '/api/user', userData);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update user');
      }
      return response.json();
    },
    onSuccess: () => {
      // Invalidate the user query to refetch the data
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
    }
  });
  
  // Handler for saving user preferences
  const handleSaveUserPreferences = async () => {
    if (!user) return;
    
    const fullName = fullNameRef.current?.value || '';
    const username = usernameRef.current?.value || '';
    const email = emailRef.current?.value || '';
    
    const userData: Partial<{ username: string, email: string, full_name: string }> = {};
    
    // Only include changed fields
    if (fullName !== user.full_name) {
      userData.full_name = fullName;
    }
    
    if (username !== user.username) {
      userData.username = username;
    }
    
    if (user.email && email !== user.email) {
      userData.email = email;
    } else if (!user.email && email) {
      userData.email = email;
    }
    
    if (Object.keys(userData).length === 0) {
      throw new Error('No changes detected');
    }
    
    await updateUserMutation.mutateAsync(userData);
  };
  
  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (error) {
    console.error("Error loading user data:", error);
    return (
      <div className="py-6 px-4 text-red-500">
        Error loading user data. Please try refreshing the page.
      </div>
    );
  }
  
  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-display font-bold text-neutral-900">Settings</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Configure your restaurant's AI assistant preferences
        </p>
      </div>
      
      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid grid-cols-2 md:grid-cols-3 w-full">
          <TabsTrigger value="general" className="flex items-center">
            <SettingsIcon className="mr-2 h-4 w-4" />
            <span className="hidden md:inline">General</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center">
            <Bell className="mr-2 h-4 w-4" />
            <span className="hidden md:inline">Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="integrations" className="flex items-center">
            <Globe className="mr-2 h-4 w-4" />
            <span className="hidden md:inline">Integrations</span>
          </TabsTrigger>
        </TabsList>
        
        {/* General Settings */}
        <TabsContent value="general">
          <div className="grid gap-6">
            <RestaurantProfileForm />
            
            <SettingsForm 
              title="User Preferences" 
              description="Update your account settings"
              onSave={handleSaveUserPreferences}
            >
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input 
                    id="name" 
                    ref={fullNameRef}
                    defaultValue={user?.full_name || ""} 
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="username">Username</Label>
                  <Input 
                    id="username" 
                    ref={usernameRef}
                    defaultValue={user?.username || ""} 
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="email-user">Email</Label>
                  <Input 
                    id="email-user" 
                    type="email" 
                    ref={emailRef}
                    defaultValue={user?.email || ""} 
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="role">Role</Label>
                    <Select defaultValue={user?.role || "user"} disabled>
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="agent">Agent</SelectItem>
                        <SelectItem value="user">User</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-neutral-500">Role changes require administrator approval</p>
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="language">Preferred Language</Label>
                    <Select defaultValue="en">
                      <SelectTrigger>
                        <SelectValue placeholder="Select language" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="es">Spanish</SelectItem>
                        <SelectItem value="fr">French</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </SettingsForm>
          </div>
        </TabsContent>
        
        
        
        {/* Notifications Settings */}
        <TabsContent value="notifications">
          <SettingsForm 
            title="Notification Preferences" 
            description="Configure when and how you receive alerts"
          >
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Notification Channels</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <Label 
                      htmlFor="email-notifications" 
                      className="mb-1"
                    >
                      Email Notifications
                    </Label>
                    <span className="text-sm text-neutral-500">
                      Receive updates via email
                    </span>
                  </div>
                  <Switch id="email-notifications" defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <Label 
                      htmlFor="sms-notifications" 
                      className="mb-1"
                    >
                      SMS Notifications
                    </Label>
                    <span className="text-sm text-neutral-500">
                      Receive updates via text
                    </span>
                  </div>
                  <Switch id="sms-notifications" defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <Label 
                      htmlFor="ai-call-answering" 
                      className="mb-1"
                    >
                      AI Call Answering
                    </Label>
                    <span className="text-sm text-neutral-500">
                      Let AI handle incoming calls
                    </span>
                  </div>
                  <Switch id="ai-call-answering" defaultChecked />
                </div>
              </div>
              
              <div className="pt-4 border-t">
                <h3 className="text-sm font-medium mb-3">Alert Types</h3>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">New Bookings</h4>
                      <p className="text-sm text-neutral-500">Alert when new bookings are made</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Cancelled Bookings</h4>
                      <p className="text-sm text-neutral-500">Alert when bookings are cancelled</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Order Sound Alerts</h4>
                      <p className="text-sm text-neutral-500">Play distinct sound for new orders</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          const audio = new Audio('/sounds/alarm_clock.mp3');
                          audio.volume = 1.0;
                          audio.play().catch(err => {
                            console.error("Failed to play test sound:", err);
                          });
                        }}
                      >
                        Test Sound
                      </Button>
                      <Switch defaultChecked />
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Booking Sound Alerts</h4>
                      <p className="text-sm text-neutral-500">Play distinct sound for new bookings</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          const audio = new Audio('/sounds/alarm_clock.mp3');
                          audio.volume = 1.0;
                          audio.play().catch(err => {
                            console.error("Failed to play test sound:", err);
                          });
                        }}
                      >
                        Test Sound
                      </Button>
                      <Switch defaultChecked />
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">New Orders</h4>
                      <p className="text-sm text-neutral-500">Alert when new orders are placed</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Negative Reviews</h4>
                      <p className="text-sm text-neutral-500">Alert on reviews with rating &lt; 4</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">AI Handoffs</h4>
                      <p className="text-sm text-neutral-500">Alert when AI transfers to human agent</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>
              </div>
            </div>
          </SettingsForm>
        </TabsContent>
        
        {/* Integrations Settings */}
        <TabsContent value="integrations">
          <div className="grid gap-6">
            
            
            <Card>
              <CardHeader>
                <CardTitle>Third-Party Services</CardTitle>
                <CardDescription>Connect with external platforms and services</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center">
                      <i className="ri-facebook-circle-fill text-[#1877F2] text-3xl mr-3"></i>
                      <div>
                        <h4 className="font-medium">Facebook</h4>
                        <p className="text-sm text-neutral-500">
                          Manage messages and posts
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">Connect</Button>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center">
                      <i className="ri-instagram-fill text-[#E4405F] text-3xl mr-3"></i>
                      <div>
                        <h4 className="font-medium">Instagram</h4>
                        <p className="text-sm text-neutral-500">
                          Manage comments and DMs
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">Connect</Button>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center">
                      <i className="ri-yelp-fill text-[#FF1A1A] text-3xl mr-3"></i>
                      <div>
                        <h4 className="font-medium">Yelp</h4>
                        <p className="text-sm text-neutral-500">
                          Manage reviews and bookings
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">Connect</Button>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center">
                      <i className="ri-phone-fill text-[#0070f3] text-3xl mr-3"></i>
                      <div>
                        <h4 className="font-medium">VoIP Service</h4>
                        <p className="text-sm text-neutral-500">
                          Connect phone system
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">Connect</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        
      </Tabs>
    </div>
  );
}

// Restaurant Profile Form with state management and localStorage persistence
function RestaurantProfileForm() {
  // Initialize state with values from localStorage or defaults
  const [restaurantName, setRestaurantName] = useState(() => 
    localStorage.getItem('restaurantName') || "Fine Dining Restaurant"
  );
  const [address, setAddress] = useState(() => 
    localStorage.getItem('restaurantAddress') || "123 Main Street, City, State, ZIP"
  );
  const [phone, setPhone] = useState(() => 
    localStorage.getItem('restaurantPhone') || "+1 (555) 123-4567"
  );
  const [email, setEmail] = useState(() => 
    localStorage.getItem('restaurantEmail') || "contact@finedinigrestaurant.com"
  );
  const [hours, setHours] = useState(() => 
    localStorage.getItem('restaurantHours') || "Monday - Friday: 11:00 AM - 10:00 PM\nSaturday - Sunday: 10:00 AM - 11:00 PM"
  );
  
  // Form input refs
  const nameRef = useRef<HTMLInputElement>(null);
  const addressRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const hoursRef = useRef<HTMLTextAreaElement>(null);
  
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  
  const handleInputChange = () => {
    setHasChanges(true);
  };
  
  const handleSave = () => {
    setIsSaving(true);
    
    // Get current values from refs
    const newName = nameRef.current?.value || restaurantName;
    const newAddress = addressRef.current?.value || address;
    const newPhone = phoneRef.current?.value || phone;
    const newEmail = emailRef.current?.value || email;
    const newHours = hoursRef.current?.value || hours;
    
    // Simulate API call with timeout
    setTimeout(() => {
      // Update state with new values
      setRestaurantName(newName);
      setAddress(newAddress);
      setPhone(newPhone);
      setEmail(newEmail);
      setHours(newHours);
      
      // Save to localStorage for persistence
      localStorage.setItem('restaurantName', newName);
      localStorage.setItem('restaurantAddress', newAddress);
      localStorage.setItem('restaurantPhone', newPhone);
      localStorage.setItem('restaurantEmail', newEmail);
      localStorage.setItem('restaurantHours', newHours);
      
      setHasChanges(false);
      setIsSaving(false);
      
      toast({
        title: "Changes saved",
        description: "Your restaurant profile has been updated successfully.",
      });
    }, 500);
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Restaurant Profile</CardTitle>
        <CardDescription>Update your restaurant information</CardDescription>
      </CardHeader>
      <CardContent onChange={handleInputChange}>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="restaurant-name">Restaurant Name</Label>
            <Input 
              id="restaurant-name" 
              ref={nameRef}
              defaultValue={restaurantName} 
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="address">Address</Label>
            <Input 
              id="address" 
              ref={addressRef}
              defaultValue={address} 
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input 
                id="phone" 
                ref={phoneRef}
                defaultValue={phone} 
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                ref={emailRef}
                defaultValue={email} 
              />
            </div>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="hours">Business Hours</Label>
            <Textarea 
              id="hours" 
              ref={hoursRef}
              defaultValue={hours} 
            />
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button 
          disabled={!hasChanges || isSaving}
          onClick={handleSave}
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}

// Checkbox component since it's not being imported
function Checkbox({ id }: { id: string }) {
  return (
    <div className="h-4 w-4 border border-neutral-300 rounded flex items-center justify-center">
      <input type="checkbox" id={id} className="opacity-0 absolute h-4 w-4" />
    </div>
  );
}
