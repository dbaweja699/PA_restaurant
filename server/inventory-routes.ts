import { Request, Response } from 'express';
import { storage } from './storage';
import { z } from 'zod';

// Define schema for inventory item
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

// Define schema for bulk upload
const bulkUploadSchema = z.object({
  data: z.string().min(1, "CSV data is required"),
});

export function registerInventoryRoutes(app: any) {
  // Bulk upload inventory items
  app.post('/api/inventory/bulk-upload', async (req: Request, res: Response) => {
    try {
      const validationResult = bulkUploadSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ error: validationResult.error.format() });
      }

      const { data } = validationResult.data;
      const lines = data.trim().split('\n');
      
      // Parse headers
      const headers = lines[0].split(',');
      
      // Validate headers
      const requiredHeaders = ['item_name', 'unit_of_measurement', 'box_or_package_qty', 'unit_price', 'ideal_qty', 'current_qty'];
      const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
      
      if (missingHeaders.length > 0) {
        return res.status(400).json({ 
          error: `Missing required headers: ${missingHeaders.join(', ')}` 
        });
      }
      
      // Parse rows and create inventory items
      let importedCount = 0;
      const errors = [];
      
      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        
        const values = lines[i].split(',');
        const item = {};
        
        // Map CSV values to item properties
        headers.forEach((header, index) => {
          const value = values[index]?.trim();
          if (!value) return;
          
          switch (header) {
            case 'item_name':
              item.itemName = value;
              break;
            case 'unit_of_measurement':
              item.unitOfMeasurement = value;
              break;
            case 'box_or_package_qty':
              item.boxOrPackageQty = parseInt(value);
              break;
            case 'unit_price':
              item.unitPrice = value.startsWith('$') ? value : `$${value}`;
              break;
            case 'total_price':
              // Calculate if not provided
              if (!value) {
                const unitPrice = parseFloat((item.unitPrice || '0').replace('$', ''));
                const qty = item.boxOrPackageQty || 0;
                item.totalPrice = `$${(unitPrice * qty).toFixed(2)}`;
              } else {
                item.totalPrice = value.startsWith('$') ? value : `$${value}`;
              }
              break;
            case 'ideal_qty':
              item.idealQty = parseInt(value);
              break;
            case 'current_qty':
              item.currentQty = parseInt(value);
              break;
            case 'shelf_life_days':
              item.shelfLifeDays = value ? parseInt(value) : null;
              break;
            case 'category':
              item.category = value || null;
              break;
          }
        });
        
        // Calculate total_price if not provided
        if (!item.totalPrice) {
          const unitPrice = parseFloat((item.unitPrice || '0').replace('$', ''));
          const qty = item.boxOrPackageQty || 0;
          item.totalPrice = `$${(unitPrice * qty).toFixed(2)}`;
        }
        
        // Validate and create item
        try {
          const validItem = inventoryItemSchema.parse(item);
          await storage.createInventoryItem(validItem);
          importedCount++;
        } catch (error) {
          errors.push(`Row ${i}: ${error.message}`);
        }
      }
      
      res.status(200).json({
        imported: importedCount,
        errors: errors.length > 0 ? errors : undefined
      });
    } catch (error) {
      console.error('Error processing bulk upload:', error);
      res.status(500).json({ error: 'Failed to process bulk upload' });
    }
  });
}