import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { type Order } from "@shared/schema";
import { useLocation } from "wouter";
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
import { format } from "date-fns";
import { ShoppingCart, Truck, Users, ChevronDown, ChevronUp, Plus, Mic, Phone } from "lucide-react";
import { cn } from "@/lib/utils";
import { OrderForm } from "@/components/order/OrderForm";

function OrderDetailsRow({ order }: { order: Order }) {
  const [expanded, setExpanded] = useState(false);
  const [, setLocation] = useLocation();

  // Parse items based on format (could be array or object)
  let items = [];
  if (order.items) {
    if (Array.isArray(order.items)) {
      items = order.items;
    } else if (typeof order.items === 'object') {
      // Handle object format like {"Paneer Butter Masala": 1, "Garlic Naan": 1}
      try {
        // If it's a string representation of JSON object
        const itemsObject = typeof order.items === 'string' 
          ? JSON.parse(order.items) 
          : order.items;
        
        items = Object.entries(itemsObject).map(([name, quantity]) => ({
          name,
          quantity,
          price: '' // We don't have individual prices in this format
        }));
      } catch (e) {
        console.error("Error parsing order items:", e);
        items = [];
      }
    }
  }

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
                {items.map((item: any, index: number) => (
                  <li key={index} className="flex justify-between">
                    <span>
                      {item.quantity}x {item.name}
                    </span>
                    <span>{item.price}</span>
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
                  <Button size="sm">Update Status</Button>
                </div>
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