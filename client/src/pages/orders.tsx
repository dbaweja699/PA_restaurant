import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { type Order } from "@shared/schema";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Table, 
  TableHeader, 
  TableRow, 
  TableHead, 
  TableBody, 
  TableCell 
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { ShoppingCart, Truck, Users, ChevronDown, ChevronUp, Plus, Mic, Phone, Check, X, MoreVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { OrderForm } from "@/components/order/OrderForm";

interface OrderItem {
  name: string;
  quantity: number;
  price: string;
}

function OrderDetailsRow({ order }: { order: Order }) {
  const [expanded, setExpanded] = useState(false);
  const [, setLocation] = useLocation();
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Status update mutation
  const updateStatusMutation = useMutation({
    mutationFn: async (newStatus: string) => {
      const response = await apiRequest("PATCH", `/api/orders/${order.id}`, { 
        status: newStatus 
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update order status");
      }
      
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Status Updated",
        description: "The order status has been successfully updated.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      setShowStatusDialog(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update status",
        variant: "destructive",
      });
    }
  });

  // Parse items based on format (could be array or object)
  const [items, setItems] = useState<OrderItem[]>([]);
  
  useEffect(() => {
    let parsedItems: OrderItem[] = [];
    
    if (order.items) {
      try {
        // Handle different item formats
        if (typeof order.items === 'object' && order.items !== null) {
          // Case 1: Complex object with original and formatted properties
          if (order.items.original && Array.isArray(order.items.original)) {
            parsedItems = order.items.original.map(item => ({
              name: item.name || item.item || '',
              quantity: item.quantity || item.qty || 1,
              price: item.price || ''
            }));
          }
          // Case 2: Array of items
          else if (Array.isArray(order.items)) {
            parsedItems = order.items.map(item => ({
              name: item.name || item.item || '',
              quantity: item.quantity || item.qty || 1,
              price: item.price || ''
            }));
          }
          // Case 3: Object with formatted property
          else if (order.items.formatted) {
            parsedItems = Object.entries(order.items.formatted).map(([name, quantity]) => ({
              name,
              quantity: typeof quantity === 'number' ? quantity : 1,
              price: ''
            }));
          }
          // Case 4: Simple object mapping names to quantities
          else if (!Array.isArray(order.items) && typeof order.items === 'object') {
            // Filter out non-object properties
            const entries = Object.entries(order.items).filter(
              ([key]) => !key.startsWith('_') && key !== 'original' && key !== 'formatted'
            );
            
            if (entries.length > 0) {
              parsedItems = entries.map(([name, quantity]) => ({
                name,
                quantity: typeof quantity === 'number' ? quantity : 1,
                price: ''
              }));
            }
          }
        }
        // Case 5: String representation of JSON
        else if (typeof order.items === 'string') {
          const itemsObj = JSON.parse(order.items);
          
          if (Array.isArray(itemsObj)) {
            // Handle array format
            parsedItems = itemsObj.map(item => ({
              name: item.name || item.item || '',
              quantity: item.quantity || item.qty || 1,
              price: item.price || ''
            }));
          } 
          // Handle format: {"Cheesy Garlic Bread": "3 slices x 1", ...}
          else if (typeof itemsObj === 'object') {
            parsedItems = Object.entries(itemsObj).map(([name, description]) => {
              // If description is something like "3 slices x 1"
              if (typeof description === 'string' && description.includes(' x ')) {
                const parts = description.split(' x ');
                const quantity = parseInt(parts[parts.length - 1]) || 1;
                return {
                  name: name,
                  quantity: quantity,
                  price: ''
                };
              }
              // If description is a simple number
              else if (typeof description === 'number') {
                return {
                  name: name,
                  quantity: description,
                  price: ''
                };
              }
              // If description is a string with numeric value (like "2")
              else if (typeof description === 'string' && !isNaN(parseInt(description))) {
                return {
                  name: name,
                  quantity: parseInt(description),
                  price: ''
                };
              }
              // For formats like "main size", "1 slice" - extract quantity if exists
              else if (typeof description === 'string') {
                // Check if it starts with a number followed by a space
                const match = description.match(/^(\d+)\s+/);
                if (match) {
                  return {
                    name: `${name} (${description})`,
                    quantity: parseInt(match[1]),
                    price: ''
                  };
                }
                // Otherwise, show the size/description and use quantity 1
                return {
                  name: `${name} (${description})`,
                  quantity: 1,
                  price: ''
                };
              }
              // Fallback for other formats
              return {
                name: name,
                quantity: 1,
                price: ''
              };
            });
          }
        }
      } catch (e) {
        console.error("Error parsing order items:", e, order.items);
        parsedItems = [];
      }
    }
    
    setItems(parsedItems);
  }, [order.items]);

  const getTypeIcon = () => {
    switch (order.type.toLowerCase()) {
      case "delivery":
        return <Truck className="h-4 w-4" />;
      case "takeout":
        return <ShoppingCart className="h-4 w-4" />;
      case "dine-in":
        return <Users className="h-4 w-4" />;
      default:
        return <ShoppingCart className="h-4 w-4" />;
    }
  };

  const getStatusColor = () => {
    switch (order.status.toLowerCase()) {
      case "processing":
        return "bg-blue-100 text-blue-800";
      case "confirmed":
        return "bg-green-100 text-green-800";
      case "ready":
        return "bg-yellow-100 text-yellow-800";
      case "completed":
        return "bg-neutral-100 text-neutral-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-neutral-100 text-neutral-800";
    }
  };

  return (
    <>
      <TableRow className="cursor-pointer hover:bg-neutral-50" onClick={() => setExpanded(!expanded)}>
        <TableCell>#{order.id}</TableCell>
        <TableCell>
          <div className="flex items-center">
            {getTypeIcon()}
            <span className="ml-2">{order.type}</span>
            {order.type === "dine-in" && order.tableNumber && (
              <span className="ml-1 text-xs text-muted-foreground">
                (Table {order.tableNumber})
              </span>
            )}
          </div>
        </TableCell>
        <TableCell>
          {order.orderTime ? format(new Date(order.orderTime), "MMM d, h:mm a") : '-'}
        </TableCell>
        <TableCell>{order.customerName}</TableCell>
        <TableCell>
          <Badge className={cn("font-normal", getStatusColor())}>
            {order.status}
          </Badge>
        </TableCell>
        <TableCell className="font-medium">{order.total}</TableCell>
        <TableCell className="text-right">
          <Button variant="ghost" size="sm" onClick={(e) => {
            e.stopPropagation();
            setExpanded(!expanded);
          }}>
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </TableCell>
      </TableRow>

      {expanded && (
        <TableRow className="bg-neutral-50">
          <TableCell colSpan={7} className="p-4">
            <div className="text-sm">
              <h4 className="font-medium mb-2">Order Items</h4>
              <ul className="space-y-1">
                {items.map((item: OrderItem, index: number) => (
                  <li key={index} className="flex justify-between">
                    <span>
                      {item.quantity}x {String(item.name)}
                    </span>
                    <span>{typeof item.price === 'string' ? item.price : ''}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-4 pt-2 border-t border-neutral-200 flex justify-between font-medium">
                <span>Total</span>
                <span>{order.total}</span>
              </div>

              <div className="mt-4 pt-2 border-t border-neutral-200">
                <h4 className="font-medium mb-2">Order Details</h4>
                {order.type === "dine-in" && order.tableNumber && (
                  <div className="flex justify-between mb-2">
                    <span className="text-neutral-600">Table Number</span>
                    <span className="font-medium">{order.tableNumber}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-neutral-600">AI Processed</span>
                  <Badge variant={order.aiProcessed ? "default" : "outline"} className="bg-accent">
                    {order.aiProcessed ? "Yes" : "No"}
                  </Badge>
                </div>
                
                {order.callId && (
                  <div className="flex justify-between mt-2">
                    <span className="text-neutral-600">Phone Order</span>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex items-center gap-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        setLocation(`/calls?id=${order.callId}`);
                      }}
                    >
                      <Phone className="h-3 w-3 mr-1" />
                      View Call
                    </Button>
                  </div>
                )}

                <div className="mt-4 flex justify-end space-x-2">
                  <Button variant="outline" size="sm">Edit Order</Button>
                  <Button size="sm" onClick={(e) => {
                    e.stopPropagation();
                    setShowStatusDialog(true);
                  }}>Update Status</Button>
                </div>
                
                {/* Status Update Dialog */}
                <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Update Order Status</DialogTitle>
                      <DialogDescription>
                        Change the status of order #{order.id} for {order.customerName}
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="grid gap-4 py-4">
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium">Select a new status</h4>
                        <div className="grid grid-cols-2 gap-2">
                          <Button 
                            variant={order.status === "processing" ? "default" : "outline"} 
                            size="sm"
                            className="justify-start"
                            onClick={() => updateStatusMutation.mutate("processing")}
                          >
                            <span className="h-2 w-2 mr-2 rounded-full bg-blue-500"></span>
                            Processing
                          </Button>
                          <Button 
                            variant={order.status === "confirmed" ? "default" : "outline"} 
                            size="sm"
                            className="justify-start"
                            onClick={() => updateStatusMutation.mutate("confirmed")}
                          >
                            <span className="h-2 w-2 mr-2 rounded-full bg-green-500"></span>
                            Confirmed
                          </Button>
                          <Button 
                            variant={order.status === "ready" ? "default" : "outline"} 
                            size="sm"
                            className="justify-start"
                            onClick={() => updateStatusMutation.mutate("ready")}
                          >
                            <span className="h-2 w-2 mr-2 rounded-full bg-yellow-500"></span>
                            Ready
                          </Button>
                          <Button 
                            variant={order.status === "completed" ? "default" : "outline"} 
                            size="sm"
                            className="justify-start"
                            onClick={() => updateStatusMutation.mutate("completed")}
                          >
                            <span className="h-2 w-2 mr-2 rounded-full bg-neutral-500"></span>
                            Completed
                          </Button>
                          <Button 
                            variant={order.status === "cancelled" ? "default" : "outline"} 
                            size="sm"
                            className="justify-start col-span-2"
                            onClick={() => updateStatusMutation.mutate("cancelled")}
                          >
                            <span className="h-2 w-2 mr-2 rounded-full bg-red-500"></span>
                            Cancelled
                          </Button>
                        </div>
                      </div>
                    </div>
                    
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowStatusDialog(false)}>
                        Cancel
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

export default function Orders() {
  const { data: orders, isLoading } = useQuery<Order[]>({ 
    queryKey: ['/api/orders'],
  });

  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showOrderForm, setShowOrderForm] = useState(false);

  if (isLoading) {
    return (
      <div className="py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>

        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  const filteredOrders = orders?.filter(order => {
    if (statusFilter === "all") return true;
    return order.status.toLowerCase() === statusFilter.toLowerCase();
  }) || [];

  // Count orders by status
  const orderCounts = {
    processing: orders?.filter(o => o.status.toLowerCase() === "processing").length || 0,
    confirmed: orders?.filter(o => o.status.toLowerCase() === "confirmed").length || 0,
    ready: orders?.filter(o => o.status.toLowerCase() === "ready").length || 0,
    completed: orders?.filter(o => o.status.toLowerCase() === "completed").length || 0
  };

  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-neutral-900">Orders</h1>
          <p className="mt-1 text-sm text-neutral-600">
            Track and manage orders processed by the AI assistant
          </p>
        </div>
        
        <div className="mt-4 md:mt-0 flex items-center space-x-2">
          <Button
            variant="default"
            size="sm"
            onClick={() => setShowOrderForm(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Order
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className={cn(
          "cursor-pointer hover:border-primary/50 transition-colors",
          statusFilter === "all" ? "border-primary" : ""
        )} onClick={() => setStatusFilter("all")}>
          <CardContent className="p-4 flex justify-between items-center">
            <div>
              <p className="text-sm text-neutral-500">All Orders</p>
              <p className="text-xl font-semibold">{orders?.length || 0}</p>
            </div>
            <ShoppingCart className="h-8 w-8 text-neutral-400" />
          </CardContent>
        </Card>

        <Card className={cn(
          "cursor-pointer hover:border-blue-400/50 transition-colors",
          statusFilter === "processing" ? "border-blue-400" : ""
        )} onClick={() => setStatusFilter("processing")}>
          <CardContent className="p-4 flex justify-between items-center">
            <div>
              <p className="text-sm text-neutral-500">Processing</p>
              <p className="text-xl font-semibold">{orderCounts.processing}</p>
            </div>
            <Badge className="bg-blue-100 text-blue-800">
              {orderCounts.processing}
            </Badge>
          </CardContent>
        </Card>

        <Card className={cn(
          "cursor-pointer hover:border-yellow-400/50 transition-colors",
          statusFilter === "ready" ? "border-yellow-400" : ""
        )} onClick={() => setStatusFilter("ready")}>
          <CardContent className="p-4 flex justify-between items-center">
            <div>
              <p className="text-sm text-neutral-500">Ready</p>
              <p className="text-xl font-semibold">{orderCounts.ready}</p>
            </div>
            <Badge className="bg-yellow-100 text-yellow-800">
              {orderCounts.ready}
            </Badge>
          </CardContent>
        </Card>

        <Card className={cn(
          "cursor-pointer hover:border-green-400/50 transition-colors",
          statusFilter === "completed" ? "border-green-400" : ""
        )} onClick={() => setStatusFilter("completed")}>
          <CardContent className="p-4 flex justify-between items-center">
            <div>
              <p className="text-sm text-neutral-500">Completed</p>
              <p className="text-xl font-semibold">{orderCounts.completed}</p>
            </div>
            <Badge className="bg-green-100 text-green-800">
              {orderCounts.completed}
            </Badge>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium flex items-center">
            <ShoppingCart className="mr-2 h-5 w-5" />
            Order Management
          </CardTitle>
          <CardDescription>
            {filteredOrders.length} orders {statusFilter !== "all" ? `with status "${statusFilter}"` : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredOrders.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-neutral-500">No orders matching the selected filter.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <OrderDetailsRow key={order.id} order={order} />
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      
      {/* Add Order Form */}
      <OrderForm
        open={showOrderForm}
        onOpenChange={setShowOrderForm}
      />
    </div>
  );
}