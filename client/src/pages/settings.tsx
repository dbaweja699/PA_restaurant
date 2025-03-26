import { useState } from "react";
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
  Key,
  Bot,
  Users,
  Globe,
  Lock,
  Save
} from "lucide-react";

// Settings form with unsaved changes warning
function SettingsForm({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  const [hasChanges, setHasChanges] = useState(false);
  
  const handleInputChange = () => {
    setHasChanges(true);
  };
  
  const handleSave = () => {
    // Save changes
    setHasChanges(false);
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
          disabled={!hasChanges}
          onClick={handleSave}
        >
          <Save className="mr-2 h-4 w-4" />
          Save Changes
        </Button>
      </CardFooter>
    </Card>
  );
}

export default function Settings() {
  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-display font-bold text-neutral-900">Settings</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Configure your restaurant's AI assistant preferences
        </p>
      </div>
      
      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid grid-cols-2 md:grid-cols-5 w-full">
          <TabsTrigger value="general" className="flex items-center">
            <SettingsIcon className="mr-2 h-4 w-4" />
            <span className="hidden md:inline">General</span>
          </TabsTrigger>
          <TabsTrigger value="ai-behavior" className="flex items-center">
            <Bot className="mr-2 h-4 w-4" />
            <span className="hidden md:inline">AI Behavior</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center">
            <Bell className="mr-2 h-4 w-4" />
            <span className="hidden md:inline">Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="integrations" className="flex items-center">
            <Globe className="mr-2 h-4 w-4" />
            <span className="hidden md:inline">Integrations</span>
          </TabsTrigger>
          <TabsTrigger value="api" className="flex items-center">
            <Key className="mr-2 h-4 w-4" />
            <span className="hidden md:inline">API Settings</span>
          </TabsTrigger>
        </TabsList>
        
        {/* General Settings */}
        <TabsContent value="general">
          <div className="grid gap-6">
            <SettingsForm 
              title="Restaurant Profile" 
              description="Update your restaurant information"
            >
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="restaurant-name">Restaurant Name</Label>
                  <Input id="restaurant-name" defaultValue="Fine Dining Restaurant" />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="address">Address</Label>
                  <Input id="address" defaultValue="123 Main Street, City, State, ZIP" />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input id="phone" defaultValue="+1 (555) 123-4567" />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" defaultValue="contact@finedinigrestaurant.com" />
                  </div>
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="hours">Business Hours</Label>
                  <Textarea 
                    id="hours" 
                    defaultValue="Monday - Friday: 11:00 AM - 10:00 PM&#10;Saturday - Sunday: 10:00 AM - 11:00 PM" 
                  />
                </div>
              </div>
            </SettingsForm>
            
            <SettingsForm 
              title="User Preferences" 
              description="Update your account settings"
            >
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" defaultValue="Sam Wilson" />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="email-user">Email</Label>
                  <Input id="email-user" type="email" defaultValue="sam.wilson@example.com" />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="role">Role</Label>
                    <Select defaultValue="manager">
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="owner">Owner</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="staff">Staff</SelectItem>
                      </SelectContent>
                    </Select>
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
        
        {/* AI Behavior Settings */}
        <TabsContent value="ai-behavior">
          <div className="grid gap-6">
            <SettingsForm 
              title="AI Personality" 
              description="Configure how your AI assistant communicates"
            >
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="ai-name">AI Assistant Name</Label>
                  <Input id="ai-name" defaultValue="Dining Assistant" />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="ai-tone">Communication Tone</Label>
                  <Select defaultValue="professional">
                    <SelectTrigger>
                      <SelectValue placeholder="Select tone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="casual">Casual & Friendly</SelectItem>
                      <SelectItem value="formal">Formal</SelectItem>
                      <SelectItem value="luxury">Luxury & Upscale</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="greeting">Default Greeting</Label>
                  <Textarea 
                    id="greeting" 
                    defaultValue="Thank you for contacting Fine Dining Restaurant. How may I assist you today?"
                  />
                </div>
              </div>
            </SettingsForm>
            
            <SettingsForm 
              title="Response Settings" 
              description="Configure AI response behaviors"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Human Handoff Threshold</h4>
                    <p className="text-sm text-neutral-500">
                      When should the AI transfer to a human agent
                    </p>
                  </div>
                  <Select defaultValue="medium">
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Select level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="response-time">Maximum Response Time (seconds)</Label>
                  <Input id="response-time" type="number" defaultValue="10" />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <Label 
                      htmlFor="allow-booking-changes" 
                      className="mb-1"
                    >
                      Allow AI to Modify Bookings
                    </Label>
                    <span className="text-sm text-neutral-500">
                      Can the AI modify existing bookings
                    </span>
                  </div>
                  <Switch id="allow-booking-changes" defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <Label 
                      htmlFor="auto-respond-reviews" 
                      className="mb-1"
                    >
                      Auto-Respond to Reviews
                    </Label>
                    <span className="text-sm text-neutral-500">
                      Automatically respond to new reviews
                    </span>
                  </div>
                  <Switch id="auto-respond-reviews" defaultChecked />
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
            <SettingsForm 
              title="n8n Integration" 
              description="Configure integration with n8n automation"
            >
              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="n8n-url">n8n Webhook URL</Label>
                  <Input id="n8n-url" defaultValue="https://n8n.yourdomain.com/webhook/ai-restaurant" />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="n8n-api-key">API Key</Label>
                  <Input id="n8n-api-key" type="password" defaultValue="••••••••••••••••" />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <Label 
                      htmlFor="n8n-active" 
                      className="mb-1"
                    >
                      Active Connection
                    </Label>
                    <span className="text-sm text-neutral-500">
                      Enable/Disable n8n integration
                    </span>
                  </div>
                  <Switch id="n8n-active" defaultChecked />
                </div>
                
                <div className="pt-2">
                  <Button variant="outline">Test Connection</Button>
                </div>
              </div>
            </SettingsForm>
            
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
        
        {/* API Settings */}
        <TabsContent value="api">
          <SettingsForm 
            title="API Configuration" 
            description="Manage API access and authentication"
          >
            <div className="space-y-6">
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="api-key">Your API Key</Label>
                  <div className="flex">
                    <Input id="api-key" value="af8z7c9d3e5f1g2h6j4k8l9m" readOnly className="rounded-r-none" />
                    <Button className="rounded-l-none">Regenerate</Button>
                  </div>
                  <p className="text-xs text-neutral-500">
                    This key grants access to your restaurant's AI assistant API
                  </p>
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Webhook Configuration</h3>
                <div className="grid gap-2">
                  <Label htmlFor="webhook-url">Webhook URL</Label>
                  <Input id="webhook-url" placeholder="https://your-domain.com/webhook" />
                  <p className="text-xs text-neutral-500">
                    Event notifications will be sent to this URL
                  </p>
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Event Subscriptions</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="event-calls" />
                    <Label htmlFor="event-calls">Calls</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="event-chats" />
                    <Label htmlFor="event-chats">Chats</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="event-bookings" />
                    <Label htmlFor="event-bookings">Bookings</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="event-orders" />
                    <Label htmlFor="event-orders">Orders</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="event-reviews" />
                    <Label htmlFor="event-reviews">Reviews</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="event-social" />
                    <Label htmlFor="event-social">Social Media</Label>
                  </div>
                </div>
              </div>
              
              <div className="pt-2 border-t">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <Label 
                      htmlFor="api-access" 
                      className="mb-1"
                    >
                      API Access
                    </Label>
                    <span className="text-sm text-neutral-500">
                      Enable or disable API access
                    </span>
                  </div>
                  <Switch id="api-access" defaultChecked />
                </div>
              </div>
            </div>
          </SettingsForm>
        </TabsContent>
      </Tabs>
    </div>
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
