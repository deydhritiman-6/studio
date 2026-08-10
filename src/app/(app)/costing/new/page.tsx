'use client';

import { useState, useMemo, useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
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
  Calculator, 
  Loader2, 
  AlertCircle, 
  CheckCircle2, 
  ShieldCheck, 
  ArrowLeft,
  Save,
  Info,
  Layers,
  Component,
  IndianRupee,
  TrendingUp,
  Package,
  Users,
  Clock
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useCollection, useFirestore, useDoc } from '@/firebase';
import { collection, doc, getDoc } from 'firebase/firestore';
import type { Product, Recipe, Ingredient, Costing, CostingSnapshot } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useRouter, useSearchParams } from 'next/navigation';
import { calculateBasicManufacturingCost } from '../engine';
import { saveCostingAction } from '../actions';

const costingFormSchema = z.object({
  productId: z.string().min(1, 'Product selection is required'),
  status: z.enum(['Draft', 'Calculated', 'Reviewed', 'Approved', 'Archived']).default('Draft'),
  labourHours: z.coerce.number().min(0),
  numWorkers: z.coerce.number().min(1),
  productionYield: z.coerce.number().min(1),
  notes: z.string().optional(),
  
  // Snapshot Inputs
  wastagePercent: z.coerce.number().min(0).max(100).default(5),
  labourRate: z.coerce.number().min(0).default(200),
  labourType: z.enum(['Hour', 'Batch', 'Unit']).default('Hour'),
  overheadRate: z.coerce.number().min(0).default(10),
  overheadType: z.enum(['Fixed', 'Percentage']).default('Percentage'),
  
  packaging: z.object({
    primary: z.coerce.number().min(0).default(0),
    secondary: z.coerce.number().min(0).default(0),
    label: z.coerce.number().min(0).default(0),
    box: z.coerce.number().min(0).default(0),
    other: z.coerce.number().min(0).default(0),
  }),

  pricing: z.object({
    profitPercent: z.coerce.number().min(0).default(40),
    marginPercent: z.coerce.number().min(0).default(20),
  })
});

type CostingFormValues = z.infer<typeof costingFormSchema>;

export default function NewCostingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const firestore = useFirestore();

  const productsQuery = useMemo(() => (firestore ? collection(firestore, 'products') : null), [firestore]);
  const recipesQuery = useMemo(() => (firestore ? collection(firestore, 'recipes') : null), [firestore]);
  const ingredientsQuery = useMemo(() => (firestore ? collection(firestore, 'ingredients') : null), [firestore]);

  const { data: products } = useCollection<Product>(productsQuery);
  const { data: recipes } = useCollection<Recipe>(recipesQuery);
  const { data: ingredients } = useCollection<Ingredient>(ingredientsQuery);

  const duplicateId = searchParams.get('duplicate');
  const costingRef = useMemo(() => (firestore && duplicateId ? doc(firestore, 'costings', duplicateId) : null), [firestore, duplicateId]);
  const { data: sourceCosting } = useDoc<Costing>(costingRef as any);

  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<CostingFormValues>({
    resolver: zodResolver(costingFormSchema),
    defaultValues: {
      productId: '',
      status: 'Calculated',
      labourHours: 1,
      numWorkers: 1,
      productionYield: 1,
      wastagePercent: 5,
      labourRate: 200,
      labourType: 'Hour',
      overheadRate: 10,
      overheadType: 'Percentage',
      packaging: { primary: 0, secondary: 0, label: 0, box: 0, other: 0 },
      pricing: { profitPercent: 40, marginPercent: 20 }
    }
  });

  useEffect(() => {
    if (sourceCosting) {
      form.reset({
        productId: sourceCosting.productId,
        status: 'Calculated',
        labourHours: sourceCosting.labourHours,
        numWorkers: sourceCosting.numWorkers,
        productionYield: sourceCosting.productionYield,
        wastagePercent: sourceCosting.snapshot.wastagePercent,
        labourRate: sourceCosting.snapshot.labourRate,
        labourType: sourceCosting.snapshot.labourType,
        overheadRate: sourceCosting.snapshot.overheadRate,
        overheadType: sourceCosting.snapshot.overheadType,
        packaging: {
          primary: sourceCosting.snapshot.packagingCosts.primary || 0,
          secondary: sourceCosting.snapshot.packagingCosts.secondary || 0,
          label: sourceCosting.snapshot.packagingCosts.label || 0,
          box: sourceCosting.snapshot.packagingCosts.box || 0,
          other: sourceCosting.snapshot.packagingCosts.other || 0,
        },
        pricing: {
          profitPercent: sourceCosting.pricing?.desiredProfitPercent || 40,
          marginPercent: sourceCosting.pricing?.distributorMarginPercent || 20,
        },
        notes: `Duplicated from ${sourceCosting.id}. ${sourceCosting.notes || ''}`,
      });
    }
  }, [sourceCosting, form]);

  const watchAll = useWatch({ control: form.control });
  const selectedProduct = useMemo(() => products?.find(p => p.id === watchAll.productId), [products, watchAll.productId]);
  const activeRecipe = useMemo(() => recipes?.find(r => r.associatedProductId === watchAll.productId || r.id === selectedProduct?.recipeUsed), [recipes, watchAll.productId, selectedProduct]);

  const calculationResults = useMemo(() => {
    if (!activeRecipe || !ingredients || !watchAll.productId) return null;

    const snapshot: CostingSnapshot = {
      ingredientPrices: {},
      packagingCosts: watchAll.packaging as any,
      labourRate: watchAll.labourRate || 0,
      labourType: watchAll.labourType || 'Hour',
      overheadRate: watchAll.overheadRate || 0,
      overheadType: watchAll.overheadType || 'Percentage',
      wastagePercent: watchAll.wastagePercent || 0,
    };

    activeRecipe.ingredients.forEach(ri => {
      const master = ingredients.find(i => i.id === ri.ingredientId);
      if (master) {
        snapshot.ingredientPrices[ri.ingredientId] = {
          purchasePrice: master.purchasePrice || 0,
          purchaseQuantity: master.purchaseQuantity || 1,
          purchaseUnit: master.purchaseUnit || master.defaultUnit
        };
      }
    });

    return calculateBasicManufacturingCost({
      recipe: activeRecipe,
      ingredients,
      snapshot,
      labourHours: watchAll.labourHours || 0,
      numWorkers: watchAll.numWorkers || 1,
      productionYield: watchAll.productionYield || activeRecipe.yield || 1,
    });
  }, [activeRecipe, ingredients, watchAll]);

  const suggestedPrice = useMemo(() => {
    if (!calculationResults) return 0;
    const cost = calculationResults.costPerUnit;
    const withProfit = cost * (1 + (watchAll.pricing?.profitPercent || 0) / 100);
    return withProfit * (1 + (watchAll.pricing?.marginPercent || 0) / 100);
  }, [calculationResults, watchAll.pricing]);

  const onSubmit = async (values: CostingFormValues) => {
    if (!firestore || !calculationResults || !selectedProduct) return;
    setIsSaving(true);

    try {
      const id = `CST-${Date.now().toString().slice(-6)}`;
      const snapshot: CostingSnapshot = {
        ingredientPrices: {},
        packagingCosts: values.packaging as any,
        labourRate: values.labourRate,
        labourType: values.labourType,
        overheadRate: values.overheadRate,
        overheadType: values.overheadType,
        wastagePercent: values.wastagePercent,
      };

      activeRecipe?.ingredients.forEach(ri => {
        const master = ingredients?.find(i => i.id === ri.ingredientId);
        if (master) {
          snapshot.ingredientPrices[ri.ingredientId] = {
            purchasePrice: master.purchasePrice || 0,
            purchaseQuantity: master.purchaseQuantity || 1,
            purchaseUnit: master.purchaseUnit || master.defaultUnit
          };
        }
      });

      const costingData: Costing = {
        id,
        productId: values.productId,
        productName: selectedProduct.name,
        productCode: selectedProduct.sku,
        recipeId: activeRecipe?.id,
        recipeName: activeRecipe?.name,
        recipeVersion: activeRecipe?.currentVersion,
        version: '1.0',
        date: new Date().toISOString(),
        status: values.status,
        snapshot,
        labourHours: values.labourHours,
        numWorkers: values.numWorkers,
        productionYield: values.productionYield,
        results: calculationResults,
        pricing: {
          desiredProfitPercent: values.pricing.profitPercent,
          distributorMarginPercent: values.pricing.marginPercent,
          suggestedRetailPrice: suggestedPrice
        },
        notes: values.notes,
        createdBy: 'Admin Artisan',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await saveCostingAction(costingData);
      toast({ title: 'Simulation Commited', description: `Costing log ${id} has been encrypted and saved.` });
      router.push('/costing');
    } catch (e) {
      toast({ variant: 'destructive', title: 'Action Failed' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full h-12 w-12 border-2"><ArrowLeft className="h-5 w-5" /></Button>
          <div className="space-y-1">
             <h1 className="text-3xl font-headline font-bold">New Financial Simulation</h1>
             <p className="text-[10px] uppercase font-black tracking-widest text-stone-400">Basic Manufacturing Cost Logic</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="h-12 rounded-xl px-8" onClick={() => router.back()}>Discard</Button>
          <Button disabled={isSaving || !calculationResults} onClick={form.handleSubmit(onSubmit)} className="h-12 rounded-xl px-12 shadow-xl shadow-primary/20">
             {isSaving ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2 h-4 w-4" />}
             Commit Costing
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          <Card className="rounded-[2rem] border-none shadow-xl">
            <CardHeader className="p-10 border-b bg-muted/30">
               <CardTitle className="text-2xl font-headline">Artisan Simulation Parameters</CardTitle>
            </CardHeader>
            <CardContent className="p-10">
              <Form {...form}>
                <form className="space-y-10">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <FormField control={form.control} name="productId" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="uppercase text-[9px] font-black tracking-widest text-muted-foreground">Target Product</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                             <FormControl><SelectTrigger className="h-12 rounded-xl"><SelectValue placeholder="Select Product" /></SelectTrigger></FormControl>
                             <SelectContent>
                                {products?.map(p => <SelectItem key={p.id} value={p.id}>{p.name} {p.sku ? `(${p.sku})` : ''}</SelectItem>)}
                             </SelectContent>
                          </Select>
                          {selectedProduct && !activeRecipe && (
                            <p className="text-[10px] text-destructive font-bold mt-2 flex items-center gap-1">
                               <AlertCircle className="h-3 w-3" /> No active recipe linked to this selection.
                            </p>
                          )}
                        </FormItem>
                      )} />
                      <div className="grid grid-cols-2 gap-4">
                        <FormField control={form.control} name="productionYield" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="uppercase text-[9px] font-black tracking-widest text-muted-foreground">Target Yield (Units)</FormLabel>
                            <FormControl><Input type="number" className="h-12 rounded-xl" {...field} /></FormControl>
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="wastagePercent" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="uppercase text-[9px] font-black tracking-widest text-muted-foreground">Wastage Buffer (%)</FormLabel>
                            <FormControl><Input type="number" className="h-12 rounded-xl" {...field} /></FormControl>
                          </FormItem>
                        )} />
                      </div>
                   </div>

                   <Separator className="bg-stone-100" />

                   <div className="space-y-6">
                      <h3 className="text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2">
                        <Users className="h-4 w-4" /> Production & Labour Logic
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <FormField control={form.control} name="labourType" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="uppercase text-[9px] font-black tracking-widest text-muted-foreground">Rate Basis</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                               <FormControl><SelectTrigger className="h-12 rounded-xl"><SelectValue /></SelectTrigger></FormControl>
                               <SelectContent>
                                  {['Hour', 'Batch', 'Unit'].map(t => <SelectItem key={t} value={t}>Per {t}</SelectItem>)}
                               </SelectContent>
                            </Select>
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="labourRate" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="uppercase text-[9px] font-black tracking-widest text-muted-foreground">Artisan Hourly Rate (₹)</FormLabel>
                            <FormControl><Input type="number" className="h-12 rounded-xl" {...field} /></FormControl>
                          </FormItem>
                        )} />
                        <div className="grid grid-cols-2 gap-4">
                            <FormField control={form.control} name="numWorkers" render={({ field }) => (
                              <FormItem>
                                <FormLabel className="uppercase text-[9px] font-black tracking-widest text-muted-foreground">Staff</FormLabel>
                                <FormControl><Input type="number" className="h-12 rounded-xl" {...field} /></FormControl>
                              </FormItem>
                            )} />
                            <FormField control={form.control} name="labourHours" render={({ field }) => (
                              <FormItem>
                                <FormLabel className="uppercase text-[9px] font-black tracking-widest text-muted-foreground">Hours</FormLabel>
                                <FormControl><Input type="number" step="0.5" className="h-12 rounded-xl" {...field} /></FormControl>
                              </FormItem>
                            )} />
                        </div>
                      </div>
                   </div>

                   <Separator className="bg-stone-100" />

                   <div className="space-y-6">
                      <h3 className="text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2">
                        <Package className="h-4 w-4" /> Packaging Materials (Per Batch)
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                         {['primary', 'secondary', 'label', 'box', 'other'].map(key => (
                           <FormField key={key} control={form.control} name={`packaging.${key}` as any} render={({ field }) => (
                            <FormItem>
                              <FormLabel className="uppercase text-[8px] font-bold text-stone-400">{key} Cost</FormLabel>
                              <FormControl><Input type="number" className="h-10 rounded-xl" {...field} /></FormControl>
                            </FormItem>
                           )} />
                         ))}
                      </div>
                   </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-4 space-y-8">
           <Card className="rounded-[2.5rem] border-none shadow-2xl bg-stone-900 text-white overflow-hidden sticky top-28">
              <CardHeader className="p-10 bg-stone-800/50">
                 <CardTitle className="text-2xl font-headline">Live Cost Breakdown</CardTitle>
                 <CardDescription className="text-stone-400">Real-time simulation results.</CardDescription>
              </CardHeader>
              <CardContent className="p-10 space-y-8">
                 {calculationResults ? (
                    <div className="space-y-8">
                        <div className="text-center space-y-2">
                            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Basic Cost Per Unit</p>
                            <p className="text-6xl font-bold font-headline tabular-nums">₹{calculationResults.costPerUnit.toFixed(2)}</p>
                        </div>
                        
                        <Separator className="bg-stone-800" />

                        <div className="space-y-4">
                           <div className="flex justify-between items-center">
                              <span className="text-[10px] font-black uppercase text-stone-500 tracking-widest">Material Load</span>
                              <span className="font-bold">₹{calculationResults.adjustedRawMaterialCost.toFixed(2)}</span>
                           </div>
                           <div className="flex justify-between items-center">
                              <span className="text-[10px] font-black uppercase text-stone-500 tracking-widest">Labour Input</span>
                              <span className="font-bold">₹{calculationResults.totalLabourCost.toFixed(2)}</span>
                           </div>
                           <div className="flex justify-between items-center">
                              <span className="text-[10px] font-black uppercase text-stone-500 tracking-widest">Overhead ({watchAll.overheadRate}%)</span>
                              <span className="font-bold">₹{calculationResults.totalOverheadCost.toFixed(2)}</span>
                           </div>
                        </div>

                        <Separator className="bg-stone-800" />

                        <div className="bg-stone-800/50 p-6 rounded-2xl border border-stone-700/50 space-y-4">
                            <p className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2"><TrendingUp className="h-3 w-3" /> Pricing Strategy</p>
                            <div className="flex justify-between items-baseline">
                               <span className="text-xs text-stone-400 italic">Suggested Retail</span>
                               <span className="text-2xl font-bold text-green-400 tabular-nums">₹{suggestedPrice.toFixed(0)}</span>
                            </div>
                        </div>
                    </div>
                 ) : (
                    <div className="py-20 text-center space-y-4">
                        <Info className="h-10 w-10 mx-auto text-stone-700" />
                        <p className="text-stone-500 text-xs italic px-6">Select a product and ensure it has an active formulation to generate financial intelligence.</p>
                    </div>
                 )}
              </CardContent>
           </Card>
        </div>
      </div>
    </>
  );
}
