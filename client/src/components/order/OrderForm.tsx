import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Mic, Plus, X } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

// Define the order item schema
const orderItemSchema = z.object({
  name: z.string().min(1, { message: "Item name is required" }),
  price: z.string().min(1, { message: "Price is required" }),
  quantity: z.coerce.number().min(1, { message: "Quantity must be at least 1" }),
});

// Define the order schema
const orderSchema = z.object({
  customerName: z.string().min(2, { message: "Customer name is required" }),
  type: z.enum(["delivery", "takeout", "dine-in"], {
    required_error: "Please select an order type",
  }),
  tableNumber: z.string().optional(),
  items: z.array(orderItemSchema).min(1, { message: "At least one item is required" }),
  total: z.string(),
  status: z.string().default("processing"),
  aiProcessed: z.boolean().default(false),
  callId: z.number().optional(),
});

type OrderItem = z.infer<typeof orderItemSchema>;
type OrderFormValues = z.infer<typeof orderSchema>;

interface OrderFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OrderForm({ open, onOpenChange }: OrderFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [orderItems, setOrderItems] = useState<OrderItem[]>([
    { name: "", price: "", quantity: 1 }
  ]);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState("");

  // Default values for the form
  const defaultValues: Partial<OrderFormValues> = {
    type: "dine-in",
    status: "processing",
    aiProcessed: false,
    items: [{ name: "", price: "", quantity: 1 }],
    total: "0.00",
    callId: undefined
  };

  const form = useForm<OrderFormValues>({
    resolver: zodResolver(orderSchema),
    defaultValues,
  });

  // Watch the type field to conditionally display table number field
  const orderType = form.watch("type");

  // Add new item to order
  const addOrderItem = () => {
    setOrderItems([...orderItems, { name: "", price: "", quantity: 1 }]);
  };

  // Remove item from order
  const removeOrderItem = (index: number) => {
    if (orderItems.length > 1) {
      const newItems = [...orderItems];
      newItems.splice(index, 1);
      setOrderItems(newItems);
      
      // Update form values
      const currentItems = form.getValues("items") || [];
      const newFormItems = [...currentItems];
      newFormItems.splice(index, 1);
      form.setValue("items", newFormItems);
      
      // Recalculate total
      calculateTotal(newFormItems);
    }
  };

  // Calculate order total
  const calculateTotal = (items: OrderItem[]) => {
    const total = items.reduce((sum, item) => {
      // Skip items with empty names
      if (!item.name.trim()) return sum;
      
      const price = parseFloat(item.price) || 0;
      const quantity = item.quantity || 0;
      return sum + (price * quantity);
    }, 0);
    
    // Format the total as currency with 2 decimal places
    const formattedTotal = total.toFixed(2);
    console.log(`Calculated total: $${formattedTotal} for ${items.length} items`);
    
    form.setValue("total", formattedTotal);
    return formattedTotal;
  };

  // Handle voice agent button click
  const handleVoiceAgent = () => {
    setIsVoiceActive(!isVoiceActive);
    
    if (!isVoiceActive) {
      // Demo implementation - in a real app, this would connect to the n8n webhook
      toast({
        title: "Voice Agent Activated",
        description: "This would connect to the n8n webhook for voice processing in the real implementation.",
      });
      
      // Simulate a voice transcription after a delay
      setTimeout(() => {
        const sampleOrder = "Add one margherita pizza, two garlic breads, and a large soda to the order.";
        setVoiceTranscript(sampleOrder);
        
        // Simulate order items being added
        const items = [
          { name: "Margherita Pizza", price: "12.99", quantity: 1 },
          { name: "Garlic Bread", price: "4.99", quantity: 2 },
          { name: "Large Soda", price: "2.99", quantity: 1 }
        ];
        
        setOrderItems(items);
        form.setValue("items", items);
        calculateTotal(items);
        
        setIsVoiceActive(false);
      }, 2000);
    }
  };

  // Create order mutation
  const mutation = useMutation({
    mutationFn: async (data: OrderFormValues) => {
      // Filter out any empty items
      const validItems = data.items.filter(item => item.name.trim() !== "");
      
      if (validItems.length === 0) {
        throw new Error("At least one item is required");
      }
      
      // Format the data to send to the server - ensure it matches the schema exactly
      const orderData = {
        customerName: data.customerName,
        type: `manual-${data.type.toLowerCase()}`, // Prefix with 'manual-' and ensure lowercase for consistency
        tableNumber: data.type === 'dine-in' ? data.tableNumber || null : null,
        items: validItems,
        total: data.total,
        status: "processing",
        aiProcessed: false,
        orderTime: new Date().toISOString(),
      };
      
      console.log("Submitting order data:", orderData);
      
      try {
        // Add a delay to help with potential race conditions
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Make the request with a longer timeout
        const response = await fetch('/api/orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(orderData),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error("Order creation failed:", errorData);
          throw new Error(errorData.message || errorData.error || "Failed to create order");
        }
        
        const responseData = await response.json();
        console.log("Server response:", responseData);
        return responseData;
      } catch (error) {
        console.error("Request error:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log("Order created successfully:", data);
      
      // Invalidate queries to refetch data
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      
      // Show success message and close the form
      toast({
        title: "Order Created",
        description: `Order #${data.id} has been successfully created.`,
        variant: "default",
      });
      
      // Send the order ID to the webhook
      if (data.id) {
        const webhookUrl = process.env.N8N_WEBHOOK_URL + "/order_made";
        try {
          fetch('/api/proxy/order-webhook', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              orderId: data.id,
              customerName: data.customerName || data.customer_name,
              orderTime: data.orderTime || data.order_time,
              total: data.total,
              items: data.items
            })
          })
          .then(response => {
            if (!response.ok) {
              console.error("Failed to send order to webhook:", response.statusText);
            } else {
              console.log("Order webhook notification sent successfully");
            }
          })
          .catch(error => {
            console.error("Error sending order to webhook:", error);
          });
        } catch (webhookError) {
          console.error("Error sending order to webhook:", webhookError);
        }
      }
      
      // Reset form and state
      form.reset(defaultValues);
      setOrderItems([{ name: "", price: "", quantity: 1 }]);
      setVoiceTranscript("");
      onOpenChange(false);
    },
    onError: (error) => {
      console.error("Order creation error:", error);
      toast({
        title: "Error Creating Order",
        description: error instanceof Error ? error.message : "Failed to create order",
        variant: "destructive",
      });
    },
  });

  function onSubmit(data: OrderFormValues) {
    // Validate customer name
    if (!data.customerName || data.customerName.trim() === "") {
      toast({
        title: "Validation Error",
        description: "Customer name is required",
        variant: "destructive",
      });
      return;
    }
    
    // Validate that at least one item is valid
    const validItems = orderItems.filter(item => item.name.trim() !== "");
    if (validItems.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please add at least one item to the order",
        variant: "destructive",
      });
      return;
    }
    
    // Make sure we have the latest items data
    data.items = orderItems;
    
    // Ensure total is properly calculated
    const updatedTotal = calculateTotal(orderItems);
    data.total = updatedTotal;
    
    console.log("Submitting order with data:", {
      ...data,
      items: validItems,
    });
    
    // Submit the order
    mutation.mutate({
      ...data,
      items: validItems
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create New Order</DialogTitle>
          <DialogDescription>
            Enter the details for the new customer order.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex items-center justify-end gap-2 mb-4">
          <Button
            type="button"
            size="sm"
            variant={isVoiceActive ? "default" : "outline"}
            onClick={handleVoiceAgent}
            className="flex items-center"
          >
            <Mic className="h-4 w-4 mr-2" />
            {isVoiceActive ? "Listening..." : "Voice Agent"}
          </Button>
        </div>
        
        {voiceTranscript && (
          <div className="mb-4 p-3 bg-muted/50 rounded-md text-sm">
            <p className="font-medium mb-1">Voice Transcript:</p>
            <p>{voiceTranscript}</p>
          </div>
        )}
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="customerName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Customer Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Smith" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Order Type</FormLabel>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="flex flex-row space-x-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="dine-in" id="dine-in" />
                      <Label htmlFor="dine-in">Dine-in</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="takeout" id="takeout" />
                      <Label htmlFor="takeout">Takeout</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="delivery" id="delivery" />
                      <Label htmlFor="delivery">Delivery</Label>
                    </div>
                  </RadioGroup>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {orderType === "dine-in" && (
              <FormField
                control={form.control}
                name="tableNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Table Number</FormLabel>
                    <FormControl>
                      <Input placeholder="Table 12" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            <div>
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-medium">Order Items</h3>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={addOrderItem}
                  className="h-8 px-2"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Item
                </Button>
              </div>
              
              <div className="space-y-2">
                {orderItems.map((item, index) => (
                  <div key={index} className="flex gap-2 items-start">
                    <div className="flex-1">
                      <Input
                        placeholder="Item name"
                        value={item.name}
                        onChange={(e) => {
                          const newItems = [...orderItems];
                          newItems[index].name = e.target.value;
                          setOrderItems(newItems);
                          form.setValue(`items.${index}.name`, e.target.value);
                        }}
                        aria-label="Item name"
                      />
                    </div>
                    <div className="w-20">
                      <Input
                        placeholder="Price"
                        value={item.price}
                        onChange={(e) => {
                          // Accept only numbers and decimal point
                          const value = e.target.value.replace(/[^0-9.]/g, '');
                          
                          const newItems = [...orderItems];
                          newItems[index].price = value;
                          setOrderItems(newItems);
                          form.setValue(`items.${index}.price`, value);
                          calculateTotal(newItems);
                        }}
                        aria-label="Item price"
                      />
                    </div>
                    <div className="w-16">
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => {
                          const quantity = parseInt(e.target.value) || 1;
                          const newItems = [...orderItems];
                          newItems[index].quantity = quantity;
                          setOrderItems(newItems);
                          form.setValue(`items.${index}.quantity`, quantity);
                          calculateTotal(newItems);
                        }}
                        onBlur={() => {
                          // Ensure minimum value of 1 when field loses focus
                          if (!orderItems[index].quantity || orderItems[index].quantity < 1) {
                            const newItems = [...orderItems];
                            newItems[index].quantity = 1;
                            setOrderItems(newItems);
                            form.setValue(`items.${index}.quantity`, 1);
                            calculateTotal(newItems);
                          }
                        }}
                        aria-label="Item quantity"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeOrderItem(index)}
                      className="h-9 w-9"
                      disabled={orderItems.length <= 1}
                      aria-label="Remove item"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex justify-end">
              <div className="w-32">
                <FormField
                  control={form.control}
                  name="total"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total</FormLabel>
                      <FormControl>
                        <Input readOnly {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? "Creating..." : "Create Order"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}