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
import { Loader2, Plus, AlertTriangle, Check, Package } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { queryClient, apiRequest } from '@/lib/queryClient';

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

// Define inventory form schema - extends the database schema with validation
const inventoryFormSchema = z.object({
  itemName: z.string().min(2, "Item name must be at least 2 characters"),
  unitOfMeasurement: z.string().min(1, "Unit of measurement is required"),
  boxOrPackageQty: z.coerce.number().min(1, "Quantity must be at least 1"),
  unitPrice: z.string().min(1, "Unit price is required"),
  totalPrice: z.string().min(1, "Total price is required"),
  idealQty: z.coerce.number().min(1, "Ideal quantity must be at least 1"),
  currentQty: z.coerce.number().default(0),
  shelfLifeDays: z.coerce.number().nullable().optional(),
  category: z.string().nullable().optional(),
});

// Schema for the delivery/stock update form
const stockUpdateSchema = z.object({
  quantityChange: z.coerce.number().min(1, "Quantity must be at least 1"),
  unitPrice: z.string().optional(),
  totalPrice: z.string().optional(),
});

type InventoryFormValues = z.infer<typeof inventoryFormSchema>;
type StockUpdateFormValues = z.infer<typeof stockUpdateSchema>;

// Component to show inventory stock status with appropriate color coding
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

// Main Inventory Management Page Component
export default function InventoryPage() {
  const { toast } = useToast();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<InventoryItem | null>(null);
  const [stockUpdateItem, setStockUpdateItem] = useState<InventoryItem | null>(null);
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

  // Mutation for creating a new inventory item
  const createItemMutation = useMutation({
    mutationFn: async (data: InventoryFormValues) => {
      const res = await apiRequest('POST', '/api/inventory', data);
      return await res.json();
    },
    onSuccess: () => {
      setAddDialogOpen(false);
      toast({
        title: "Item added",
        description: "Inventory item has been added successfully.",
      });
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['/api/inventory'] });
      queryClient.invalidateQueries({ queryKey: ['/api/inventory/low-stock'] });
    },
    onError: (error) => {
      toast({
        title: "Failed to add item",
        description: `${error}`,
        variant: "destructive",
      });
    },
  });

  // Mutation for updating an inventory item
  const updateItemMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: InventoryFormValues }) => {
      const res = await apiRequest('PATCH', `/api/inventory/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      setEditItem(null);
      toast({
        title: "Item updated",
        description: "Inventory item has been updated successfully.",
      });
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['/api/inventory'] });
      queryClient.invalidateQueries({ queryKey: ['/api/inventory/low-stock'] });
    },
    onError: (error) => {
      toast({
        title: "Failed to update item",
        description: `${error}`,
        variant: "destructive",
      });
    },
  });

  // Mutation for updating inventory stock
  const updateStockMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: StockUpdateFormValues }) => {
      const res = await apiRequest('PATCH', `/api/inventory/${id}/stock`, data);
      return await res.json();
    },
    onSuccess: () => {
      setStockUpdateItem(null);
      toast({
        title: "Stock updated",
        description: "Inventory stock has been updated successfully.",
      });
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['/api/inventory'] });
      queryClient.invalidateQueries({ queryKey: ['/api/inventory/low-stock'] });
    },
    onError: (error) => {
      toast({
        title: "Failed to update stock",
        description: `${error}`,
        variant: "destructive",
      });
    },
  });

  // Filter items based on active tab
  const displayItems = activeTab === 'low' ? lowStockItems : inventoryItems;

  // Forms
  const addForm = useForm<InventoryFormValues>({
    resolver: zodResolver(inventoryFormSchema),
    defaultValues: {
      itemName: '',
      unitOfMeasurement: '',
      boxOrPackageQty: 1,
      unitPrice: '',
      totalPrice: '',
      idealQty: 1,
      currentQty: 0,
      shelfLifeDays: null,
      category: null,
    },
  });

  const editForm = useForm<InventoryFormValues>({
    resolver: zodResolver(inventoryFormSchema),
    defaultValues: editItem ? {
      itemName: editItem.itemName,
      unitOfMeasurement: editItem.unitOfMeasurement,
      boxOrPackageQty: editItem.boxOrPackageQty,
      unitPrice: editItem.unitPrice,
      totalPrice: editItem.totalPrice,
      idealQty: editItem.idealQty,
      currentQty: editItem.currentQty,
      shelfLifeDays: editItem.shelfLifeDays || null,
      category: editItem.category || null,
    } : undefined,
  });

  const stockForm = useForm<StockUpdateFormValues>({
    resolver: zodResolver(stockUpdateSchema),
    defaultValues: {
      quantityChange: 1,
      unitPrice: stockUpdateItem?.unitPrice || '',
      totalPrice: stockUpdateItem?.totalPrice || '',
    },
  });

  // Reset form when editItem changes
  React.useEffect(() => {
    if (editItem) {
      editForm.reset({
        itemName: editItem.itemName,
        unitOfMeasurement: editItem.unitOfMeasurement,
        boxOrPackageQty: editItem.boxOrPackageQty,
        unitPrice: editItem.unitPrice,
        totalPrice: editItem.totalPrice,
        idealQty: editItem.idealQty,
        currentQty: editItem.currentQty,
        shelfLifeDays: editItem.shelfLifeDays || null,
        category: editItem.category || null,
      });
    }
  }, [editItem, editForm]);

  // Reset stock form when stockUpdateItem changes
  React.useEffect(() => {
    if (stockUpdateItem) {
      stockForm.reset({
        quantityChange: 1,
        unitPrice: stockUpdateItem.unitPrice,
        totalPrice: stockUpdateItem.totalPrice,
      });
    }
  }, [stockUpdateItem, stockForm]);

  // Handle form submissions
  const onAddSubmit = (data: InventoryFormValues) => {
    createItemMutation.mutate(data);
  };

  const onEditSubmit = (data: InventoryFormValues) => {
    if (editItem) {
      updateItemMutation.mutate({ id: editItem.id, data });
    }
  };

  const onStockUpdateSubmit = (data: StockUpdateFormValues) => {
    if (stockUpdateItem) {
      updateStockMutation.mutate({ id: stockUpdateItem.id, data });
    }
  };

  // Calculate and format dates
  const formatDate = (date: Date) => {
    const d = new Date(date);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString();
  };

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
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Item
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[550px]">
            <DialogHeader>
              <DialogTitle>Add Inventory Item</DialogTitle>
              <DialogDescription>
                Add a new item to your inventory. Fill out the details below.
              </DialogDescription>
            </DialogHeader>

            <Form {...addForm}>
              <form onSubmit={addForm.handleSubmit(onAddSubmit)} className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={addForm.control}
                    name="itemName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Item Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Tomato" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={addForm.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value || undefined}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="produce">Produce</SelectItem>
                            <SelectItem value="meat">Meat</SelectItem>
                            <SelectItem value="dairy">Dairy</SelectItem>
                            <SelectItem value="dry_goods">Dry Goods</SelectItem>
                            <SelectItem value="spices">Spices</SelectItem>
                            <SelectItem value="packaging">Packaging</SelectItem>
                            <SelectItem value="beverages">Beverages</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={addForm.control}
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
                            <SelectItem value="kg">Kilogram (kg)</SelectItem>
                            <SelectItem value="g">Gram (g)</SelectItem>
                            <SelectItem value="lb">Pound (lb)</SelectItem>
                            <SelectItem value="oz">Ounce (oz)</SelectItem>
                            <SelectItem value="l">Liter (l)</SelectItem>
                            <SelectItem value="ml">Milliliter (ml)</SelectItem>
                            <SelectItem value="piece">Piece</SelectItem>
                            <SelectItem value="box">Box</SelectItem>
                            <SelectItem value="case">Case</SelectItem>
                            <SelectItem value="bag">Bag</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={addForm.control}
                    name="boxOrPackageQty"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Qty per Box/Package</FormLabel>
                        <FormControl>
                          <Input type="number" min="1" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={addForm.control}
                    name="unitPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Unit Price</FormLabel>
                        <FormControl>
                          <Input placeholder="$0.00" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={addForm.control}
                    name="totalPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Total Price</FormLabel>
                        <FormControl>
                          <Input placeholder="$0.00" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={addForm.control}
                    name="idealQty"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ideal Qty</FormLabel>
                        <FormControl>
                          <Input type="number" min="1" {...field} />
                        </FormControl>
                        <FormDescription>Safe stock level</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={addForm.control}
                    name="currentQty"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Current Qty</FormLabel>
                        <FormControl>
                          <Input type="number" min="0" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={addForm.control}
                    name="shelfLifeDays"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Shelf Life (Days)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="1" 
                            placeholder="Optional"
                            value={field.value === null ? '' : field.value}
                            onChange={(e) => {
                              const value = e.target.value === '' ? null : parseInt(e.target.value);
                              field.onChange(value);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <DialogFooter>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setAddDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createItemMutation.isPending}>
                    {createItemMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Add Item
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="all" onValueChange={setActiveTab} className="mb-6">
        <TabsList>
          <TabsTrigger value="all" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            All Items
            <Badge variant="secondary" className="ml-1">
              {inventoryItems.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="low" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Low Stock
            <Badge variant="secondary" className="ml-1">
              {lowStockItems.length}
            </Badge>
          </TabsTrigger>
        </TabsList>
      </Tabs>

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
                    <TableCell>{formatDate(item.lastUpdated)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setStockUpdateItem(item)}
                            >
                              + Delivery
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Update Stock: {stockUpdateItem?.itemName}</DialogTitle>
                              <DialogDescription>
                                Add a delivery or update the current stock level
                              </DialogDescription>
                            </DialogHeader>

                            <Form {...stockForm}>
                              <form onSubmit={stockForm.handleSubmit(onStockUpdateSubmit)} className="space-y-4 py-4">
                                <FormField
                                  control={stockForm.control}
                                  name="quantityChange"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Quantity to Add</FormLabel>
                                      <FormControl>
                                        <Input type="number" min="1" {...field} />
                                      </FormControl>
                                      <FormDescription>
                                        Current quantity: {stockUpdateItem?.currentQty}
                                      </FormDescription>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />

                                <div className="grid grid-cols-2 gap-4">
                                  <FormField
                                    control={stockForm.control}
                                    name="unitPrice"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>New Unit Price (Optional)</FormLabel>
                                        <FormControl>
                                          <Input placeholder="Leave blank to keep current" {...field} />
                                        </FormControl>
                                        <FormDescription>
                                          Current: {stockUpdateItem?.unitPrice}
                                        </FormDescription>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                  <FormField
                                    control={stockForm.control}
                                    name="totalPrice"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>New Total Price (Optional)</FormLabel>
                                        <FormControl>
                                          <Input placeholder="Leave blank to keep current" {...field} />
                                        </FormControl>
                                        <FormDescription>
                                          Current: {stockUpdateItem?.totalPrice}
                                        </FormDescription>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                </div>

                                <DialogFooter>
                                  <Button 
                                    type="button" 
                                    variant="outline" 
                                    onClick={() => setStockUpdateItem(null)}
                                  >
                                    Cancel
                                  </Button>
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

                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setEditItem(item)}
                        >
                          Edit
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

      {/* Edit Dialog */}
      <Dialog open={!!editItem} onOpenChange={(open) => !open && setEditItem(null)}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Edit Inventory Item</DialogTitle>
            <DialogDescription>
              Update the details of {editItem?.itemName}
            </DialogDescription>
          </DialogHeader>

          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
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
                <FormField
                  control={editForm.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value || undefined}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="produce">Produce</SelectItem>
                          <SelectItem value="meat">Meat</SelectItem>
                          <SelectItem value="dairy">Dairy</SelectItem>
                          <SelectItem value="dry_goods">Dry Goods</SelectItem>
                          <SelectItem value="spices">Spices</SelectItem>
                          <SelectItem value="packaging">Packaging</SelectItem>
                          <SelectItem value="beverages">Beverages</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
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
                          <SelectItem value="kg">Kilogram (kg)</SelectItem>
                          <SelectItem value="g">Gram (g)</SelectItem>
                          <SelectItem value="lb">Pound (lb)</SelectItem>
                          <SelectItem value="oz">Ounce (oz)</SelectItem>
                          <SelectItem value="l">Liter (l)</SelectItem>
                          <SelectItem value="ml">Milliliter (ml)</SelectItem>
                          <SelectItem value="piece">Piece</SelectItem>
                          <SelectItem value="box">Box</SelectItem>
                          <SelectItem value="case">Case</SelectItem>
                          <SelectItem value="bag">Bag</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="boxOrPackageQty"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Qty per Box/Package</FormLabel>
                      <FormControl>
                        <Input type="number" min="1" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="unitPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unit Price</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="totalPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total Price</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={editForm.control}
                  name="idealQty"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ideal Qty</FormLabel>
                      <FormControl>
                        <Input type="number" min="1" {...field} />
                      </FormControl>
                      <FormDescription>Safe stock level</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="currentQty"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current Qty</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="shelfLifeDays"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Shelf Life (Days)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="1" 
                          placeholder="Optional"
                          value={field.value === null ? '' : field.value}
                          onChange={(e) => {
                            const value = e.target.value === '' ? null : parseInt(e.target.value);
                            field.onChange(value);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setEditItem(null)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={updateItemMutation.isPending}>
                  {updateItemMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Save Changes
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}