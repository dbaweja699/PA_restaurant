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
  Trash2,
  FileText,
  DollarSign,
  Check,
  Package,
  ChevronsUpDown
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

// Component to display recipe item cost estimate
const RecipeCostEstimate = ({ recipeItems }: { recipeItems: RecipeItemWithDetails[] }) => {
  // Calculate estimated cost of the recipe
  const calculateCost = () => {
    return recipeItems.reduce((total, item) => {
      const unitPrice = parseFloat(item.inventoryItem.unitPrice.replace(/[^0-9.]/g, ''));
      const quantity = parseFloat(item.quantityRequired);
      if (!isNaN(unitPrice) && !isNaN(quantity)) {
        return total + (unitPrice * quantity);
      }
      return total;
    }, 0);
  };
  
  const totalCost = calculateCost();
  
  return (
    <Card className="bg-green-50 border-green-200">
      <CardHeader className="py-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-green-600" />
          Cost Estimate
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-3">
        <div className="text-3xl font-bold text-green-700">
          ${totalCost.toFixed(2)}
        </div>
        <p className="text-sm text-green-600 mt-1">
          Based on current inventory prices
        </p>
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
  
  // Fetch recipe items for selected recipe
  const {
    data: recipeItems = [],
    isLoading: isLoadingRecipeItems,
  } = useQuery({
    queryKey: ['/api/recipes', selectedRecipe?.id, 'items'],
    enabled: !!selectedRecipe,
    retry: 1,
  });
  
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
  
  // Remove ingredient mutation
  const removeIngredientMutation = useMutation({
    mutationFn: async ({ recipeId, itemId }: { recipeId: number, itemId: number }) => {
      const res = await apiRequest('DELETE', `/api/recipes/${recipeId}/items/${itemId}`);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Ingredient removed",
        description: "Ingredient has been removed from the recipe successfully.",
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
        title: "Failed to remove ingredient",
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
      orderType: 'dine_in',
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
  
  const handleRemoveIngredient = (itemId: number) => {
    if (selectedRecipe && window.confirm("Are you sure you want to remove this ingredient from the recipe?")) {
      removeIngredientMutation.mutate({ recipeId: selectedRecipe.id, itemId });
    }
  };
  
  // Helper to get unit options based on inventory item
  const getUnitOptions = (inventoryId: number) => {
    const item = inventoryItems.find(item => item.id === inventoryId);
    if (!item) return [];
    
    // Always include the item's base unit
    const options = [item.unitOfMeasurement];
    
    // Add common alternative units depending on the base unit
    switch (item.unitOfMeasurement) {
      case 'kg':
        options.push('g');
        break;
      case 'g':
        options.push('kg');
        break;
      case 'l':
        options.push('ml');
        break;
      case 'ml':
        options.push('l');
        break;
      case 'piece':
      case 'box':
      case 'bag':
      case 'case':
        options.push('unit');
        break;
      default:
        // No other options
        break;
    }
    
    return options;
  };
  
  // Format date for display
  const formatDate = (date: Date) => {
    const d = new Date(date);
    return d.toLocaleDateString();
  };
  
  // Determine order type badge color
  const getOrderTypeBadge = (orderType: string) => {
    switch (orderType) {
      case 'dine_in':
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-800 border-blue-300">
            Dine In
          </Badge>
        );
      case 'takeaway':
        return (
          <Badge variant="outline" className="bg-green-50 text-green-800 border-green-300">
            Takeaway
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">{orderType}</Badge>
        );
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
          <h1 className="text-3xl font-bold tracking-tight">Recipe Builder</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Create and manage recipes for your restaurant menu
          </p>
        </div>
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
                            <SelectItem value="dine_in">Dine In</SelectItem>
                            <SelectItem value="takeaway">Takeaway</SelectItem>
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
                          defaultValue={field.value || undefined}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="starter">Starter</SelectItem>
                            <SelectItem value="main">Main Course</SelectItem>
                            <SelectItem value="side">Side Dish</SelectItem>
                            <SelectItem value="dessert">Dessert</SelectItem>
                            <SelectItem value="drink">Drink</SelectItem>
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
                          placeholder="A brief description of the dish" 
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
                        <Input 
                          placeholder="$0.00" 
                          {...field}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setAddDialogOpen(false)}
                  >
                    Cancel
                  </Button>
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
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Recipe List</CardTitle>
              <CardDescription>
                Select a recipe to view and edit its details
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-[500px] overflow-y-auto">
                {recipes.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-6 h-64">
                    <UtensilsCrossed className="h-12 w-12 text-muted-foreground mb-2" />
                    <p className="text-center text-muted-foreground">
                      No recipes found. Create your first recipe to get started.
                    </p>
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={() => setAddDialogOpen(true)}
                    >
                      Add First Recipe
                    </Button>
                  </div>
                ) : (
                  <ul className="divide-y">
                    {recipes.map((recipe) => (
                      <li 
                        key={recipe.id}
                        className={`py-3 px-4 hover:bg-muted cursor-pointer transition-colors ${
                          selectedRecipe?.id === recipe.id ? 'bg-primary/5 border-l-4 border-primary' : ''
                        }`}
                        onClick={() => setSelectedRecipe(recipe)}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <h3 className="font-medium">{recipe.dishName}</h3>
                            <div className="flex items-center gap-2 mt-1">
                              {getOrderTypeBadge(recipe.orderType)}
                              {recipe.category && (
                                <Badge variant="outline" className="bg-gray-100">
                                  {recipe.category}
                                </Badge>
                              )}
                              {!recipe.isActive && (
                                <Badge variant="secondary">Inactive</Badge>
                              )}
                            </div>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditRecipe(recipe);
                            }}
                          >
                            <Settings className="h-4 w-4" />
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2">
          {selectedRecipe ? (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="text-2xl">{selectedRecipe.dishName}</CardTitle>
                      <div className="flex items-center gap-2 mt-2">
                        {getOrderTypeBadge(selectedRecipe.orderType)}
                        {selectedRecipe.category && (
                          <Badge variant="outline" className="bg-gray-100">
                            {selectedRecipe.category}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-xl font-bold">
                      {selectedRecipe.sellingPrice || 'Price not set'}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between">
                    <div className="max-w-[70%]">
                      <h3 className="text-sm font-medium text-muted-foreground mb-1">Description</h3>
                      {selectedRecipe.description ? (
                        <p>{selectedRecipe.description}</p>
                      ) : (
                        <p className="text-muted-foreground italic">No description provided</p>
                      )}
                    </div>
                    <div className="text-right">
                      <h3 className="text-sm font-medium text-muted-foreground mb-1">Last Updated</h3>
                      <p>{formatDate(selectedRecipe.updatedAt)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-3 gap-6">
                <div className="col-span-2">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between py-3">
                      <CardTitle className="text-lg">Ingredients</CardTitle>
                      <Dialog open={addIngredientDialogOpen} onOpenChange={setAddIngredientDialogOpen}>
                        <DialogTrigger asChild>
                          <Button size="sm" className="h-8">
                            <Plus className="h-3.5 w-3.5 mr-1" />
                            Add Ingredient
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px]">
                          <DialogHeader>
                            <DialogTitle>Add Ingredient</DialogTitle>
                            <DialogDescription>
                              Add an ingredient to this recipe from your inventory
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
                                      onValueChange={(value) => {
                                        const id = parseInt(value);
                                        field.onChange(id);
                                        
                                        // Auto-populate unit field with the item's unit of measurement
                                        const item = inventoryItems.find(i => i.id === id);
                                        if (item) {
                                          addIngredientForm.setValue('unit', item.unitOfMeasurement);
                                        }
                                      }}
                                      defaultValue={field.value ? field.value.toString() : undefined}
                                    >
                                      <FormControl>
                                        <SelectTrigger>
                                          <SelectValue placeholder="Select an ingredient" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        {isLoadingInventory ? (
                                          <div className="flex justify-center p-2">
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                          </div>
                                        ) : (
                                          inventoryItems.map((item) => (
                                            <SelectItem 
                                              key={item.id} 
                                              value={item.id.toString()}
                                            >
                                              {item.itemName} ({item.unitOfMeasurement})
                                            </SelectItem>
                                          ))
                                        )}
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
                                        <Input type="text" placeholder="1.5" {...field} />
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
                                          {getUnitOptions(addIngredientForm.getValues().inventoryId).map((unit) => (
                                            <SelectItem key={unit} value={unit}>
                                              {unit}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>

                              <DialogFooter>
                                <Button 
                                  type="button" 
                                  variant="outline" 
                                  onClick={() => setAddIngredientDialogOpen(false)}
                                >
                                  Cancel
                                </Button>
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
                    </CardHeader>
                    <CardContent>
                      {isLoadingRecipeItems ? (
                        <div className="flex justify-center py-6">
                          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                      ) : recipeItems.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8">
                          <ShoppingBasket className="h-10 w-10 text-muted-foreground mb-2" />
                          <p className="text-center text-muted-foreground">
                            No ingredients added to this recipe yet.
                          </p>
                          <Button 
                            variant="outline" 
                            className="mt-4"
                            onClick={() => setAddIngredientDialogOpen(true)}
                          >
                            Add First Ingredient
                          </Button>
                        </div>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Ingredient</TableHead>
                              <TableHead>Quantity</TableHead>
                              <TableHead>Unit Price</TableHead>
                              <TableHead>Item Cost</TableHead>
                              <TableHead className="w-[50px]"></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {recipeItems.map((item) => {
                              const inventoryItem = item.inventoryItem;
                              const unitPrice = parseFloat(inventoryItem.unitPrice.replace(/[^0-9.]/g, ''));
                              const quantity = parseFloat(item.quantityRequired);
                              const itemCost = !isNaN(unitPrice) && !isNaN(quantity) 
                                ? (unitPrice * quantity) 
                                : 0;
                              
                              return (
                                <TableRow key={item.id}>
                                  <TableCell className="font-medium">
                                    {inventoryItem.itemName}
                                  </TableCell>
                                  <TableCell>
                                    {item.quantityRequired} {item.unit}
                                  </TableCell>
                                  <TableCell>
                                    {inventoryItem.unitPrice}
                                  </TableCell>
                                  <TableCell>
                                    ${itemCost.toFixed(2)}
                                  </TableCell>
                                  <TableCell>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                      onClick={() => handleRemoveIngredient(item.id)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      )}
                    </CardContent>
                  </Card>
                </div>

                <div className="col-span-1">
                  {recipeItems.length > 0 && (
                    <RecipeCostEstimate recipeItems={recipeItems} />
                  )}
                </div>
              </div>
            </div>
          ) : (
            <Card className="h-full flex flex-col items-center justify-center py-12">
              <FileText className="h-20 w-20 text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold">Select a Recipe</h2>
              <p className="text-muted-foreground text-center max-w-sm mt-2 mb-6">
                Select a recipe from the list or create a new one to view and edit its details and ingredients
              </p>
              <Button 
                variant="outline" 
                onClick={() => setAddDialogOpen(true)}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Create New Recipe
              </Button>
            </Card>
          )}
        </div>
      </div>

      {/* Edit Recipe Dialog */}
      <Dialog open={!!editRecipe} onOpenChange={(open) => !open && setEditRecipe(null)}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Edit Recipe</DialogTitle>
            <DialogDescription>
              Update the details for {editRecipe?.dishName}
            </DialogDescription>
          </DialogHeader>

          <Form {...editRecipeForm}>
            <form onSubmit={editRecipeForm.handleSubmit(onEditRecipeSubmit)} className="space-y-4 py-4">
              <FormField
                control={editRecipeForm.control}
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
                          <SelectItem value="dine_in">Dine In</SelectItem>
                          <SelectItem value="takeaway">Takeaway</SelectItem>
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
                  control={editRecipeForm.control}
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
                          <SelectItem value="starter">Starter</SelectItem>
                          <SelectItem value="main">Main Course</SelectItem>
                          <SelectItem value="side">Side Dish</SelectItem>
                          <SelectItem value="dessert">Dessert</SelectItem>
                          <SelectItem value="drink">Drink</SelectItem>
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
                        placeholder="A brief description of the dish" 
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
                      <Input 
                        placeholder="$0.00" 
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
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Active Status</FormLabel>
                      <FormDescription>
                        Inactive recipes won't appear in order processing
                      </FormDescription>
                    </div>
                    <FormControl>
                      <div className="flex items-center space-x-2">
                        <Label htmlFor="isActive" className={field.value ? "text-green-600" : "text-gray-400"}>
                          {field.value ? "Active" : "Inactive"}
                        </Label>
                        <Switch
                          id="isActive"
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </div>
                    </FormControl>
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setEditRecipe(null)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={updateRecipeMutation.isPending}>
                  {updateRecipeMutation.isPending && (
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