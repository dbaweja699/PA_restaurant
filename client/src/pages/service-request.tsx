
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, CheckCircle } from "lucide-react";
import { format } from "date-fns";

// Define the form schema
const serviceRequestSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  email: z.string().email({ message: "Valid email is required" }),
  phone: z.string().optional(),
  requestType: z.enum(["issue", "change", "new_feature"], {
    required_error: "Please select a request type",
  }),
  priorityLevel: z.enum(["low", "medium", "high", "critical"], {
    required_error: "Please select a priority level",
  }),
  department: z.string().min(1, { message: "Department is required" }),
  description: z.string().min(10, { message: "Description should be at least 10 characters" }),
  preferredDate: z.date().optional(),
  attachFiles: z.boolean().default(false),
});

type ServiceRequestFormValues = z.infer<typeof serviceRequestSchema>;

export default function ServiceRequest() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm<ServiceRequestFormValues>({
    resolver: zodResolver(serviceRequestSchema),
    defaultValues: {
      requestType: "issue",
      priorityLevel: "medium",
      department: "",
      attachFiles: false,
    },
  });

  const onSubmit = async (data: ServiceRequestFormValues) => {
    setIsSubmitting(true);
    try {
      // Format the data for better readability when received by n8n
      const formattedData = {
        ...data,
        preferredDate: data.preferredDate ? format(data.preferredDate, "yyyy-MM-dd") : null,
        submittedAt: new Date().toISOString(),
      };
      
      // Use server-side API endpoint which will forward to n8n
      const response = await fetch('/api/proxy/service-request', {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formattedData),
      });
      
      if (!response.ok) {
        throw new Error("Failed to submit service request");
      }
      
      // Reset form and show success state
      form.reset();
      setIsSuccess(true);
      toast({
        title: "Service request submitted",
        description: "Your request has been received. We'll get back to you soon.",
      });
      
      // Reset success state after 3 seconds
      setTimeout(() => {
        setIsSuccess(false);
      }, 3000);
    } catch (error) {
      console.error("Error submitting service request:", error);
      toast({
        title: "Failed to submit request",
        description: error instanceof Error ? error.message : "Please try again later",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Request Service</h1>
        <p className="text-muted-foreground mt-2">
          Submit a service request for technical issues, changes, or new features
        </p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Service Request Form</CardTitle>
          <CardDescription>
            Please provide details about your request. Our team will respond based on the priority level.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isSuccess ? (
            <div className="flex flex-col items-center justify-center py-10">
              <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
              <h3 className="text-xl font-medium">Request Submitted Successfully!</h3>
              <p className="text-muted-foreground text-center mt-2">
                Thank you for your submission. Our team will review your request and get back to you shortly.
              </p>
              <Button 
                className="mt-6" 
                onClick={() => {
                  setIsSuccess(false);
                  form.reset();
                }}
              >
                Submit Another Request
              </Button>
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="department"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Department</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select department" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="kitchen">Kitchen</SelectItem>
                            <SelectItem value="front_of_house">Front of House</SelectItem>
                            <SelectItem value="management">Management</SelectItem>
                            <SelectItem value="bar">Bar</SelectItem>
                            <SelectItem value="admin">Administration</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input placeholder="you@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number (optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter phone number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="requestType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Request Type</FormLabel>
                      <div className="space-y-4">
                        <RadioGroup 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                          className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-6"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="issue" id="issue" />
                            <Label htmlFor="issue">Something is broken</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="change" id="change" />
                            <Label htmlFor="change">Request a change</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="new_feature" id="new_feature" />
                            <Label htmlFor="new_feature">New feature</Label>
                          </div>
                        </RadioGroup>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="priorityLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Priority Level</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select priority" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="low">Low - Not urgent</SelectItem>
                          <SelectItem value="medium">Medium - Normal priority</SelectItem>
                          <SelectItem value="high">High - Urgent</SelectItem>
                          <SelectItem value="critical">Critical - Business impacting</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="preferredDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Preferred Resolution Date (Optional)</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={`w-full pl-3 text-left font-normal ${
                                !field.value && "text-muted-foreground"
                              }`}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date < new Date(new Date().setHours(0, 0, 0, 0))
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Please describe your request in detail..." 
                          className="min-h-[120px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="pt-4">
                  <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
                    {isSubmitting ? "Submitting..." : "Submit Request"}
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
