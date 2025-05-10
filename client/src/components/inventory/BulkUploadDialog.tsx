import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, AlertTriangle, CheckCircle2, Upload, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { queryClient, apiRequest } from '@/lib/queryClient';

interface BulkUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BulkUploadDialog({ open, onOpenChange }: BulkUploadDialogProps) {
  const { toast } = useToast();
  const [csvData, setCsvData] = useState('');
  const [response, setResponse] = useState<{ imported?: number, errors?: string[] } | null>(null);
  
  const bulkUploadMutation = useMutation({
    mutationFn: async (data: string) => {
      const res = await apiRequest('POST', '/api/inventory/bulk-upload', { data });
      return await res.json();
    },
    onSuccess: (data) => {
      setResponse(data);
      toast({
        title: `${data.imported} items imported successfully`,
        description: data.errors && data.errors.length > 0 
          ? `There were ${data.errors.length} errors during import.` 
          : 'All items imported with no errors.',
        variant: data.errors && data.errors.length > 0 ? 'destructive' : 'default',
      });
      
      // Invalidate inventory queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ['/api/inventory'] });
      
      // Clear form only if there were no errors
      if (!data.errors || data.errors.length === 0) {
        setCsvData('');
      }
    },
    onError: (error) => {
      toast({
        title: 'Upload failed',
        description: 'There was an error processing the CSV data.',
        variant: 'destructive',
      });
    },
  });
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!csvData.trim()) {
      toast({
        title: 'No data provided',
        description: 'Please paste CSV data or use the example template.',
        variant: 'destructive',
      });
      return;
    }
    
    bulkUploadMutation.mutate(csvData);
  };
  
  const handleGenerateTemplate = () => {
    // Create a template with headers and sample data
    const template = `item_name,unit_of_measurement,box_or_package_qty,unit_price,ideal_qty,current_qty,shelf_life_days,category
Fresh Tomatoes,kg,1,$2.99,20,15,7,produce
Olive Oil,bottle,1,$8.50,10,8,365,dry_goods
Mozzarella Cheese,kg,1,$7.25,5,3,14,dairy`;
    
    setCsvData(template);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>Bulk Upload Inventory Items</DialogTitle>
          <DialogDescription>
            Paste CSV data with headers to import multiple inventory items at once. Each row represents one item.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="flex justify-between items-center mb-2">
            <Button 
              type="button" 
              variant="outline" 
              size="sm"
              onClick={handleGenerateTemplate}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Use Example Template
            </Button>
          </div>
          
          <Textarea
            placeholder="item_name,unit_of_measurement,box_or_package_qty,unit_price,ideal_qty,current_qty,shelf_life_days,category"
            className="h-[200px] font-mono text-sm"
            value={csvData}
            onChange={(e) => setCsvData(e.target.value)}
          />
          
          <div className="text-xs text-muted-foreground">
            <p className="font-semibold mb-1">Required columns:</p>
            <p>- item_name: The name of the inventory item</p>
            <p>- unit_of_measurement: Unit (kg, liter, piece, box, etc.)</p>
            <p>- box_or_package_qty: Quantity per package (numeric)</p>
            <p>- unit_price: Price per unit (numeric, with or without $)</p>
            <p>- ideal_qty: Target stock level (numeric)</p>
            <p>- current_qty: Current stock level (numeric)</p>
            <p className="font-semibold mt-1 mb-1">Optional columns:</p>
            <p>- shelf_life_days: Shelf life in days (numeric)</p>
            <p>- category: Category (produce, dairy, meat, etc.)</p>
          </div>
          
          {response && (
            <Alert variant={response.errors && response.errors.length > 0 ? 'destructive' : 'default'}>
              {response.errors && response.errors.length > 0 ? (
                <AlertTriangle className="h-4 w-4" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              <AlertTitle>
                {response.errors && response.errors.length > 0
                  ? 'Import completed with errors'
                  : 'Import successful'}
              </AlertTitle>
              <AlertDescription>
                <p>{`Successfully imported: ${response.imported || 0} items`}</p>
                {response.errors && response.errors.length > 0 && (
                  <div className="mt-2">
                    <p>Errors ({response.errors.length}):</p>
                    <div className="max-h-[100px] overflow-y-auto text-xs bg-background/50 p-2 rounded mt-1">
                      {response.errors.map((error, i) => (
                        <p key={i}>{error}</p>
                      ))}
                    </div>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}
          
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={bulkUploadMutation.isPending || !csvData.trim()}
              className="flex items-center gap-2"
            >
              {bulkUploadMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              Upload Inventory Data
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}