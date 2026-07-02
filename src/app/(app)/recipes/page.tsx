'use client';

import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { Recipe } from '@/lib/types';
import { PlusCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useCollection, useFirestore } from '@/firebase';
import { collection, doc, setDoc } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

const recipeFormSchema = z.object({
  name: z.string().min(1, 'Recipe name is required'),
  associatedProduct: z.string().min(1, 'Associated product is required'),
  ingredients: z.string().min(1, 'Ingredients are required. Please provide a comma-separated list, e.g., "Cocoa Beans (1kg), Sugar (500g)"'),
});

export default function RecipesPage() {
  const firestore = useFirestore();
  const recipesQuery = useMemo(() => firestore ? collection(firestore, 'recipes') : null, [firestore]);
  const { data: recipes, loading } = useCollection<Recipe>(recipesQuery);

  const [viewRecipe, setViewRecipe] = useState<Recipe | null>(null);
  const [isAddRecipeOpen, setIsAddRecipeOpen] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof recipeFormSchema>>({
    resolver: zodResolver(recipeFormSchema),
    defaultValues: {
      name: '',
      associatedProduct: '',
      ingredients: '',
    },
  });

  function onAddSubmit(values: z.infer<typeof recipeFormSchema>) {
    if (!firestore) return;
    
    const id = `R${Date.now()}`;
    const recipeRef = doc(firestore, 'recipes', id);
    
    const ingredients = values.ingredients.split(',').map(item => {
      const parts = item.trim().split('(');
      const name = parts[0].trim();
      const quantity = parts.length > 1 ? parts[1].replace(')', '').trim() : '';
      return { name, quantity };
    }).filter(ing => ing.name);

    const recipeData = {
      id,
      name: values.name,
      associatedProduct: values.associatedProduct,
      ingredients,
    };

    setDoc(recipeRef, recipeData)
      .then(() => {
        setIsAddRecipeOpen(false);
        form.reset();
        toast({ title: 'Recipe Added', description: `${values.name} has been added to your recipes.` });
      })
      .catch(async (error) => {
        const permissionError = new FirestorePermissionError({
          path: recipeRef.path,
          operation: 'create',
          requestResourceData: recipeData,
        });
        errorEmitter.emit('permission-error', permissionError);
      });
  }

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin" /></div>;

  return (
    <>
      <Dialog open={isAddRecipeOpen} onOpenChange={setIsAddRecipeOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Recipe</DialogTitle>
            <DialogDescription>
              Fill in the details for the new recipe. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onAddSubmit)} className="space-y-4 py-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Recipe Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Spicy Chilli Chocolate Bar Recipe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="associatedProduct"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Associated Product</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Spicy Chilli Chocolate Bar" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="ingredients"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ingredients</FormLabel>
                    <FormControl>
                      <Textarea placeholder="e.g., Cocoa (1kg), Chilli Flakes (20g), Sugar (150g)" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="secondary">Cancel</Button>
                </DialogClose>
                <Button type="submit">Save Recipe</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      <Dialog open={!!viewRecipe} onOpenChange={(open) => !open && setViewRecipe(null)}>
        {viewRecipe && (
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-headline">{viewRecipe.name}</DialogTitle>
              <DialogDescription>Associated with: {viewRecipe.associatedProduct}</DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <h4 className="font-semibold mb-2 text-foreground">Full Ingredient List:</h4>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                {viewRecipe.ingredients.map((ingredient, i) => (
                  <li key={i}>{ingredient.name} <span className="text-xs">({ingredient.quantity})</span></li>
                ))}
              </ul>
            </div>
            <DialogFooter>
              <Button type="button" onClick={() => setViewRecipe(null)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>

      <PageHeader title="Recipes" actions={
        <Button onClick={() => setIsAddRecipeOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Recipe
        </Button>
      } />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {recipes?.map((recipe) => (
          <Card key={recipe.id} className="flex flex-col">
            <CardHeader>
              <CardTitle className="font-headline">{recipe.name}</CardTitle>
              <CardDescription>Associated with: {recipe.associatedProduct}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <h4 className="font-semibold mb-2">Key Ingredients:</h4>
              <ul className="list-disc list-inside text-sm text-muted-foreground">
                {recipe.ingredients.slice(0, 3).map((ingredient, i) => (
                  <li key={i}>{ingredient.name} ({ingredient.quantity})</li>
                ))}
                {recipe.ingredients.length > 3 && <li>...and more</li>}
              </ul>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full" onClick={() => setViewRecipe(recipe)}>
                View Full Recipe
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </>
  );
}
