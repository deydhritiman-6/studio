'use client';

import { useState, useMemo, useEffect } from 'react';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  PlusCircle, 
  Trash2, 
  Save, 
  Loader2, 
  ChevronRight, 
  Search, 
  Scale, 
  Droplets, 
  Thermometer, 
  Clock, 
  ShieldAlert, 
  CheckCircle2,
  Sparkles,
  Layers,
  ArrowLeft,
  X,
  History,
  LayoutGrid
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useCollection, useFirestore, useDoc } from '@/firebase';
import { collection, doc, query, where, orderBy } from 'firebase/firestore';
import type { Recipe, Ingredient, Product, RecipeIngredient, RecipeStep } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { saveRecipeAction } from '../actions';
import { useParams, useRouter } from 'next/navigation';

const recipeFormSchema = z.object({
  name: z.string().min(1, 'Recipe name is required'),
  code: z.string().optional(),
  associatedProductId: z.string().optional(),
  chocolateType: z.string().optional(),
  status: z.enum(['Draft', 'Testing', 'Approved', 'Published', 'Archived']).default('Draft'),
  difficulty: z.enum(['Easy', 'Intermediate', 'Professional', 'Master']).default('Professional'),
  prepTime: z.coerce.number().min(0).default(0),
  processTime: z.coerce.number().min(0).default(0),
  batchSize: z.coerce.number().min(0.001, 'Batch size must be positive'),
  batchUnit: z.string().default('kg'),
  yield: z.coerce.number().min(0).optional(),
  yieldUnit: z.string().optional(),
  shortDescription: z.string().optional(),
  detailedDescription: z.string().optional(),
  internalNotes: z.string().optional(),
  ingredients: z.array(z.object({
    ingredientId: z.string(),
    name: z.string(),
    quantity: z.coerce.number().min(0.0001),
    unit: z.string(),
    preparation: z.string().optional(),
    stage: z.string().optional(),
    notes: z.string().optional(),
    order: z.number(),
  })).min(1, 'At least one ingredient is required'),
  steps: z.array(z.object({
    id: z.string(),
    title: z.string().min(1, 'Step title is required'),
    instructions: z.string().min(1, 'Instructions are required'),
    temperature: z.coerce.number().optional(),
    tempUnit: z.enum(['C', 'F']).default('C'),
    time: z.coerce.number().optional(),
    equipment: z.string().optional(),
    order: z.number(),
  })).default([]),
});

type RecipeFormValues = z.infer<typeof recipeFormSchema>;

export default function AddRecipePage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const firestore = useFirestore();

  const recipeId = params.id as string;
  const isEditing = !!recipeId;

  const productsQuery = useMemo(() => (firestore ? collection(firestore, 'products') : null), [firestore]);
  const ingredientsQuery = useMemo(() => (firestore ? collection(firestore, 'ingredients') : null), [firestore]);
  const recipeRef = useMemo(() => (firestore && recipeId ? doc(firestore, 'recipes', recipeId) : null), [firestore, recipeId]);

  const { data: products } = useCollection<Product>(productsQuery);
  const { data: ingredientsMaster } = useCollection<Ingredient>(ingredientsQuery);
  const { data: existingRecipe, loading: recipeLoading } = useDoc<Recipe>(recipeRef as any);

  const [isSaving, setIsSaving] = useState(false);
  const [isIngPickerOpen, setIsIngPickerOpen] = useState(false);
  const [ingSearch, setIngPickerSearch] = useState('');
  const [activeTab, setActiveTab] = useState('info');

  const form = useForm<RecipeFormValues>({
    resolver: zodResolver(recipeFormSchema),
    defaultValues: {
      name: '',
      status: 'Draft',
      difficulty: 'Professional',
      batchSize: 1,
      batchUnit: 'kg',
      ingredients: [],
      steps: [],
    }
  });

  const { fields: ingFields, append: ingAppend, remove: ingRemove, move: ingMove } = useFieldArray({
    control: form.control,
    name: 'ingredients',
  });

  const { fields: stepFields, append: stepAppend, remove: stepRemove, move: stepMove } = useFieldArray({
    control: form.control,
    name: 'steps',
  });

  useEffect(() => {
    if (existingRecipe) {
      form.reset({
        ...existingRecipe,
        ingredients: existingRecipe.ingredients || [],
        steps: existingRecipe.steps || [],
      } as any);
    }
  }, [existingRecipe, form]);

  const watchIngredients = useWatch({ control: form.control, name: 'ingredients' });
  const watchBatchSize = useWatch({ control: form.control, name: 'batchSize' });

  const totals = useMemo(() => {
    return watchIngredients.reduce((acc, ing) => {
      let weight = ing.quantity;
      if (ing.unit === 'kg' || ing.unit === 'L') weight *= 1000;
      if (ing.unit === 'mg') weight /= 1000;
      return acc + weight;
    }, 0);
  }, [watchIngredients]);

  const allergens = useMemo(() => {
    const set = new Set<string>();
    watchIngredients.forEach(ri => {
      const master = ingredientsMaster?.find(m => m.id === ri.ingredientId);
      master?.allergens?.forEach(a => set.add(a));
    });
    return Array.from(set);
  }, [watchIngredients, ingredientsMaster]);

  const onSubmit = async (values: RecipeFormValues) => {
    if (!firestore) return;
    setIsSaving(true);

    try {
      const prod = products?.find(p => p.id === values.associatedProductId);
      const recipeData: Partial<Recipe> = {
        ...values,
        id: recipeId,
        productName: prod?.name || '',
        allergens,
        updatedBy: 'Admin Artisan',
      };

      const res = await saveRecipeAction(recipeData);
      toast({ title: isEditing ? 'Formulation Refined' : 'Formulation Registered' });
      if (!isEditing) router.push('/recipes');
    } catch (e) {
      toast({ variant: 'destructive', title: 'Save Failed' });
    } finally {
      setIsSaving(false);
    }
  };

  const filteredMaster = useMemo(() => {
    if (!ingredientsMaster) return [];
    return ingredientsMaster.filter(i => i.name.toLowerCase().includes(ingSearch.toLowerCase()));
  }, [ingredientsMaster, ingSearch]);

  const handleAddIngredient = (master: Ingredient) => {
    ingAppend({
      ingredientId: master.id,
      name: master.name,
      quantity: 0,
      unit: master.defaultUnit,
      order: ingFields.length,
    });
    setIsIngPickerOpen(false);
  };

  if (recipeLoading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin h-10 w-10 text-primary" /></div>;

  return (
    <>
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full h-12 w-12 border-2"><ArrowLeft className="h-5 w-5" /></Button>
          <div className="space-y-1">
             <h1 className="text-3xl font-headline font-bold">{isEditing ? 'Refine Formulation' : 'New Artisan Formulation'}</h1>
             <p className="text-[10px] uppercase font-black tracking-widest text-stone-400">Version Controlled Production Workflow</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="h-12 rounded-xl px-8" onClick={() => router.back()}>Discard</Button>
          <Button disabled={isSaving} onClick={form.handleSubmit(onSubmit)} className="h-12 rounded-xl px-12 shadow-xl shadow-primary/20">
             {isSaving ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2 h-4 w-4" />}
             {isEditing ? 'Commit Refinement' : 'Register Formula'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-3 bg-muted/50 p-1 h-14 rounded-[1.5rem] mb-8">
               <TabsTrigger value="info" className="rounded-xl font-bold uppercase text-[10px] tracking-widest">Specifications</TabsTrigger>
               <TabsTrigger value="ingredients" className="rounded-xl font-bold uppercase text-[10px] tracking-widest">Ingredient Matrix</TabsTrigger>
               <TabsTrigger value="process" className="rounded-xl font-bold uppercase text-[10px] tracking-widest">Production Process</TabsTrigger>
            </TabsList>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <TabsContent value="info">
                  <Card className="rounded-[2rem] border-none shadow-xl">
                    <CardHeader className="p-10 border-b bg-muted/30">
                       <CardTitle className="text-2xl font-headline">Core Specifications</CardTitle>
                    </CardHeader>
                    <CardContent className="p-10 space-y-8">
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <FormField control={form.control} name="name" render={({ field }) => (
                            <FormItem>
                              <FormLabel className="uppercase text-[9px] font-black tracking-widest text-muted-foreground">Recipe Name</FormLabel>
                              <FormControl><Input className="h-12 rounded-xl" placeholder="e.g. Signature Roseberry Truffle Base" {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />
                          <FormField control={form.control} name="associatedProductId" render={({ field }) => (
                            <FormItem>
                              <FormLabel className="uppercase text-[9px] font-black tracking-widest text-muted-foreground">Linked Artisan Product</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                 <FormControl><SelectTrigger className="h-12 rounded-xl"><SelectValue placeholder="Select Product" /></SelectTrigger></FormControl>
                                 <SelectContent>{products?.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                              </Select>
                            </FormItem>
                          )} />
                       </div>

                       <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                          <FormField control={form.control} name="batchSize" render={({ field }) => (
                            <FormItem>
                              <FormLabel className="uppercase text-[9px] font-black tracking-widest text-muted-foreground">Standard Batch</FormLabel>
                              <FormControl><Input type="number" step="0.01" className="h-12 rounded-xl" {...field} /></FormControl>
                            </FormItem>
                          )} />
                          <FormField control={form.control} name="batchUnit" render={({ field }) => (
                            <FormItem>
                              <FormLabel className="uppercase text-[9px] font-black tracking-widest text-muted-foreground">Unit</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                 <FormControl><SelectTrigger className="h-12 rounded-xl"><SelectValue /></SelectTrigger></FormControl>
                                 <SelectContent>{['kg', 'g', 'L', 'ml', 'pcs'].map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
                              </Select>
                            </FormItem>
                          )} />
                          <FormField control={form.control} name="status" render={({ field }) => (
                            <FormItem className="col-span-2">
                              <FormLabel className="uppercase text-[9px] font-black tracking-widest text-muted-foreground">Lifecycle Stage</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                 <FormControl><SelectTrigger className="h-12 rounded-xl"><SelectValue /></SelectTrigger></FormControl>
                                 <SelectContent>{['Draft', 'Testing', 'Approved', 'Published'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                              </Select>
                            </FormItem>
                          )} />
                       </div>

                       <FormField control={form.control} name="detailedDescription" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="uppercase text-[9px] font-black tracking-widest text-muted-foreground">Formula Notes</FormLabel>
                          <FormControl><Textarea className="rounded-xl min-h-[120px]" placeholder="Specific notes on cacao origins or roasting profiles..." {...field} /></FormControl>
                        </FormItem>
                      )} />
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="ingredients">
                  <Card className="rounded-[2rem] border-none shadow-xl overflow-hidden">
                    <CardHeader className="p-10 bg-muted/30 border-b flex flex-row items-center justify-between">
                       <div className="space-y-1">
                          <CardTitle className="text-2xl font-headline">Ingredient Matrix</CardTitle>
                          <CardDescription className="text-[10px] uppercase tracking-widest font-bold">Precise formulation components</CardDescription>
                       </div>
                       <Button type="button" onClick={() => setIsIngPickerOpen(true)} className="rounded-xl h-11 px-6">
                          <PlusCircle className="mr-2 h-4 w-4" /> Add Component
                       </Button>
                    </CardHeader>
                    <CardContent className="p-0">
                       <Table>
                         <TableHeader>
                           <TableRow className="bg-stone-50">
                             <TableHead className="p-6 uppercase text-[9px] font-black tracking-widest">Artisan Component</TableHead>
                             <TableHead className="p-6 uppercase text-[9px] font-black tracking-widest w-32">Qty</TableHead>
                             <TableHead className="p-6 uppercase text-[9px] font-black tracking-widest w-24">Unit</TableHead>
                             <TableHead className="p-6 uppercase text-[9px] font-black tracking-widest">Preparation</TableHead>
                             <TableHead className="p-6 uppercase text-[9px] font-black tracking-widest text-right">Remove</TableHead>
                           </TableRow>
                         </TableHeader>
                         <TableBody>
                           {ingFields.map((field, index) => (
                             <TableRow key={field.id}>
                               <TableCell className="p-6 font-bold text-stone-800">{field.name}</TableCell>
                               <TableCell className="p-6">
                                  <FormField control={form.control} name={`ingredients.${index}.quantity` as any} render={({ field: qField }) => (
                                    <Input type="number" step="0.001" className="h-10 rounded-lg" {...qField} />
                                  )} />
                               </TableCell>
                               <TableCell className="p-6 font-mono text-xs text-stone-400">{field.unit}</TableCell>
                               <TableCell className="p-6">
                                  <FormField control={form.control} name={`ingredients.${index}.preparation` as any} render={({ field: pField }) => (
                                    <Input className="h-10 rounded-lg" placeholder="Melted/Roasted" {...pField} />
                                  )} />
                               </TableCell>
                               <TableCell className="p-6 text-right">
                                  <Button type="button" variant="ghost" size="icon" onClick={() => ingRemove(index)} className="text-destructive hover:bg-destructive/10 h-10 w-10 rounded-xl"><Trash2 className="h-4 w-4" /></Button>
                               </TableCell>
                             </TableRow>
                           ))}
                           {ingFields.length === 0 && (
                             <TableRow><TableCell colSpan={5} className="p-12 text-center text-stone-400 italic">No ingredients added to formulation yet.</TableCell></TableRow>
                           )}
                         </TableBody>
                       </Table>
                    </CardContent>
                    <CardFooter className="p-8 bg-stone-50 border-t justify-between items-center">
                        <div className="flex items-center gap-6">
                           <div className="space-y-1">
                              <p className="text-[9px] font-black uppercase text-stone-400">Total Measured Load</p>
                              <p className="text-2xl font-bold font-headline">{totals.toFixed(2)} g</p>
                           </div>
                        </div>
                        <Badge variant="outline" className="rounded-full px-6 py-2 border-primary/20 text-primary font-black uppercase tracking-widest">Artisan Precision Ready</Badge>
                    </CardFooter>
                  </Card>
                </TabsContent>

                <TabsContent value="process">
                   <Card className="rounded-[2rem] border-none shadow-xl">
                      <CardHeader className="p-10 border-b bg-muted/30 flex flex-row items-center justify-between">
                         <CardTitle className="text-2xl font-headline">Production Workflow</CardTitle>
                         <Button type="button" variant="outline" onClick={() => stepAppend({ id: `S${Date.now()}`, title: '', instructions: '', tempUnit: 'C', order: stepFields.length })} className="rounded-xl border-2">
                            <Layers className="mr-2 h-4 w-4" /> Add Process Step
                         </Button>
                      </CardHeader>
                      <CardContent className="p-10 space-y-8">
                         {stepFields.map((field, index) => (
                           <div key={field.id} className="relative bg-muted/20 p-8 rounded-[2rem] border-2 border-dashed space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
                              <div className="flex items-center justify-between">
                                 <Badge className="h-8 w-8 rounded-full flex items-center justify-center p-0">{(index + 1).toString().padStart(2, '0')}</Badge>
                                 <Button type="button" variant="ghost" size="icon" onClick={() => stepRemove(index)} className="text-destructive"><X className="h-4 w-4" /></Button>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                 <FormField control={form.control} name={`steps.${index}.title` as any} render={({ field: tField }) => (
                                    <FormItem><FormLabel className="uppercase text-[8px] font-black tracking-widest text-muted-foreground">Process Identity</FormLabel><FormControl><Input placeholder="e.g. Initial Melting & Tempering" className="h-10 rounded-xl" {...tField} /></FormControl></FormItem>
                                 )} />
                                 <div className="grid grid-cols-2 gap-4">
                                    <FormField control={form.control} name={`steps.${index}.temperature` as any} render={({ field: tempField }) => (
                                      <FormItem><FormLabel className="uppercase text-[8px] font-black tracking-widest text-muted-foreground">Thermal Target (C)</FormLabel><FormControl><Input type="number" className="h-10 rounded-xl" {...tempField} /></FormControl></FormItem>
                                    )} />
                                    <FormField control={form.control} name={`steps.${index}.time` as any} render={({ field: timeField }) => (
                                      <FormItem><FormLabel className="uppercase text-[8px] font-black tracking-widest text-muted-foreground">Cycle Time (Mins)</FormLabel><FormControl><Input type="number" className="h-10 rounded-xl" {...timeField} /></FormControl></FormItem>
                                    )} />
                                 </div>
                              </div>
                              <FormField control={form.control} name={`steps.${index}.instructions` as any} render={({ field: iField }) => (
                                <FormItem><FormLabel className="uppercase text-[8px] font-black tracking-widest text-muted-foreground">Artisan Instructions</FormLabel><FormControl><Textarea className="rounded-xl" {...iField} /></FormControl></FormItem>
                              )} />
                           </div>
                         ))}
                         {stepFields.length === 0 && (
                           <div className="text-center py-20 text-stone-300 italic border-2 border-dashed rounded-[2rem]">No process steps defined for this formulation.</div>
                         )}
                      </CardContent>
                   </Card>
                </TabsContent>
              </form>
            </Form>
          </Tabs>
        </div>

        <div className="lg:col-span-4 space-y-8">
           <Card className="rounded-[2.5rem] border-none shadow-2xl bg-stone-900 text-white overflow-hidden sticky top-28">
              <CardHeader className="p-10 bg-stone-800/50">
                 <CardTitle className="text-2xl font-headline">Artisan Analytics</CardTitle>
                 <CardDescription className="text-stone-400">Real-time formulation intelligence.</CardDescription>
              </CardHeader>
              <CardContent className="p-10 space-y-10">
                 <div className="space-y-4">
                    <h5 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary flex items-center gap-2"><ShieldAlert className="h-3 w-3" /> Safety Summary</h5>
                    <div className="flex flex-wrap gap-2">
                       {allergens.length > 0 ? (
                         allergens.map(a => <Badge key={a} className="bg-rose-500/10 text-rose-400 border-none rounded-lg">{a}</Badge>)
                       ) : (
                         <span className="text-xs text-stone-500 italic">No allergens detected in matrix.</span>
                       )}
                    </div>
                 </div>

                 <Separator className="bg-stone-800" />

                 <div className="space-y-6">
                    <div className="flex justify-between items-center">
                       <span className="text-[10px] font-black uppercase text-stone-500 tracking-widest">Ingredients Count</span>
                       <span className="font-bold">{watchIngredients.length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                       <span className="text-[10px] font-black uppercase text-stone-500 tracking-widest">Process Steps</span>
                       <span className="font-bold">{stepFields.length}</span>
                    </div>
                    <div className="flex justify-between items-center pt-4 border-t border-stone-800/50">
                       <span className="text-[10px] font-black uppercase text-primary tracking-[0.2em]">Scale Confidence</span>
                       <Badge className="bg-green-500/10 text-green-400 border-none">High-Fidelity</Badge>
                    </div>
                 </div>

                 <div className="pt-6">
                    <p className="text-[9px] text-stone-600 font-bold uppercase tracking-[0.3em] text-center leading-relaxed">
                       This formulation is encrypted and stored in the secure artisan vault.
                    </p>
                 </div>
              </CardContent>
           </Card>
        </div>
      </div>

      <Dialog open={isIngPickerOpen} onOpenChange={setIsIngPickerOpen}>
        <DialogContent className="sm:max-w-3xl rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl bg-stone-50 h-[80vh] flex flex-col">
           <div className="p-8 border-b bg-white">
              <DialogHeader>
                 <DialogTitle className="text-2xl font-headline">Master Library Access</DialogTitle>
                 <DialogDescription>Select an artisan component to add to the formulation.</DialogDescription>
              </DialogHeader>
              <div className="relative mt-6">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                 <Input 
                   placeholder="Search library..." 
                   className="pl-10 h-12 rounded-xl"
                   value={ingSearch}
                   onChange={(e) => setIngPickerSearch(e.target.value)}
                 />
              </div>
           </div>
           
           <ScrollArea className="flex-1 p-8" dual>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {filteredMaster.map(ing => (
                   <button 
                    key={ing.id} 
                    onClick={() => handleAddIngredient(ing)}
                    className="flex items-center justify-between p-4 bg-white rounded-2xl border-2 border-transparent hover:border-primary hover:shadow-lg transition-all group text-left"
                   >
                     <div className="space-y-1">
                        <p className="font-bold text-stone-900 group-hover:text-primary transition-colors">{ing.name}</p>
                        <p className="text-[9px] font-black uppercase tracking-tight text-stone-400">{ing.category}</p>
                     </div>
                     <PlusCircle className="h-5 w-5 text-stone-200 group-hover:text-primary" />
                   </button>
                 ))}
                 {filteredMaster.length === 0 && (
                   <div className="col-span-2 text-center py-20">
                      <p className="text-stone-400 italic">No components found matching your search.</p>
                      <Button variant="link" className="text-primary mt-2" onClick={() => router.push('/ingredients')}>Add to Library</Button>
                   </div>
                 )}
              </div>
           </ScrollArea>
           
           <div className="p-6 border-t bg-white flex justify-end">
              <Button variant="ghost" onClick={() => setIsIngPickerOpen(false)} className="rounded-xl font-bold uppercase text-[10px] tracking-widest">Close Library</Button>
           </div>
        </DialogContent>
      </Dialog>
    </>
  );
}