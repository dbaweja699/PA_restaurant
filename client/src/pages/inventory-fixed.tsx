import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Plus, AlertTriangle, Check, Package, Upload, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { BulkUploadDialog } from '@/components/inventory/BulkUploadDialog';

// Define the inventory item type
interface InventoryItem {
  id: number;
  itemName: string;
  unitOfMeasurement: string;
  boxOrPackageQty: number;
  unitPrice: string;
  totalPrice: string;
  idealQty: number;
  currentQty: number;
  shelfLifeDays: number | null;
  lastUpdated: Date;
  category: string | null;
}

// Define schema for form
const inventoryItemSchema = z.object({
  itemName: z.string().min(2, "Item name must be at least 2 characters"),
  unitOfMeasurement: z.string().min(1, "Unit is required"),
  boxOrPackageQty: z.coerce.number().min(1, "Quantity must be at least 1"),
  unitPrice: z.string().min(1, "Unit price is required"),
  totalPrice: z.string(),
  idealQty: z.coerce.number().min(1, "Ideal quantity must be at least 1"),
  currentQty: z.coerce.number().min(0, "Current quantity cannot be negative"),
  shelfLifeDays: z.coerce.number().min(1, "Shelf life must be at least 1 day").nullish(),
  category: z.string().nullable(),
});

// Schema for stock update form
const stockUpdateSchema = z.object({
  quantityChange: z.coerce.number().min(-1000).max(1000),
  unitPrice: z.string().optional(),
  reason: z.string().min(1, "Reason is required"),
});

type FormValues = z.infer<typeof inventoryItemSchema>;
type StockUpdateValues = z.infer<typeof stockUpdateSchema>;

// Format date utility
const formatDate = (date: Date) => {
  if (!date) return 'Not available';
  const d = new Date(date);
  return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

// Stock status component
const StockStatus = ({ current, ideal }: { current: number, ideal: number }) => {
  const ratio = current / ideal;
  
  if (ratio <= 0.25) {
    return (
      <Badge variant="destructive" className="flex items-center gap-1">
        <AlertTriangle className="w-3 h-3" />
        Critical
      </Badge>
    );
  } else if (ratio <= 0.5) {
    return (
      <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-300 flex items-center gap-1">
        Low
      </Badge>
    );
  } else {
    return (
      <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300 flex items-center gap-1">
        <Check className="w-3 h-3" />
        Good
      </Badge>
    );
  }
};

// Edit inventory dialog component
const EditInventoryDialog = ({ open, onOpenChange, item }) => {
  const { toast } = useToast();
  
  const form = useForm<FormValues>({
    resolver: zodResolver(inventoryItemSchema),
    defaultValues: item ? {
      itemName: item.itemName,
      unitOfMeasurement: item.unitOfMeasurement,
      boxOrPackageQty: item.boxOrPackageQty,
      unitPrice: item.unitPrice.replace('$', ''),
      totalPrice: item.totalPrice.replace('$', ''),
      idealQty: item.idealQty,
      currentQty: item.currentQty,
      shelfLifeDays: item.shelfLifeDays,
      category: item.category,
    } : undefined,
  });
  
  // Reset form when item changes
  React.useEffect(() => {
    if (item) {
      form.reset({
        itemName: item.itemName,
        unitOfMeasurement: item.unitOfMeasurement,
        boxOrPackageQty: item.boxOrPackageQty,
        unitPrice: item.unitPrice.replace('$', ''),
        totalPrice: item.totalPrice.replace('$', ''),
        idealQty: item.idealQty,
        currentQty: item.currentQty,
        shelfLifeDays: item.shelfLifeDays,
        category: item.category,
      });
    }
  }, [item, form]);
  
  // Calculate total price based on unit price and quantity
  const calculateTotalPrice = (unitPrice: string, qty: number) => {
    const price = parseFloat(unitPrice.replace('$', ''));
    if (!isNaN(price)) {
      return (price * qty).toFixed(2);
    }
    return '0.00';
  };
  
  // Update total price when unit price or quantity changes
  React.useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'unitPrice' || name === 'boxOrPackageQty') {
        form.setValue(
          'totalPrice', 
          calculateTotalPrice(
            value.unitPrice || '0', 
            value.boxOrPackageQty || 0
          )
        );
      }
    });
    
    return () => subscription.unsubscribe();
  }, [form]);
  
  const updateMutation = useMutation({
    mutationFn: async (data: FormValues & { id: number }) => {
      // Format currency values to include $
      const formattedData = {
        ...data,
        unitPrice: data.unitPrice.startsWith('$') ? data.unitPrice : `$${data.unitPrice}`,
        totalPrice: data.totalPrice.startsWith('$') ? data.totalPrice : `$${data.totalPrice}`,
      };
      
      const res = await apiRequest('PATCH', `/api/inventory/${data.id}`, formattedData);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Item updated",
        description: "Inventory item has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/inventory'] });
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: "Failed to update",
        description: "An error occurred while updating the inventory item.",
        variant: "destructive",
      });
    },
  });
  
  const onSubmit = (data: FormValues) => {
    if (item) {
      updateMutation.mutate({ ...data, id: item.id });
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Inventory Item</DialogTitle>
          <DialogDescription>
            Update the details for the selected inventory item.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="itemName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Item Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="unitOfMeasurement"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit of Measurement</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select unit" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="kg">kg</SelectItem>
                        <SelectItem value="liter">liter</SelectItem>
                        <SelectItem value="piece">piece</SelectItem>
                        <SelectItem value="box">box</SelectItem>
                        <SelectItem value="bag">bag</SelectItem>
                        <SelectItem value="bunch">bunch</SelectItem>
                        <SelectItem value="bottle">bottle</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="boxOrPackageQty"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Box/Package Quantity</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="unitPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit Price</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="0.00" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="totalPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total Price</FormLabel>
                    <FormControl>
                      <Input {...field} readOnly />
                    </FormControl>
                    <FormDescription>
                      Calculated from unit price and quantity
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="idealQty"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ideal Quantity</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormDescription>
                      Target stock level
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="currentQty"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Quantity</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormDescription>
                      Current stock level
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="shelfLifeDays"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Shelf Life (Days)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormDescription>
                      Leave empty if not applicable
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value || ''}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="produce">Produce</SelectItem>
                        <SelectItem value="dairy">Dairy</SelectItem>
                        <SelectItem value="meat">Meat</SelectItem>
                        <SelectItem value="seafood">Seafood</SelectItem>
                        <SelectItem value="dry_goods">Dry Goods</SelectItem>
                        <SelectItem value="spices">Spices</SelectItem>
                        <SelectItem value="beverages">Beverages</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <DialogFooter>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Update Item
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

// Stock update dialog component
const StockUpdateDialog = ({ open, onOpenChange, item }) => {
  const { toast } = useToast();
  
  const form = useForm<StockUpdateValues>({
    resolver: zodResolver(stockUpdateSchema),
    defaultValues: {
      quantityChange: 0,
      unitPrice: item?.unitPrice.replace('$', ''),
      reason: '',
    },
  });
  
  // Reset form when item changes
  React.useEffect(() => {
    if (item) {
      form.reset({
        quantityChange: 0,
        unitPrice: item.unitPrice.replace('$', ''),
        reason: '',
      });
    }
  }, [item, form]);
  
  const updateStockMutation = useMutation({
    mutationFn: async (data: StockUpdateValues & { id: number }) => {
      const formattedData = {
        quantityChange: data.quantityChange,
        unitPrice: data.unitPrice ? (data.unitPrice.startsWith('$') ? data.unitPrice : `$${data.unitPrice}`) : undefined,
        reason: data.reason,
      };
      
      const res = await apiRequest('PATCH', `/api/inventory/${data.id}/stock`, formattedData);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Stock updated",
        description: "Inventory stock has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/inventory'] });
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: "Failed to update stock",
        description: "An error occurred while updating the inventory stock.",
        variant: "destructive",
      });
    },
  });
  
  const onSubmit = (data: StockUpdateValues) => {
    if (item) {
      updateStockMutation.mutate({ ...data, id: item.id });
    }
  };
  
  if (!item) return null;
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Update Stock Quantity</DialogTitle>
          <DialogDescription>
            Update the stock level for {item?.itemName}.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-2 gap-4 py-4">
          <div className="text-sm">
            <div className="font-medium">Current Stock:</div>
            <div className="font-bold text-xl">{item?.currentQty} {item?.unitOfMeasurement}</div>
          </div>
          <div className="text-sm">
            <div className="font-medium">Ideal Stock:</div>
            <div className="font-bold text-xl">{item?.idealQty} {item?.unitOfMeasurement}</div>
          </div>
        </div>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="quantityChange"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantity Change</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormDescription>
                    Use positive numbers to add stock, negative to remove
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="unitPrice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Unit Price (optional)</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder={item?.unitPrice} />
                  </FormControl>
                  <FormDescription>
                    Leave blank to keep the current price
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason for Change</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="New shipment received" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter className="mt-4">
              <Button type="submit" disabled={updateStockMutation.isPending}>
                {updateStockMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Update Stock
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

// Main Inventory Management Page Component
export default function InventoryPage() {
  const { toast } = useToast();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<InventoryItem | null>(null);
  const [stockUpdateItem, setStockUpdateItem] = useState<InventoryItem | null>(null);
  const [bulkUploadOpen, setBulkUploadOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  
  // Fetch inventory items
  const {
    data: inventoryItems = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['/api/inventory'],
    retry: 1,
  });
  
  // Fetch low stock items
  const {
    data: lowStockItems = [],
  } = useQuery({
    queryKey: ['/api/inventory/low-stock'],
    retry: 1,
  });
  
  // Create inventory item mutation
  const createItemMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      // Format currency values to include $
      const formattedData = {
        ...data,
        unitPrice: data.unitPrice.startsWith('$') ? data.unitPrice : `$${data.unitPrice}`,
        totalPrice: data.totalPrice.startsWith('$') ? data.totalPrice : `$${data.totalPrice}`,
      };
      
      const res = await apiRequest('POST', '/api/inventory', formattedData);
      return await res.json();
    },
    onSuccess: () => {
      setAddDialogOpen(false);
      toast({
        title: "Item added",
        description: "New inventory item has been added successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/inventory'] });
    },
    onError: (error) => {
      toast({
        title: "Failed to add item",
        description: "An error occurred while adding the inventory item.",
        variant: "destructive",
      });
    },
  });
  
  // Form for adding new inventory item
  const form = useForm<FormValues>({
    resolver: zodResolver(inventoryItemSchema),
    defaultValues: {
      itemName: '',
      unitOfMeasurement: '',
      boxOrPackageQty: 1,
      unitPrice: '',
      totalPrice: '0.00',
      idealQty: 0,
      currentQty: 0,
      shelfLifeDays: null,
      category: null,
    },
  });
  
  // Calculate total price based on unit price and quantity
  const calculateTotalPrice = (unitPrice: string, qty: number) => {
    const price = parseFloat(unitPrice.replace('$', ''));
    if (!isNaN(price)) {
      return (price * qty).toFixed(2);
    }
    return '0.00';
  };
  
  // Update total price when unit price or quantity changes
  React.useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'unitPrice' || name === 'boxOrPackageQty') {
        form.setValue(
          'totalPrice', 
          calculateTotalPrice(
            value.unitPrice || '0', 
            value.boxOrPackageQty || 0
          )
        );
      }
    });
    
    return () => subscription.unsubscribe();
  }, [form]);
  
  const onSubmit = (data: FormValues) => {
    createItemMutation.mutate(data);
  };
  
  // Display items based on active tab
  const displayItems = activeTab === 'all' ? inventoryItems : lowStockItems;
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[600px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[600px]">
        <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-2xl font-bold mb-2">Error Loading Inventory</h2>
        <p className="text-muted-foreground mb-4">
          There was a problem loading the inventory data. Please try again later.
        </p>
        <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/inventory'] })}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inventory Management</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Manage your restaurant inventory and track stock levels
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Item
              </Button>
            </DialogTrigger>
            
            <Button 
              variant="outline" 
              className="flex items-center gap-2"
              onClick={() => setBulkUploadOpen(true)}
            >
              <Upload className="h-4 w-4" />
              Bulk Upload
            </Button>
            
            <DialogContent className="sm:max-w-[550px]">
              <DialogHeader>
                <DialogTitle>Add Inventory Item</DialogTitle>
                <DialogDescription>
                  Add a new item to your inventory. Fill out the details below.
                </DialogDescription>
              </DialogHeader>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                  <FormField
                    control={form.control}
                    name="itemName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Item Name</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Fresh Tomatoes" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="unitOfMeasurement"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Unit of Measurement</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select unit" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="kg">kg</SelectItem>
                              <SelectItem value="liter">liter</SelectItem>
                              <SelectItem value="piece">piece</SelectItem>
                              <SelectItem value="box">box</SelectItem>
                              <SelectItem value="bag">bag</SelectItem>
                              <SelectItem value="bunch">bunch</SelectItem>
                              <SelectItem value="bottle">bottle</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            The measurement unit for this item
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="boxOrPackageQty"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Box/Package Quantity</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormDescription>
                            Quantity per package
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="unitPrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Unit Price</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="3.50" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="totalPrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Total Price</FormLabel>
                          <FormControl>
                            <Input {...field} readOnly />
                          </FormControl>
                          <FormDescription>
                            Calculated from unit price and quantity
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="idealQty"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Ideal Quantity</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormDescription>
                            Target stock level
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="currentQty"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Current Quantity</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormDescription>
                            Current stock level
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="shelfLifeDays"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Shelf Life (Days)</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} value={field.value || ''} />
                          </FormControl>
                          <FormDescription>
                            Leave empty if not applicable
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value || ''}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="produce">Produce</SelectItem>
                              <SelectItem value="dairy">Dairy</SelectItem>
                              <SelectItem value="meat">Meat</SelectItem>
                              <SelectItem value="seafood">Seafood</SelectItem>
                              <SelectItem value="dry_goods">Dry Goods</SelectItem>
                              <SelectItem value="spices">Spices</SelectItem>
                              <SelectItem value="beverages">Beverages</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <DialogFooter>
                    <Button type="submit" disabled={createItemMutation.isPending}>
                      {createItemMutation.isPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Add Inventory Item
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        <div className="col-span-1 xl:col-span-3">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="all">All Items</TabsTrigger>
              <TabsTrigger value="low_stock">Low Stock</TabsTrigger>
            </TabsList>
            
            <Card>
              <CardHeader>
                <CardTitle>Inventory Items</CardTitle>
                <CardDescription>
                  {activeTab === 'all' 
                    ? 'All inventory items currently in stock'
                    : 'Items that are below their ideal stock levels'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableCaption>
                    {displayItems.length === 0 
                      ? 'No inventory items found'
                      : `Showing ${displayItems.length} inventory items`
                    }
                  </TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Unit/Pkg</TableHead>
                      <TableHead>Unit Price</TableHead>
                      <TableHead>Current Qty</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Updated</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displayItems.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center h-32">
                          {activeTab === 'all' ? (
                            <div className="flex flex-col items-center justify-center">
                              <Package className="h-12 w-12 text-muted-foreground mb-2" />
                              <p className="font-medium text-lg">No inventory items found</p>
                              <p className="text-muted-foreground mb-4">
                                Add your first inventory item to get started
                              </p>
                              <Button onClick={() => setAddDialogOpen(true)}>
                                Add First Item
                              </Button>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center">
                              <Check className="h-12 w-12 text-green-500 mb-2" />
                              <p className="font-medium text-lg">No low stock items</p>
                              <p className="text-muted-foreground">
                                All your inventory items are at adequate levels
                              </p>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ) : (
                      displayItems.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.itemName}</TableCell>
                          <TableCell>{item.category || 'Uncategorized'}</TableCell>
                          <TableCell>
                            {item.boxOrPackageQty} {item.unitOfMeasurement}
                          </TableCell>
                          <TableCell>{item.unitPrice}</TableCell>
                          <TableCell>
                            {item.currentQty}/{item.idealQty}
                          </TableCell>
                          <TableCell>
                            <StockStatus current={item.currentQty} ideal={item.idealQty} />
                          </TableCell>
                          <TableCell>
                            {formatDate(item.lastUpdated)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => setStockUpdateItem(item)}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => setEditItem(item)}
                              >
                                <Settings className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </Tabs>
        </div>
        
        <div className="col-span-1">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Inventory Stats</CardTitle>
              <CardDescription>
                Overview of your inventory health
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-1">
                    <div className="text-sm font-medium">Total Items</div>
                    <div className="text-sm font-bold">{inventoryItems.length}</div>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full">
                    <div 
                      className="h-2 bg-primary rounded-full" 
                      style={{ width: '100%' }} 
                    />
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between mb-1">
                    <div className="text-sm font-medium">Low Stock Items</div>
                    <div className="text-sm font-bold">{lowStockItems.length}</div>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full">
                    <div 
                      className="h-2 bg-orange-400 rounded-full" 
                      style={{ 
                        width: inventoryItems.length > 0 
                          ? `${(lowStockItems.length / inventoryItems.length) * 100}%` 
                          : '0%' 
                      }} 
                    />
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between mb-1">
                    <div className="text-sm font-medium">Critical Stock Items</div>
                    <div className="text-sm font-bold">
                      {lowStockItems.filter(item => item.currentQty / item.idealQty <= 0.25).length}
                    </div>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full">
                    <div 
                      className="h-2 bg-destructive rounded-full" 
                      style={{ 
                        width: inventoryItems.length > 0 
                          ? `${(lowStockItems.filter(item => item.currentQty / item.idealQty <= 0.25).length / inventoryItems.length) * 100}%` 
                          : '0%' 
                      }} 
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Category Breakdown</CardTitle>
              <CardDescription>
                Items by category
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Category breakdown logic will go here */}
                <div className="text-sm text-muted-foreground">
                  {inventoryItems.length === 0 ? (
                    <p className="text-center">No inventory items to categorize</p>
                  ) : (
                    <div className="space-y-2">
                      {['produce', 'dairy', 'meat', 'seafood', 'dry_goods', 'spices', 'beverages'].map(cat => {
                        const count = inventoryItems.filter(item => item.category === cat).length;
                        if (count === 0) return null;
                        
                        return (
                          <div key={cat}>
                            <div className="flex justify-between mb-1">
                              <div className="capitalize">{cat.replace('_', ' ')}</div>
                              <div className="font-medium">{count}</div>
                            </div>
                            <div className="h-2 bg-gray-200 rounded-full">
                              <div 
                                className="h-2 bg-primary rounded-full" 
                                style={{ width: `${(count / inventoryItems.length) * 100}%` }} 
                              />
                            </div>
                          </div>
                        );
                      })}
                      
                      {(() => {
                        const uncategorized = inventoryItems.filter(item => !item.category).length;
                        if (uncategorized === 0) return null;
                        
                        return (
                          <div>
                            <div className="flex justify-between mb-1">
                              <div>Uncategorized</div>
                              <div className="font-medium">{uncategorized}</div>
                            </div>
                            <div className="h-2 bg-gray-200 rounded-full">
                              <div 
                                className="h-2 bg-gray-500 rounded-full" 
                                style={{ width: `${(uncategorized / inventoryItems.length) * 100}%` }} 
                              />
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      <EditInventoryDialog
        open={!!editItem}
        onOpenChange={(open) => !open && setEditItem(null)}
        item={editItem}
      />
      
      <StockUpdateDialog
        open={!!stockUpdateItem}
        onOpenChange={(open) => !open && setStockUpdateItem(null)}
        item={stockUpdateItem}
      />
      
      <BulkUploadDialog
        open={bulkUploadOpen}
        onOpenChange={setBulkUploadOpen}
      />
    </div>
  );
}