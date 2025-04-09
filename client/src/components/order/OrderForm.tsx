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
      const price = parseFloat(item.price) || 0;
      const quantity = item.quantity || 0;
      return sum + (price * quantity);
    }, 0);
    
    form.setValue("total", total.toFixed(2));
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
      
      // Format the data to send to the server
      const orderData = {
        ...data,
        items: validItems,
        orderTime: new Date().toISOString(),
      };
      
      const response = await apiRequest("POST", "/api/orders", orderData);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create order");
      }
      
      return await response.json();
    },
    onSuccess: () => {
      // Invalidate queries to refetch data
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      
      // Show success message and close the form
      toast({
        title: "Order Created",
        description: "The order has been successfully created.",
        variant: "default",
      });
      
      // Reset form and state
      form.reset(defaultValues);
      setOrderItems([{ name: "", price: "", quantity: 1 }]);
      setVoiceTranscript("");
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create order",
        variant: "destructive",
      });
    },
  });

  function onSubmit(data: OrderFormValues) {
    // Make sure we have the latest items data
    data.items = orderItems;
    mutation.mutate(data);
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
                      />
                    </div>
                    <div className="w-20">
                      <Input
                        placeholder="Price"
                        value={item.price}
                        onChange={(e) => {
                          const newItems = [...orderItems];
                          newItems[index].price = e.target.value;
                          setOrderItems(newItems);
                          form.setValue(`items.${index}.price`, e.target.value);
                          calculateTotal(newItems);
                        }}
                      />
                    </div>
                    <div className="w-16">
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => {
                          const newItems = [...orderItems];
                          newItems[index].quantity = parseInt(e.target.value) || 1;
                          setOrderItems(newItems);
                          form.setValue(`items.${index}.quantity`, parseInt(e.target.value) || 1);
                          calculateTotal(newItems);
                        }}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeOrderItem(index)}
                      className="h-9 w-9"
                      disabled={orderItems.length <= 1}
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