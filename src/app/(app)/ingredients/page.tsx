'use client';

import { useState, useMemo, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { Ingredient } from '@/lib/types';
import { MoreHorizontal, PlusCircle, Loader2, Search, Filter, Trash2, Edit, Star, Download, Upload } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useCollection, useFirestore } from '@/firebase';
import { collection, doc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

const ingredientCategories = [
  'Chocolate Base', 'Cocoa Ingredients', 'Dairy & Milk', 'Sweeteners', 'Nuts', 'Seeds & Grains', 
  'Fruits', 'Fruit Preparations', 'Indian Flavours', 'Coffee & Beverage', 'Herbs & Spices', 
  'Caramel & Praline', 'Chocolate Fillings', 'Natural Flavours', 'Colours', 'Decoration', 
  'Texture & Stability', 'Salt & Finishing'
];

const allergenOptions = ['Milk', 'Soy', 'Nuts', 'Peanuts', 'Gluten', 'Sesame', 'Egg', 'Gelatin'];

const ingredientSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  category: z.string().min(1, 'Category is required'),
  defaultUnit: z.enum(['mg', 'g', 'kg', 'ml', 'L', 'pcs', 'tbsp', 'tsp', 'pinch']),
  description: z.string().optional(),
  allergens: z.array(z.string()).default([]),
  purchasePrice: z.coerce.number().min(0).optional(),
  purchaseQuantity: z.coerce.number().min(0).optional(),
  purchaseUnit: z.string().optional(),
  isActive: z.boolean().default(true),
  isFavourite: z.boolean().default(false),
});

type IngredientFormValues = z.infer<typeof ingredientSchema>;

export default function IngredientLibraryPage() {
  const firestore = useFirestore();
  const ingredientsQuery = useMemo(() => (firestore ? collection(firestore, 'ingredients') : null), [firestore]);
  const { data: ingredients, loading } = useCollection<Ingredient>(ingredientsQuery);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null);
  
  const { toast } = useToast();

  const form = useForm<IngredientFormValues>({
    resolver: zodResolver(ingredientSchema),
    defaultValues: {
      name: '',
      category: '',
      defaultUnit: 'g',
      allergens: [],
      isActive: true,
      isFavourite: false,
    }
  });

  useEffect(() => {
    if (editingIngredient) {
      form.reset({
        name: editingIngredient.name,
        category: editingIngredient.category,
        defaultUnit: editingIngredient.defaultUnit,
        description: editingIngredient.description || '',
        allergens: editingIngredient.allergens || [],
        purchasePrice: editingIngredient.purchasePrice || 0,
        purchaseQuantity: editingIngredient.purchaseQuantity || 0,
        purchaseUnit: editingIngredient.purchaseUnit || '',
        isActive: editingIngredient.isActive,
        isFavourite: editingIngredient.isFavourite || false,
      });
    } else {
      form.reset({ name: '', category: '', defaultUnit: 'g', allergens: [], isActive: true, isFavourite: false });
    }
  }, [editingIngredient, form]);

  const onSave = (values: IngredientFormValues) => {
    if (!firestore) return;

    const id = editingIngredient?.id || `ING-${Date.now()}`;
    const ingRef = doc(firestore, 'ingredients', id);
    const ingData = {
      ...values,
      id,
      nameNormalized: values.name.toLowerCase().trim(),
      updatedAt: new Date().toISOString(),
      createdAt: editingIngredient?.createdAt || new Date().toISOString(),
    };

    setDoc(ingRef, ingData)
      .then(() => {
        setIsAddDialogOpen(false);
        setEditingIngredient(null);
        toast({ title: editingIngredient ? 'Ingredient Updated' : 'Ingredient Added' });
      })
      .catch(async (err) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: ingRef.path,
          operation: editingIngredient ? 'update' : 'create',
          requestResourceData: ingData
        }));
      });
  };

  const handleToggleFavourite = (ing: Ingredient) => {
    if (!firestore) return;
    updateDoc(doc(firestore, 'ingredients', ing.id), { isFavourite: !ing.isFavourite });
  };

  const handleDelete = (ing: Ingredient) => {
    if (!firestore || !confirm('Permanently delete this ingredient?')) return;
    deleteDoc(doc(firestore, 'ingredients', ing.id))
      .then(() => toast({ title: 'Ingredient Removed' }));
  };

  const filteredIngredients = useMemo(() => {
    if (!ingredients) return [];
    return ingredients
      .filter(i => filterCategory === 'all' || i.category === filterCategory)
      .filter(i => i.name.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [ingredients, searchTerm, filterCategory]);

  if (loading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin h-10 w-10 text-primary" /></div>;

  return (
    <>
      <PageHeader 
        title="Ingredient Master Library" 
        actions={
          <div className="flex gap-2">
            <Button variant="outline" className="rounded-xl"><Download className="h-4 w-4 mr-2" /> Export</Button>
            <Button onClick={() => { setEditingIngredient(null); setIsAddDialogOpen(true); }} className="rounded-xl shadow-lg shadow-primary/20">
                <PlusCircle className="mr-2 h-4 w-4" /> Add Ingredient
            </Button>
          </div>
        } 
      />

      <div className="grid grid-cols-1 gap-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
           <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search ingredients..." 
                className="pl-10 h-11 rounded-xl bg-card border-none shadow-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
           </div>
           <Select value={filterCategory} onValueChange={setFilterCategory}>
             <SelectTrigger className="w-full md:w-64 h-11 rounded-xl">
               <div className="flex items-center gap-2"><Filter className="h-4 w-4" /><SelectValue placeholder="All Categories" /></div>
             </SelectTrigger>
             <SelectContent>
               <SelectItem value="all">All Categories</SelectItem>
               {ingredientCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
             </SelectContent>
           </Select>
        </div>

        <Card className="rounded-[2rem] overflow-hidden border-none shadow-xl">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/10">
                  <TableHead className="p-6 uppercase text-[10px] font-black tracking-widest w-12"></TableHead>
                  <TableHead className="p-6 uppercase text-[10px] font-black tracking-widest">Ingredient Name</TableHead>
                  <TableHead className="p-6 uppercase text-[10px] font-black tracking-widest">Category</TableHead>
                  <TableHead className="p-6 uppercase text-[10px] font-black tracking-widest text-center">Unit</TableHead>
                  <TableHead className="p-6 uppercase text-[10px] font-black tracking-widest">Allergens</TableHead>
                  <TableHead className="p-6 uppercase text-[10px] font-black tracking-widest text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredIngredients.map((ing) => (
                  <TableRow key={ing.id} className="group hover:bg-muted/5">
                    <TableCell className="p-6">
                      <button onClick={() => handleToggleFavourite(ing)} className={cn("transition-colors", ing.isFavourite ? "text-amber-500" : "text-stone-200 hover:text-amber-200")}>
                        <Star className={cn("h-5 w-5", ing.isFavourite && "fill-current")} />
                      </button>
                    </TableCell>
                    <TableCell className="p-6 font-bold text-stone-800">{ing.name}</TableCell>
                    <TableCell className="p-6"><Badge variant="secondary" className="rounded-lg text-[10px] font-bold uppercase tracking-tight">{ing.category}</Badge></TableCell>
                    <TableCell className="p-6 text-center font-mono text-xs">{ing.defaultUnit}</TableCell>
                    <TableCell className="p-6">
                      <div className="flex flex-wrap gap-1">
                        {ing.allergens?.map(a => <Badge key={a} variant="outline" className="text-[9px] border-rose-200 text-rose-600 bg-rose-50">{a}</Badge>)}
                      </div>
                    </TableCell>
                    <TableCell className="p-6 text-right">
                       <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="rounded-xl"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48 rounded-xl">
                            <DropdownMenuItem onClick={() => { setEditingIngredient(ing); setIsAddDialogOpen(true); }}><Edit className="h-4 w-4 mr-2" /> Edit Details</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleDelete(ing)} className="text-destructive"><Trash2 className="h-4 w-4 mr-2" /> Delete Permanent</DropdownMenuItem>
                          </DropdownMenuContent>
                       </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isAddDialogOpen} onOpenChange={(o) => !o && setIsAddDialogOpen(false)}>
        <DialogContent className="sm:max-w-xl rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl">
          <div className="bg-muted/30 p-8 border-b">
            <DialogHeader>
              <DialogTitle className="text-3xl font-headline">{editingIngredient ? 'Edit Ingredient' : 'Register Ingredient'}</DialogTitle>
              <DialogDescription className="text-[10px] uppercase tracking-[0.2em] font-black text-muted-foreground/60">Artisan Master Library Entry</DialogDescription>
            </DialogHeader>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSave)}>
              <ScrollArea className="max-h-[60vh] px-8 py-10" dual>
                <div className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField control={form.control} name="name" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="uppercase text-[9px] font-black tracking-widest text-muted-foreground">Ingredient Name</FormLabel>
                        <FormControl><Input className="h-12 rounded-xl" placeholder="e.g. Saffron / Kesar" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="category" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="uppercase text-[9px] font-black tracking-widest text-muted-foreground">Category</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                           <FormControl><SelectTrigger className="h-12 rounded-xl"><SelectValue placeholder="Select Category" /></SelectTrigger></FormControl>
                           <SelectContent>{ingredientCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}</SelectContent>
                        </Select>
                      </FormItem>
                    )} />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <FormField control={form.control} name="defaultUnit" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="uppercase text-[9px] font-black tracking-widest text-muted-foreground">Default Artisan Unit</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                           <FormControl><SelectTrigger className="h-12 rounded-xl"><SelectValue /></SelectTrigger></FormControl>
                           <SelectContent>{['mg', 'g', 'kg', 'ml', 'L', 'pcs', 'tbsp', 'tsp', 'pinch'].map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
                        </Select>
                      </FormItem>
                    )} />
                  </div>

                  <div className="space-y-4">
                    <Label className="uppercase text-[9px] font-black tracking-widest text-muted-foreground">Allergen Matrix</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                       {allergenOptions.map(allergen => (
                         <div key={allergen} className="flex items-center gap-2 p-3 bg-muted/20 rounded-xl border border-transparent hover:border-primary/20 transition-all cursor-pointer">
                            <Checkbox 
                              id={`all-${allergen}`}
                              checked={form.watch('allergens').includes(allergen)}
                              onCheckedChange={(checked) => {
                                const current = form.getValues('allergens');
                                form.setValue('allergens', checked ? [...current, allergen] : current.filter(a => a !== allergen));
                              }}
                            />
                            <label htmlFor={`all-${allergen}`} className="text-xs font-bold text-stone-600 cursor-pointer">{allergen}</label>
                         </div>
                       ))}
                    </div>
                  </div>

                  <div className="bg-stone-50 p-6 rounded-2xl border border-dashed space-y-6">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2"><PlusCircle className="h-3 w-3" /> Cost Information (Internal)</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                       <FormField control={form.control} name="purchasePrice" render={({ field }) => (
                        <FormItem><FormLabel className="text-[8px] font-bold text-stone-400">Purchase Price (₹)</FormLabel><FormControl><Input type="number" className="h-10 rounded-lg" {...field} /></FormControl></FormItem>
                      )} />
                      <FormField control={form.control} name="purchaseQuantity" render={({ field }) => (
                        <FormItem><FormLabel className="text-[8px] font-bold text-stone-400">Qty Purchased</FormLabel><FormControl><Input type="number" className="h-10 rounded-lg" {...field} /></FormControl></FormItem>
                      )} />
                      <FormField control={form.control} name="purchaseUnit" render={({ field }) => (
                        <FormItem><FormLabel className="text-[8px] font-bold text-stone-400">Purchase Unit</FormLabel><FormControl><Input className="h-10 rounded-lg" placeholder="kg/L" {...field} /></FormControl></FormItem>
                      )} />
                    </div>
                  </div>
                </div>
              </ScrollArea>

              <div className="p-8 border-t bg-background flex gap-4">
                 <DialogClose asChild><Button type="button" variant="ghost" className="flex-1 h-12 rounded-xl font-bold uppercase text-[10px] tracking-widest">Discard</Button></DialogClose>
                 <Button type="submit" className="flex-2 px-10 h-12 rounded-xl font-bold uppercase text-[10px] tracking-widest shadow-xl shadow-primary/20">
                   Commit to Master Library
                 </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}
