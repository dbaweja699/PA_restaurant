import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Package, AlertTriangle } from 'lucide-react';

export function InventoryStatsCard() {
  // Fetch all inventory items
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
    isLoading: isLoadingLowStock,
  } = useQuery({
    queryKey: ['/api/inventory/low-stock'],
    retry: 1,
  });

  if (isLoading || isLoadingLowStock) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium">Inventory Status</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center py-6">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium">Inventory Status</CardTitle>
        </CardHeader>
        <CardContent className="text-center py-6">
          <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Failed to load inventory data</p>
        </CardContent>
      </Card>
    );
  }

  // Calculate stats
  const totalItems = inventoryItems.length;
  const lowStockCount = lowStockItems.length;
  const criticalItems = lowStockItems.filter((item: any) => {
    const ratio = item.currentQty / item.idealQty;
    return ratio <= 0.25;
  }).length;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium flex items-center">
          <Package className="h-5 w-5 mr-2 text-green-600" />
          Inventory Status
        </CardTitle>
        <CardDescription>
          Inventory levels and stock warnings
        </CardDescription>
      </CardHeader>
      <CardContent className="py-4">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex flex-col">
            <span className="text-sm text-muted-foreground">Total Items</span>
            <span className="text-2xl font-bold">{totalItems}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm text-muted-foreground">Low Stock Items</span>
            <div className="flex items-center">
              <span className="text-2xl font-bold">{lowStockCount}</span>
              {lowStockCount > 0 && (
                <Badge variant="outline" className="ml-2 bg-orange-100 text-orange-800 border-orange-300">
                  Attention
                </Badge>
              )}
            </div>
          </div>
        </div>

        {criticalItems > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3 mt-2 flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0" />
            <p className="text-sm text-red-800">
              <span className="font-medium">{criticalItems}</span> items are at critically low levels and need immediate attention
            </p>
          </div>
        )}
      </CardContent>
      <CardFooter className="pt-0">
        <Link href="/inventory">
          <Button variant="outline" className="w-full">
            Manage Inventory
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}