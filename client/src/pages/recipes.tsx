import React, { useState, useEffect } from 'react';
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
  CardFooter,
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
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Loader2, 
  Plus, 
  UtensilsCrossed, 
  ShoppingBasket, 
  Settings, 
  Trash,
  Edit,
  FileText,
  DollarSign,
  Check,
  Package,
  AlertTriangle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { queryClient, apiRequest } from '@/lib/queryClient';

// Define interfaces for our data types
interface Recipe {
  id: number;
  dishName: string;
  orderType: string;
  description: string | null;
  sellingPrice: string | null;
  category: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

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

interface RecipeItem {
  id: number;
  recipeId: number;
  inventoryId: number;
  quantityRequired: string;
  unit: string;
}

interface RecipeItemWithDetails extends RecipeItem {
  inventoryItem: InventoryItem;
}

// Recipe Cost Estimate Component
const RecipeCostEstimate = ({ recipeItems }: { recipeItems: RecipeItemWithDetails[] }) => {
  // Calculate total cost
  const totalCost = recipeItems.reduce((sum, item) => {
    if (!item.inventoryItem?.unitPrice) return sum;
    
    try {
      const unitPrice = parseFloat(item.inventoryItem.unitPrice);
      const quantity = parseFloat(item.quantityRequired);
      
      if (isNaN(unitPrice) || isNaN(quantity)) return sum;
      
      return sum + (unitPrice * quantity);
    } catch (error) {
      console.error("Error calculating item cost:", error);
      return sum;
    }
  }, 0);
  
  return (
    <div className="bg-muted/50 p-3 rounded-md mt-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <DollarSign className="h-5 w-5 text-muted-foreground mr-2" />
          <span className="text-sm font-medium">Estimated Recipe Cost:</span>
        </div>
        <span className="text-sm font-bold">
          ${totalCost.toFixed(2)}
        </span>
      </div>
    </div>
  );
};

// Component to handle recipe ingredients display
const RecipeIngredients = ({ recipeId }: { recipeId: number }) => {
  // Direct fetch from API for recipe items
  const { data: recipeItems = [], isLoading } = useQuery<RecipeItemWithDetails[]>({
    queryKey: ['/api/recipes', recipeId, 'items'],
    enabled: !!recipeId,
  });

  useEffect(() => {
    console.log(`Fetched ${recipeItems.length} ingredients for recipe ID ${recipeId}:`, recipeItems);
  }, [recipeId, recipeItems]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-4">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (recipeItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <UtensilsCrossed className="h-12 w-12 text-muted-foreground mb-2" />
        <p className="text-center text-muted-foreground">
          No ingredients added yet. Add ingredients to complete the recipe.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="max-h-60 overflow-y-auto border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ingredient</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Unit</TableHead>
              <TableHead>Unit Price</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recipeItems.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">
                  {item.inventoryItem?.itemName || 
                    (item.inventoryId ? `Ingredient #${item.inventoryId}` : 'Unknown')}
                </TableCell>
                <TableCell>{item.quantityRequired}</TableCell>
                <TableCell>{item.unit}</TableCell>
                <TableCell>{item.inventoryItem?.unitPrice ? `$${item.inventoryItem.unitPrice}` : 'N/A'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      
      {/* Display cost estimate */}
      <RecipeCostEstimate recipeItems={recipeItems} />
    </div>
  );
};

// Define schema for recipe form
const recipeFormSchema = z.object({
  dishName: z.string().min(2, "Dish name must be at least 2 characters"),
  orderType: z.string().min(1, "Order type is required"),
  description: z.string().nullable().optional(),
  sellingPrice: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
  isActive: z.boolean().default(true),
});

// Schema for recipe item form
const recipeItemFormSchema = z.object({
  inventoryId: z.coerce.number().min(1, "You must select an ingredient"),
  quantityRequired: z.string().min(1, "Quantity is required"),
  unit: z.string().min(1, "Unit is required"),
});

type RecipeFormValues = z.infer<typeof recipeFormSchema>;
type RecipeItemFormValues = z.infer<typeof recipeItemFormSchema>;

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

// RecipeCostEstimate component is already defined at the top of the file
// This duplicate definition has been removed

// Recipe table component
const RecipeTable = ({ 
  recipes, 
  setSelectedRecipe,
  setEditRecipe,
  setAddDialogOpen,
  selectedRecipe
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recipe List</CardTitle>
        <CardDescription>
          All recipes in your Italian restaurant menu
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableCaption>
            {recipes.length === 0 
              ? 'No recipes found'
              : `Showing ${recipes.length} recipes`
            }
          </TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Dish Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Order Type</TableHead>
              <TableHead>Selling Price</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recipes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center h-32">
                  <div className="flex flex-col items-center justify-center">
                    <UtensilsCrossed className="h-12 w-12 text-muted-foreground mb-2" />
                    <p className="font-medium text-lg">No recipes found</p>
                    <p className="text-muted-foreground mb-4">
                      Add your first recipe to get started
                    </p>
                    <Button onClick={() => setAddDialogOpen(true)}>
                      Add First Recipe
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              recipes.map((recipe) => (
                <TableRow 
                  key={recipe.id} 
                  className={selectedRecipe?.id === recipe.id ? "bg-primary/5" : ""}
                  onClick={() => {
                    // Update selected recipe and data will auto-refetch due to queryKey change
                    setSelectedRecipe(recipe);
                  }}
                >
                  <TableCell className="font-medium">{recipe.dishName}</TableCell>
                  <TableCell>{recipe.category || 'Uncategorized'}</TableCell>
                  <TableCell>
                    {recipe.orderType === 'dine-in' || recipe.orderType === 'dine_in' ? (
                      <Badge variant="outline" className="bg-blue-50 text-blue-800 border-blue-300">
                        Dine In
                      </Badge>
                    ) : recipe.orderType === 'both' ? (
                      <Badge variant="outline" className="bg-purple-50 text-purple-800 border-purple-300">
                        Versatile
                      </Badge>
                    ) : recipe.orderType === 'takeaway' || recipe.orderType === 'takeout' ? (
                      <Badge variant="outline" className="bg-green-50 text-green-800 border-green-300">
                        Takeaway
                      </Badge>
                    ) : (
                      <Badge variant="outline">
                        {recipe.orderType || 'Unknown'}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>{recipe.sellingPrice || 'Not set'}</TableCell>
                  <TableCell>
                    {recipe.isActive ? (
                      <Badge variant="outline" className="bg-green-50 text-green-800 border-green-300">
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditRecipe(recipe);
                        setSelectedRecipe(recipe); // Set selected recipe to fetch items
                      }}
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default function RecipesPage() {
  const { toast } = useToast();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editRecipe, setEditRecipe] = useState<Recipe | null>(null);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [addIngredientDialogOpen, setAddIngredientDialogOpen] = useState(false);
  
  // Fetch recipes
  const {
    data: recipes = [],
    isLoading: isLoadingRecipes,
    error: recipesError,
  } = useQuery({
    queryKey: ['/api/recipes'],
    retry: 1,
  });
  
  // Fetch inventory items
  const {
    data: inventoryItems = [],
    isLoading: isLoadingInventory,
  } = useQuery({
    queryKey: ['/api/inventory'],
    retry: 1,
  });
  
  // We'll now use the RecipeIngredients component to handle item fetching
  
  // Create recipe mutation
  const createRecipeMutation = useMutation({
    mutationFn: async (data: RecipeFormValues) => {
      const res = await apiRequest('POST', '/api/recipes', data);
      return await res.json();
    },
    onSuccess: (data) => {
      setAddDialogOpen(false);
      toast({
        title: "Recipe created",
        description: "Recipe has been created successfully.",
      });
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['/api/recipes'] });
      // Select the newly created recipe
      setSelectedRecipe(data);
    },
    onError: (error) => {
      toast({
        title: "Failed to create recipe",
        description: `${error}`,
        variant: "destructive",
      });
    },
  });
  
  // Update recipe mutation
  const updateRecipeMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: RecipeFormValues }) => {
      const res = await apiRequest('PATCH', `/api/recipes/${id}`, data);
      return await res.json();
    },
    onSuccess: (data) => {
      setEditRecipe(null);
      toast({
        title: "Recipe updated",
        description: "Recipe has been updated successfully.",
      });
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['/api/recipes'] });
      // Update selected recipe if it's the one being edited
      if (selectedRecipe?.id === data.id) {
        setSelectedRecipe(data);
      }
    },
    onError: (error) => {
      toast({
        title: "Failed to update recipe",
        description: `${error}`,
        variant: "destructive",
      });
    },
  });
  
  // Add ingredient mutation
  const addIngredientMutation = useMutation({
    mutationFn: async (data: RecipeItemFormValues & { recipeId: number }) => {
      const res = await apiRequest('POST', `/api/recipes/${data.recipeId}/items`, data);
      return await res.json();
    },
    onSuccess: () => {
      setAddIngredientDialogOpen(false);
      toast({
        title: "Ingredient added",
        description: "Ingredient has been added to the recipe successfully.",
      });
      // Invalidate and refetch
      if (selectedRecipe) {
        queryClient.invalidateQueries({ 
          queryKey: ['/api/recipes', selectedRecipe.id, 'items'] 
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Failed to add ingredient",
        description: `${error}`,
        variant: "destructive",
      });
    },
  });
  
  // Forms
  const addRecipeForm = useForm<RecipeFormValues>({
    resolver: zodResolver(recipeFormSchema),
    defaultValues: {
      dishName: '',
      orderType: 'dine-in',
      description: '',
      sellingPrice: '',
      category: '',
      isActive: true,
    },
  });
  
  const editRecipeForm = useForm<RecipeFormValues>({
    resolver: zodResolver(recipeFormSchema),
    defaultValues: editRecipe ? {
      dishName: editRecipe.dishName,
      orderType: editRecipe.orderType,
      description: editRecipe.description || '',
      sellingPrice: editRecipe.sellingPrice || '',
      category: editRecipe.category || '',
      isActive: editRecipe.isActive,
    } : undefined,
  });
  
  const addIngredientForm = useForm<RecipeItemFormValues>({
    resolver: zodResolver(recipeItemFormSchema),
    defaultValues: {
      inventoryId: 0,
      quantityRequired: '',
      unit: '',
    },
  });
  
  // Reset edit form when editRecipe changes
  useEffect(() => {
    if (editRecipe) {
      editRecipeForm.reset({
        dishName: editRecipe.dishName,
        orderType: editRecipe.orderType,
        description: editRecipe.description || '',
        sellingPrice: editRecipe.sellingPrice || '',
        category: editRecipe.category || '',
        isActive: editRecipe.isActive,
      });
    }
  }, [editRecipe, editRecipeForm]);
  
  // Handle form submissions
  const onAddRecipeSubmit = (data: RecipeFormValues) => {
    createRecipeMutation.mutate(data);
  };
  
  const onEditRecipeSubmit = (data: RecipeFormValues) => {
    if (editRecipe) {
      updateRecipeMutation.mutate({ id: editRecipe.id, data });
    }
  };
  
  const onAddIngredientSubmit = (data: RecipeItemFormValues) => {
    if (selectedRecipe) {
      addIngredientMutation.mutate({ ...data, recipeId: selectedRecipe.id });
    }
  };
  
  if (isLoadingRecipes) {
    return (
      <div className="flex items-center justify-center h-[600px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (recipesError) {
    return (
      <div className="flex flex-col items-center justify-center h-[600px]">
        <UtensilsCrossed className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-2xl font-bold mb-2">Error Loading Recipes</h2>
        <p className="text-muted-foreground mb-4">
          There was a problem loading the recipe data. Please try again later.
        </p>
        <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/recipes'] })}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Recipe Management</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Create and manage recipes for your Italian restaurant menu
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Recipe
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px]">
              <DialogHeader>
                <DialogTitle>Add New Recipe</DialogTitle>
                <DialogDescription>
                  Create a new recipe for your menu. You can add ingredients after creating the basic recipe.
                </DialogDescription>
              </DialogHeader>
              <Form {...addRecipeForm}>
                <form onSubmit={addRecipeForm.handleSubmit(onAddRecipeSubmit)} className="space-y-4 py-4">
                  <FormField
                    control={addRecipeForm.control}
                    name="dishName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Dish Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Margherita Pizza" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={addRecipeForm.control}
                      name="orderType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Order Type</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select order type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="dine-in">Dine In</SelectItem>
                              <SelectItem value="takeaway">Takeaway</SelectItem>
                              <SelectItem value="both">Both</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Different packaging requirements for dine-in vs takeaway
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={addRecipeForm.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="antipasti">Antipasti</SelectItem>
                              <SelectItem value="pasta">Pasta</SelectItem>
                              <SelectItem value="pizza">Pizza</SelectItem>
                              <SelectItem value="risotto">Risotto</SelectItem>
                              <SelectItem value="secondi">Secondi</SelectItem>
                              <SelectItem value="dolci">Dolci</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={addRecipeForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Describe the dish"
                            className="resize-none"
                            {...field}
                            value={field.value || ''}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={addRecipeForm.control}
                    name="sellingPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Selling Price</FormLabel>
                        <FormControl>
                          <Input placeholder="$19.99" {...field} value={field.value || ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={addRecipeForm.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <input
                            type="checkbox"
                            checked={field.value}
                            onChange={field.onChange}
                            className="h-4 w-4 rounded border-gray-300 text-primary"
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Active</FormLabel>
                          <FormDescription>
                            Mark this recipe as active to include it in the menu
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />

                  <DialogFooter>
                    <Button type="submit" disabled={createRecipeMutation.isPending}>
                      {createRecipeMutation.isPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Create Recipe
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
          
          {/* Edit Recipe Dialog */}
          <Dialog open={!!editRecipe} onOpenChange={(open) => {
            if (!open) {
              setEditRecipe(null);
              // Only reset selectedRecipe if we clicked it through the settings button
              if (selectedRecipe && selectedRecipe.id === editRecipe?.id) {
                setSelectedRecipe(null);
              }
            }
          }}>
            <DialogContent className="sm:max-w-[550px]">
              <DialogHeader>
                <DialogTitle>Edit Recipe</DialogTitle>
                <DialogDescription>
                  Update the details for {editRecipe?.dishName}
                </DialogDescription>
              </DialogHeader>
              {editRecipe && (
                <Form {...editRecipeForm}>
                  <form onSubmit={editRecipeForm.handleSubmit(onEditRecipeSubmit)} className="space-y-4 py-4">
                    <FormField
                      control={editRecipeForm.control}
                      name="dishName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Dish Name</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={editRecipeForm.control}
                        name="orderType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Order Type</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select order type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="dine-in">Dine In</SelectItem>
                                <SelectItem value="takeaway">Takeaway</SelectItem>
                                <SelectItem value="both">Both</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={editRecipeForm.control}
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
                                <SelectItem value="antipasti">Antipasti</SelectItem>
                                <SelectItem value="pasta">Pasta</SelectItem>
                                <SelectItem value="pizza">Pizza</SelectItem>
                                <SelectItem value="risotto">Risotto</SelectItem>
                                <SelectItem value="secondi">Secondi</SelectItem>
                                <SelectItem value="dolci">Dolci</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={editRecipeForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea 
                              className="resize-none"
                              {...field}
                              value={field.value || ''}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={editRecipeForm.control}
                      name="sellingPrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Selling Price</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value || ''} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={editRecipeForm.control}
                      name="isActive"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <input
                              type="checkbox"
                              checked={field.value}
                              onChange={field.onChange}
                              className="h-4 w-4 rounded border-gray-300 text-primary"
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Active</FormLabel>
                            <FormDescription>
                              Mark this recipe as active to include it in the menu
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />

                    {/* Recipe ingredients section */}
                    <div className="border rounded-lg p-4 mt-4">
                      <h3 className="text-lg font-medium mb-2">Recipe Ingredients</h3>
                      {selectedRecipe && (
                        <RecipeIngredients recipeId={selectedRecipe.id} />
                      )}
                    </div>

                    <DialogFooter>
                      <Button type="submit" disabled={updateRecipeMutation.isPending}>
                        {updateRecipeMutation.isPending && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Save Changes
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              )}
            </DialogContent>
          </Dialog>
          
          {/* Add Ingredient Dialog */}
          <Dialog open={addIngredientDialogOpen} onOpenChange={setAddIngredientDialogOpen}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Add Ingredient</DialogTitle>
                <DialogDescription>
                  Add an ingredient to {selectedRecipe?.dishName}
                </DialogDescription>
              </DialogHeader>
              
              <Form {...addIngredientForm}>
                <form onSubmit={addIngredientForm.handleSubmit(onAddIngredientSubmit)} className="space-y-4 py-4">
                  <FormField
                    control={addIngredientForm.control}
                    name="inventoryId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ingredient</FormLabel>
                        <Select
                          onValueChange={(value) => field.onChange(parseInt(value))}
                          defaultValue={field.value ? field.value.toString() : undefined}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select an ingredient" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {inventoryItems.map((item) => (
                              <SelectItem key={item.id} value={item.id.toString()}>
                                {item.itemName} ({item.unitOfMeasurement})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={addIngredientForm.control}
                      name="quantityRequired"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Quantity</FormLabel>
                          <FormControl>
                            <Input type="text" placeholder="0.5" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={addIngredientForm.control}
                      name="unit"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Unit</FormLabel>
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
                              <SelectItem value="g">g</SelectItem>
                              <SelectItem value="liter">liter</SelectItem>
                              <SelectItem value="ml">ml</SelectItem>
                              <SelectItem value="bunch">bunch</SelectItem>
                              <SelectItem value="piece">piece</SelectItem>
                              <SelectItem value="unit">unit</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <DialogFooter>
                    <Button type="submit" disabled={addIngredientMutation.isPending}>
                      {addIngredientMutation.isPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Add Ingredient
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="space-y-6">
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="all">All Recipes</TabsTrigger>
            <TabsTrigger value="dine-in">Dine In</TabsTrigger>
            <TabsTrigger value="takeaway">Takeaway</TabsTrigger>
            <TabsTrigger value="both">Versatile</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all">
            <RecipeTable 
              recipes={recipes} 
              setSelectedRecipe={setSelectedRecipe}
              setEditRecipe={setEditRecipe}
              setAddDialogOpen={setAddDialogOpen}
              selectedRecipe={selectedRecipe}
            />
          </TabsContent>
          
          <TabsContent value="dine-in">
            <RecipeTable 
              recipes={recipes.filter(recipe => recipe.orderType === 'dine-in' || recipe.orderType === 'dine_in')} 
              setSelectedRecipe={setSelectedRecipe}
              setEditRecipe={setEditRecipe}
              setAddDialogOpen={setAddDialogOpen}
              selectedRecipe={selectedRecipe}
            />
          </TabsContent>
          
          <TabsContent value="takeaway">
            <RecipeTable 
              recipes={recipes.filter(recipe => recipe.orderType === 'takeaway' || recipe.orderType === 'takeout')} 
              setSelectedRecipe={setSelectedRecipe}
              setEditRecipe={setEditRecipe}
              setAddDialogOpen={setAddDialogOpen}
              selectedRecipe={selectedRecipe}
            />
          </TabsContent>
          
          <TabsContent value="both">
            <RecipeTable 
              recipes={recipes.filter(recipe => recipe.orderType === 'both')} 
              setSelectedRecipe={setSelectedRecipe}
              setEditRecipe={setEditRecipe}
              setAddDialogOpen={setAddDialogOpen}
              selectedRecipe={selectedRecipe}
            />
          </TabsContent>
        </Tabs>
        
        {selectedRecipe && (
          <Card className="mt-6">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-xl">Recipe Details: {selectedRecipe.dishName}</CardTitle>
                  <CardDescription>
                    View and manage ingredients for this recipe
                  </CardDescription>
                </div>
                <Button
                  size="sm"
                  onClick={() => setAddIngredientDialogOpen(true)}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Ingredient
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {!selectedRecipe ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <RecipeIngredients recipeId={selectedRecipe.id} />
              )}
              
              {/* Cost estimate is now handled directly in the RecipeIngredients component */}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}