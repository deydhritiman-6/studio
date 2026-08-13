
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
import type { Ingredient, AllergenStatus, IngredientFunctionalRole } from '@/lib/types';
import { 
  MoreHorizontal, 
  PlusCircle, 
  Loader2, 
  Search, 
  Filter, 
  Trash2, 
  Edit, 
  Star, 
  Download, 
  X, 
  ShieldAlert,
  Info,
  Beaker,
  ShieldCheck,
  Thermometer,
  Zap
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useCollection, useFirestore } from '@/firebase';
import { collection, doc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const ALLERGENS: (keyof Ingredient['allergens'])[] = [
  'milk', 'egg', 'fish', 'crustacean', 'treeNuts', 'peanuts', 'wheat', 'soy', 'sesame'
];

const FUNCTIONAL_ROLES: IngredientFunctionalRole[] = [
  'Cocoa Base', 'Fat', 'Sweetener', 'Milk Solid', 'Flavour', 
  'Colour', 'Emulsifier', 'Stabilizer', 'Texture', 'Crunch', 
  'Filling', 'Fruit', 'Nut', 'Spice', 'Acidifier', 'Preservative', 
  'Decorative', 'Moisture Controller', 'Shelf-Life Support'
];

const ingredientCategories = [
  'Chocolate & Cocoa', 'Dairy & Milk', 'Sweeteners', 'Nuts & Tree Nuts', 'Peanuts', 
  'Seeds', 'Fruits & Fruit Preparations', 'Indian Spices & Botanicals', 'Coffee & Tea', 
  'Flavourings', 'Emulsifiers & Functional', 'Ganache & Fillings', 'Inclusions & Texture', 
  'Colours & Decoration', 'Salt & Balancers', 'Specialty Flavour Components'
];

const allergenStatusOptions: AllergenStatus[] = ['Contains', 'Does Not Contain', 'May Contain', 'Cross-Contact Risk', 'Unknown'];

const allergenMatrixSchema = z.object({
  milk: z.enum(allergenStatusOptions),
  egg: z.enum(allergenStatusOptions),
  fish: z.enum(allergenStatusOptions),
  crustacean: z.enum(allergenStatusOptions),
  treeNuts: z.enum(allergenStatusOptions),
  peanuts: z.enum(allergenStatusOptions),
  wheat: z.enum(allergenStatusOptions),
  soy: z.enum(allergenStatusOptions),
  sesame: z.enum(allergenStatusOptions),
  glutenFree: z.boolean().default(false),
  vegan: z.boolean().default(false),
  vegetarian: z.boolean().default(false),
  verificationDate: z.string().optional(),
});

const ingredientSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  sku: z.string().optional(),
  category: z.string().min(1, 'Category is required'),
  brand: z.string().optional(),
  supplierName: z.string().optional(),
  origin: z.string().optional(),
  defaultUnit: z.enum(['mg', 'g', 'kg', 'ml', 'L', 'pcs', 'tbsp', 'tsp', 'pinch']),
  description: z.string().optional(),
  
  // Technical Params
  cocoaPercent: z.coerce.number().optional(),
  fatPercent: z.coerce.number().optional(),
  sugarPercent: z.coerce.number().optional(),
  moisturePercent: z.coerce.number().optional(),
  brix: z.coerce.number().optional(),
  ph: z.coerce.number().optional(),
  
  functionalRoles: z.array(z.string()).default([]),
  allergens: allergenMatrixSchema,
  
  storageCondition: z.enum(['Ambient', 'Cool & Dry', 'Refrigerated', 'Frozen', 'Temp Controlled']).default('Ambient'),
  shelfLifeDays: z.coerce.number().optional(),
  
  purchasePrice: z.coerce.number().min(0).optional(),
  purchaseQuantity: z.coerce.number().min(0).optional(),
  purchaseUnit: z.string().optional(),
  isActive: z.boolean().default(true),
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
  const [activeTab, setActiveTab] = useState('basic');
  
  const [itemToDelete, setItemToDelete] = useState<Ingredient | null>(null);
  const [deleteInput, setDeleteInput] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const { toast } = useToast();

  const form = useForm<IngredientFormValues>({
    resolver: zodResolver(ingredientSchema),
    defaultValues: {
      name: '',
      category: 'Chocolate & Cocoa',
      defaultUnit: 'g',
      isActive: true,
      allergens: {
        milk: 'Unknown', egg: 'Unknown', fish: 'Unknown', crustacean: 'Unknown',
        treeNuts: 'Unknown', peanuts: 'Unknown', wheat: 'Unknown', soy: 'Unknown', sesame: 'Unknown',
        glutenFree: false, vegan: false, vegetarian: false
      }
    }
  });

  const watchCategory = form.watch('category');

  useEffect(() => {
    if (editingIngredient) {
      form.reset({
        ...editingIngredient,
        allergens: {
          ...editingIngredient.allergens,
          verificationDate: editingIngredient.allergens.verificationDate || '',
        }
      } as any);
    } else {
      form.reset({ 
        name: '', 
        category: 'Chocolate & Cocoa', 
        defaultUnit: 'g', 
        isActive: true, 
        allergens: {
          milk: 'Unknown', egg: 'Unknown', fish: 'Unknown', crustacean: 'Unknown',
          treeNuts: 'Unknown', peanuts: 'Unknown', wheat: 'Unknown', soy: 'Unknown', sesame: 'Unknown',
          glutenFree: false, vegan: false, vegetarian: false
        }
      });
    }
  }, [editingIngredient, form]);

  const onSave = (values: IngredientFormValues) => {
    if (!firestore) return;

    const id = editingIngredient?.id || `ING-${Date.now()}`;
    const ingRef = doc(firestore, 'ingredients', id);
    const ingData = {
      ...values,
      id,
      updatedAt: new Date().toISOString(),
      createdAt: editingIngredient?.createdAt || new Date().toISOString(),
    };

    setDoc(ingRef, ingData)
      .then(() => {
        setIsAddDialogOpen(false);
        setEditingIngredient(null);
        toast({ title: editingIngredient ? 'Intelligence Refined' : 'Artisan Ingredient Registered' });
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

  const confirmDelete = async () => {
    if (!firestore || !itemToDelete) return;
    setIsDeleting(true);
    deleteDoc(doc(firestore, 'ingredients', itemToDelete.id))
      .then(() => {
        toast({ title: 'Ingredient Removed' });
        setItemToDelete(null);
        setDeleteInput('');
      })
      .finally(() => setIsDeleting(false));
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
        title="Artisan Ingredient Intelligence" 
        actions={
          <div className="flex gap-2">
            <Button variant="outline" className="rounded-xl"><Download className="h-4 w-4 mr-2" /> Export Matrix</Button>
            <Button onClick={() => { setEditingIngredient(null); setIsAddDialogOpen(true); }} className="rounded-xl shadow-lg shadow-primary/20 bg-primary text-stone-950 font-bold">
                <PlusCircle className="mr-2 h-4 w-4" /> Register Ingredient
            </Button>
          </div>
        } 
      />

      <div className="grid grid-cols-1 gap-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
           <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search master library..." 
                className="pl-10 h-11 rounded-xl bg-card border-none shadow-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
           </div>
           <Select value={filterCategory} onValueChange={setFilterCategory}>
             <SelectTrigger className="w-full md:w-64 h-11 rounded-xl">
               <div className="flex items-center gap-2"><Filter className="h-4 w-4" /><SelectValue placeholder="Filter by Category" /></div>
             </SelectTrigger>
             <SelectContent>
               <SelectItem value="all">All Artisan Categories</SelectItem>
               {ingredientCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
             </SelectContent>
           </Select>
        </div>

        <Card className="rounded-[2rem] overflow-hidden border-none shadow-xl">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/10">
                  <TableHead className="p-6 w-12"></TableHead>
                  <TableHead className="p-6 uppercase text-[10px] font-black tracking-widest">Component Identity</TableHead>
                  <TableHead className="p-6 uppercase text-[10px] font-black tracking-widest">Classification</TableHead>
                  <TableHead className="p-6 uppercase text-[10px] font-black tracking-widest">Supplier / Brand</TableHead>
                  <TableHead className="p-6 uppercase text-[10px] font-black tracking-widest text-center">Safety Icons</TableHead>
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
                    <TableCell className="p-6">
                       <div className="space-y-1">
                          <p className="font-bold text-stone-900 leading-none">{ing.name}</p>
                          <p className="text-[9px] font-black uppercase text-stone-400 tracking-tighter">{ing.sku || ing.id}</p>
                       </div>
                    </TableCell>
                    <TableCell className="p-6">
                       <Badge variant="secondary" className="rounded-lg text-[9px] font-black uppercase tracking-tight bg-stone-100 text-stone-500 border-none">
                          {ing.category}
                       </Badge>
                    </TableCell>
                    <TableCell className="p-6">
                       <div className="space-y-1">
                          <p className="text-xs font-medium">{ing.supplierName || '---'}</p>
                          <p className="text-[9px] text-stone-400 font-bold uppercase">{ing.brand || 'No Brand'}</p>
                       </div>
                    </TableCell>
                    <TableCell className="p-6 text-center">
                       <div className="flex justify-center gap-2">
                          {ing.allergens?.vegan && <Badge className="bg-green-600/10 text-green-600 border-none rounded-full h-5 w-5 p-0 flex items-center justify-center" title="Vegan">V</Badge>}
                          {ing.allergens?.glutenFree && <Badge className="bg-blue-600/10 text-blue-600 border-none rounded-full h-5 w-5 p-0 flex items-center justify-center" title="Gluten Free">G</Badge>}
                          {ing.storageCondition === 'Temp Controlled' && <Thermometer className="h-4 w-4 text-rose-500" title="Temp Controlled" />}
                       </div>
                    </TableCell>
                    <TableCell className="p-6 text-right">
                       <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="rounded-xl"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48 rounded-xl">
                            <DropdownMenuItem onClick={() => { setEditingIngredient(ing); setActiveTab('basic'); setIsAddDialogOpen(true); }}><Edit className="h-4 w-4 mr-2" /> Refine Intelligence</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => setItemToDelete(ing)} className="text-destructive"><Trash2 className="h-4 w-4 mr-2" /> Permanent Destroy</DropdownMenuItem>
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

      <Dialog open={isAddDialogOpen} onOpenChange={(o) => { if (!o) { setIsAddDialogOpen(false); setEditingIngredient(null); } }}>
        <DialogContent 
          className="sm:max-w-4xl rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl flex flex-col h-[90vh] bg-background"
        >
          <div className="bg-stone-900 text-white p-8 shrink-0 flex items-center justify-between">
            <DialogHeader className="text-left">
              <DialogTitle className="text-3xl font-headline">{editingIngredient ? 'Refine Intelligence' : 'Register Artisan Component'}</DialogTitle>
              <DialogDescription className="text-[10px] uppercase tracking-[0.2em] font-black text-stone-500">Master Specification Logic</DialogDescription>
            </DialogHeader>
            <DialogClose asChild>
              <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full hover:bg-white/10 text-white"><X className="h-5 w-5" /></Button>
            </DialogClose>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
            <div className="px-8 pt-4 border-b bg-muted/30">
               <TabsList className="bg-transparent h-12 w-full justify-start gap-8">
                  <TabsTrigger value="basic" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none font-bold uppercase text-[10px] tracking-widest h-full">Basic Identity</TabsTrigger>
                  <TabsTrigger value="technical" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none font-bold uppercase text-[10px] tracking-widest h-full">Technical Specs</TabsTrigger>
                  <TabsTrigger value="allergens" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none font-bold uppercase text-[10px] tracking-widest h-full text-rose-500">Safety & Allergens</TabsTrigger>
                  <TabsTrigger value="commercial" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none font-bold uppercase text-[10px] tracking-widest h-full">Procurement & Storage</TabsTrigger>
               </TabsList>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSave)} className="flex flex-col flex-1 overflow-hidden">
                <ScrollArea className="flex-1 px-10 py-10" dual>
                  <TabsContent value="basic" className="space-y-10 mt-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       <FormField control={form.control} name="name" render={({ field }) => (
                         <FormItem>
                            <FormLabel className="uppercase text-[9px] font-black tracking-widest text-stone-400">Ingredient Identity</FormLabel>
                            <FormControl><Input className="h-12 rounded-xl" placeholder="e.g. Criollo Cocoa Mass" {...field} /></FormControl>
                            <FormMessage />
                         </FormItem>
                       )} />
                       <FormField control={form.control} name="category" render={({ field }) => (
                         <FormItem>
                            <FormLabel className="uppercase text-[9px] font-black tracking-widest text-stone-400">Master Category</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                               <FormControl><SelectTrigger className="h-12 rounded-xl"><SelectValue /></SelectTrigger></FormControl>
                               <SelectContent>{ingredientCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}</SelectContent>
                            </Select>
                         </FormItem>
                       )} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                       <FormField control={form.control} name="sku" render={({ field }) => (
                         <FormItem>
                            <FormLabel className="uppercase text-[9px] font-black tracking-widest text-stone-400">SKU / Code</FormLabel>
                            <FormControl><Input className="h-10 rounded-xl" placeholder="RB-CHO-001" {...field} /></FormControl>
                         </FormItem>
                       )} />
                       <FormField control={form.control} name="brand" render={({ field }) => (
                         <FormItem>
                            <FormLabel className="uppercase text-[9px] font-black tracking-widest text-stone-400">Brand / Manufacturer</FormLabel>
                            <FormControl><Input className="h-10 rounded-xl" {...field} /></FormControl>
                         </FormItem>
                       )} />
                       <FormField control={form.control} name="origin" render={({ field }) => (
                         <FormItem>
                            <FormLabel className="uppercase text-[9px] font-black tracking-widest text-stone-400">Country of Origin</FormLabel>
                            <FormControl><Input className="h-10 rounded-xl" placeholder="e.g. Ecuador" {...field} /></FormControl>
                         </FormItem>
                       )} />
                    </div>

                    <div className="space-y-4">
                       <Label className="uppercase text-[9px] font-black tracking-widest text-stone-400">Functional Formulation Roles</Label>
                       <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {FUNCTIONAL_ROLES.map(role => (
                            <div key={role} className="flex items-center gap-2 p-3 bg-muted/20 rounded-xl border border-transparent hover:border-primary/20 transition-all cursor-pointer" onClick={() => {
                                const current = form.getValues('functionalRoles');
                                form.setValue('functionalRoles', current.includes(role) ? current.filter(r => r !== role) : [...current, role]);
                            }}>
                               <Checkbox checked={form.watch('functionalRoles').includes(role)} />
                               <span className="text-[10px] font-bold uppercase">{role}</span>
                            </div>
                          ))}
                       </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="technical" className="space-y-10 mt-0">
                     <div className="bg-stone-50 p-8 rounded-[2rem] border-2 border-dashed space-y-8">
                        <div className="flex items-center gap-3 text-primary mb-4">
                           <Beaker className="h-6 w-6" />
                           <span className="text-[10px] font-black uppercase tracking-[0.3em]">Quality Matrix: {watchCategory}</span>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                           {watchCategory.includes('Chocolate') && (
                             <>
                               <FormField control={form.control} name="cocoaPercent" render={({ field }) => (
                                 <FormItem><FormLabel className="uppercase text-[8px] font-black text-stone-400">Cocoa Total %</FormLabel><FormControl><Input type="number" step="0.1" className="h-10 rounded-lg" {...field} /></FormControl></FormItem>
                               )} />
                               <FormField control={form.control} name="fatPercent" render={({ field }) => (
                                 <FormItem><FormLabel className="uppercase text-[8px] font-black text-stone-400">Total Fat %</FormLabel><FormControl><Input type="number" step="0.1" className="h-10 rounded-lg" {...field} /></FormControl></FormItem>
                               )} />
                             </>
                           )}
                           {watchCategory.includes('Sweetener') && (
                             <FormField control={form.control} name="sugarPercent" render={({ field }) => (
                               <FormItem><FormLabel className="uppercase text-[8px] font-black text-stone-400">Sugar Content %</FormLabel><FormControl><Input type="number" step="0.1" className="h-10 rounded-lg" {...field} /></FormControl></FormItem>
                             )} />
                           )}
                           {watchCategory.includes('Fruit') && (
                             <>
                               <FormField control={form.control} name="brix" render={({ field }) => (
                                 <FormItem><FormLabel className="uppercase text-[8px] font-black text-stone-400">Brix Scale</FormLabel><FormControl><Input type="number" step="0.1" className="h-10 rounded-lg" {...field} /></FormControl></FormItem>
                               )} />
                               <FormField control={form.control} name="ph" render={({ field }) => (
                                 <FormItem><FormLabel className="uppercase text-[8px] font-black text-stone-400">Acidity (pH)</FormLabel><FormControl><Input type="number" step="0.1" className="h-10 rounded-lg" {...field} /></FormControl></FormItem>
                               )} />
                             </>
                           )}
                           <FormField control={form.control} name="moisturePercent" render={({ field }) => (
                             <FormItem><FormLabel className="uppercase text-[8px] font-black text-stone-400">Moisture Load %</FormLabel><FormControl><Input type="number" step="0.1" className="h-10 rounded-lg" {...field} /></FormControl></FormItem>
                           )} />
                        </div>
                     </div>
                  </TabsContent>

                  <TabsContent value="allergens" className="space-y-10 mt-0">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="space-y-6">
                           <h4 className="text-xl font-headline font-bold flex items-center gap-2 text-rose-600">
                             <ShieldAlert className="h-5 w-5" /> Allergen Matrix
                           </h4>
                           <div className="space-y-4">
                              {ALLERGENS.map((a) => (
                                <div key={a} className="grid grid-cols-2 items-center border-b pb-3 border-stone-100">
                                   <span className="text-[10px] font-black uppercase tracking-widest text-stone-500">{a}</span>
                                   <FormField control={form.control} name={`allergens.${a}` as any} render={({ field }) => (
                                      <Select onValueChange={field.onChange} value={field.value}>
                                         <FormControl><SelectTrigger className="h-8 rounded-lg text-[9px] font-bold uppercase"><SelectValue /></SelectTrigger></FormControl>
                                         <SelectContent>{allergenStatusOptions.map(opt => <SelectItem key={opt} value={opt} className="text-[9px]">{opt}</SelectItem>)}</SelectContent>
                                      </Select>
                                   )} />
                                </div>
                              ))}
                           </div>
                        </div>

                        <div className="space-y-8">
                           <div className="p-8 bg-stone-50 rounded-[2rem] border space-y-6">
                              <h5 className="text-xs font-black uppercase tracking-[0.2em] text-stone-400">Certifications</h5>
                              <div className="space-y-4">
                                 {['glutenFree', 'vegan', 'vegetarian'].map(c => (
                                   <div key={c} className="flex items-center justify-between">
                                      <span className="text-[10px] font-bold uppercase">{c.replace(/([A-Z])/g, ' $1').trim()}</span>
                                      <FormField control={form.control} name={`allergens.${c}` as any} render={({ field }) => (
                                         <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                      )} />
                                   </div>
                                 ))}
                              </div>
                           </div>
                           
                           <FormField control={form.control} name="allergens.verificationDate" render={({ field }) => (
                             <FormItem>
                                <FormLabel className="uppercase text-[8px] font-black tracking-widest text-stone-400">Supplier Specification Verification Date</FormLabel>
                                <FormControl><Input type="date" className="h-10 rounded-xl" {...field} /></FormControl>
                                <FormDescription className="text-[8px]">Allergen status should be verified against actual manufacturer documents.</FormDescription>
                             </FormItem>
                           )} />
                        </div>
                     </div>
                  </TabsContent>

                  <TabsContent value="commercial" className="space-y-10 mt-0">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="space-y-8">
                           <div className="flex items-center gap-2 text-primary font-black uppercase text-[10px] tracking-widest border-b pb-2">
                              <Zap className="h-4 w-4" /> Logistics Intelligence
                           </div>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <FormField control={form.control} name="storageCondition" render={({ field }) => (
                                <FormItem>
                                   <FormLabel className="uppercase text-[9px] font-black text-stone-400">Storage Environment</FormLabel>
                                   <Select onValueChange={field.onChange} value={field.value}>
                                      <FormControl><SelectTrigger className="h-10 rounded-xl"><SelectValue /></SelectTrigger></FormControl>
                                      <SelectContent>{['Ambient', 'Cool & Dry', 'Refrigerated', 'Frozen', 'Temp Controlled'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                                   </Select>
                                </FormItem>
                              )} />
                              <FormField control={form.control} name="shelfLifeDays" render={({ field }) => (
                                <FormItem>
                                   <FormLabel className="uppercase text-[9px] font-black text-stone-400">Shelf Life (Days)</FormLabel>
                                   <FormControl><Input type="number" className="h-10 rounded-xl" {...field} /></FormControl>
                                </FormItem>
                              )} />
                           </div>
                        </div>

                        <div className="space-y-8">
                           <div className="flex items-center gap-2 text-primary font-black uppercase text-[10px] tracking-widest border-b pb-2">
                              <Download className="h-4 w-4" /> Procurement Defaults
                           </div>
                           <div className="grid grid-cols-2 gap-4">
                              <FormField control={form.control} name="purchasePrice" render={({ field }) => (
                                <FormItem><FormLabel className="uppercase text-[8px] font-bold text-stone-400">Purchase Rate (₹)</FormLabel><FormControl><Input type="number" className="h-10 rounded-xl" {...field} /></FormControl></FormItem>
                              )} />
                              <FormField control={form.control} name="purchaseUnit" render={({ field }) => (
                                <FormItem><FormLabel className="uppercase text-[8px] font-bold text-stone-400">Rate Unit (kg/L)</FormLabel><FormControl><Input className="h-10 rounded-xl" {...field} /></FormControl></FormItem>
                              )} />
                           </div>
                           <FormField control={form.control} name="defaultUnit" render={({ field }) => (
                              <FormItem>
                                <FormLabel className="uppercase text-[9px] font-black text-stone-400">Artisan Measuring Unit</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                   <FormControl><SelectTrigger className="h-10 rounded-xl"><SelectValue /></SelectTrigger></FormControl>
                                   <SelectContent>{['mg', 'g', 'kg', 'ml', 'L', 'pcs', 'tbsp', 'tsp', 'pinch'].map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
                                </Select>
                              </FormItem>
                           )} />
                        </div>
                     </div>
                  </TabsContent>
                </ScrollArea>

                <div className="p-8 border-t bg-background flex items-center justify-between shrink-0">
                   <div className="flex items-center gap-4">
                      <ShieldCheck className="h-5 w-5 text-green-600" />
                      <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">Certified Artisan Specification System</p>
                   </div>
                   <div className="flex gap-4">
                      <DialogClose asChild><Button type="button" variant="ghost" className="h-12 px-8 rounded-xl font-bold uppercase text-[10px] tracking-widest">Abort</Button></DialogClose>
                      <Button type="submit" disabled={isSaving} className="h-12 px-12 rounded-xl font-bold uppercase text-[10px] tracking-widest shadow-xl shadow-primary/20 bg-primary text-stone-950">
                        {isSaving ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Save className="mr-2 h-4 w-4" />}
                        Commit Intelligence
                      </Button>
                   </div>
                </div>
              </form>
            </Form>
          </Tabs>
        </DialogContent>
      </Dialog>

      <Dialog open={!!itemToDelete} onOpenChange={(o) => { if(!o) { setItemToDelete(null); setDeleteInput(''); } }}>
        <DialogContent className="sm:max-w-md rounded-[2.5rem] border-none shadow-2xl overflow-hidden p-0">
          <div className="bg-destructive/10 p-8 border-b border-destructive/20">
            <DialogHeader>
              <DialogTitle className="text-2xl font-headline flex items-center gap-3 text-destructive">
                <ShieldAlert className="h-8 w-8" />
                Permanent Removal
              </DialogTitle>
              <DialogDescription className="text-stone-600 font-medium">
                Destroying <strong className="text-stone-900">{itemToDelete?.name}</strong> will impact historical recipes and costing logs. This action is irreversible.
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="p-10 space-y-6">
            <div className="space-y-4">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400">Security Verification</Label>
              <p className="text-xs text-stone-500 italic">Type <span className="font-bold text-destructive underline">delete</span> to authorize destruction.</p>
              <Input 
                placeholder="Type here..." 
                value={deleteInput}
                onChange={(e) => setDeleteInput(e.target.value)}
                className="h-14 rounded-2xl border-2 border-stone-200 focus:border-destructive/40 focus:ring-destructive/10 text-center text-lg font-bold tracking-widest"
              />
            </div>
            <div className="flex gap-4">
               <Button variant="ghost" onClick={() => setItemToDelete(null)} className="flex-1 h-12 rounded-xl font-bold uppercase text-[10px] tracking-widest" disabled={isDeleting}>Abort</Button>
               <Button 
                variant="destructive" 
                className="flex-2 px-10 h-12 rounded-xl font-bold uppercase text-[10px] tracking-widest shadow-xl shadow-destructive/20" 
                disabled={deleteInput.toLowerCase() !== 'delete' || isDeleting}
                onClick={confirmDelete}
               >
                 {isDeleting ? <Loader2 className="animate-spin h-4 w-4" /> : 'Final Destroy'}
               </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
