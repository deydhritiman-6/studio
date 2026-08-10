
'use client';

import { useState, useMemo, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { Vendor, Ingredient, MaterialPurchase, PurchaseItem } from '@/lib/types';
import { 
  PlusCircle, 
  Trash2, 
  Save, 
  Loader2, 
  Search, 
  Wallet, 
  History, 
  FileText, 
  Truck,
  ArrowRight,
  CheckCircle2,
  Calendar,
  IndianRupee,
  Package,
  Droplets,
  ArrowLeft
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useCollection, useFirestore } from '@/firebase';
import { collection, doc, setDoc, updateDoc, deleteDoc, query, orderBy, getDocs, where } from 'firebase/firestore';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const purchaseFormSchema = z.object({
  purchaseDate: z.string().min(1, 'Date is required'),
  vendorId: z.string().min(1, 'Vendor is required'),
  invoiceNumber: z.string().optional(),
  status: z.enum(['Ordered', 'Received', 'Cancelled']).default('Ordered'),
  items: z.array(z.object({
    ingredientId: z.string().min(1, 'Select ingredient'),
    quantity: z.coerce.number().min(0.001),
    unit: z.string().min(1),
    price: z.coerce.number().min(0),
  })).min(1, 'At least one item required'),
});

type PurchaseFormValues = z.infer<typeof purchaseFormSchema>;

export default function MaterialPurchasePage() {
  const firestore = useFirestore();
  const vendorsQuery = useMemo(() => (firestore ? collection(firestore, 'vendors') : null), [firestore]);
  const ingredientsQuery = useMemo(() => (firestore ? collection(firestore, 'ingredients') : null), [firestore]);
  const purchasesQuery = useMemo(() => (firestore ? query(collection(firestore, 'material-purchases'), orderBy('purchaseDate', 'desc')) : null), [firestore]);

  const { data: vendors } = useCollection<Vendor>(vendorsQuery);
  const { data: ingredients } = useCollection<Ingredient>(ingredientsQuery);
  const { data: purchases, loading } = useCollection<MaterialPurchase>(purchasesQuery);

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  const form = useForm<PurchaseFormValues>({
    resolver: zodResolver(purchaseFormSchema),
    defaultValues: {
      purchaseDate: new Date().toISOString().split('T')[0],
      vendorId: '',
      invoiceNumber: '',
      status: 'Received',
      items: [{ ingredientId: '', quantity: 0, unit: 'kg', price: 0 }]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  const watchItems = form.watch('items');
  const totalAmount = useMemo(() => {
    return watchItems.reduce((acc, item) => acc + (item.quantity * item.price), 0);
  }, [watchItems]);

  const onSubmit = async (values: PurchaseFormValues) => {
    if (!firestore) return;
    setIsSaving(true);

    const purchaseId = `PUR-${Date.now()}`;
    const vendor = vendors?.find(v => v.id === values.vendorId);
    
    const purchaseData: MaterialPurchase = {
      ...values,
      id: purchaseId,
      vendorName: vendor?.name || 'Unknown',
      totalAmount,
      items: values.items.map(item => ({
        ...item,
        name: ingredients?.find(i => i.id === item.ingredientId)?.name || 'Unknown Component'
      })),
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    try {
      await setDoc(doc(firestore, 'material-purchases', purchaseId), purchaseData);
      
      // Auto-update Ingredient Library & Inventory if status is 'Received'
      if (values.status === 'Received') {
        for (const item of purchaseData.items) {
          // 1. Update Master Ingredient Price
          const ingRef = doc(firestore, 'ingredients', item.ingredientId);
          await updateDoc(ingRef, {
            purchasePrice: item.price,
            purchaseQuantity: item.quantity,
            purchaseUnit: item.unit,
            updatedAt: new Date().toISOString()
          });

          // 2. Update Inventory Stock Levels
          const masterIng = ingredients?.find(i => i.id === item.ingredientId);
          if (masterIng) {
            const inventoryRef = collection(firestore, 'inventory');
            const q = query(inventoryRef, where('name', '==', masterIng.name));
            const snap = await getDocs(q);
            
            if (!snap.empty) {
              const invDoc = snap.docs[0];
              const currentStock = invDoc.data().stockLevel || 0;
              await updateDoc(invDoc.ref, {
                stockLevel: currentStock + item.quantity,
                status: 'In Stock'
              });
            }
          }
        }
      }

      setIsAddDialogOpen(false);
      form.reset();
      toast({ title: 'Acquisition Logged', description: 'Inventory and pricing matrix synchronized.' });
    } catch (e) {
      toast({ variant: 'destructive', title: 'System Error', description: 'Failed to commit purchase data.' });
    } finally {
      setIsSaving(false);
    }
  };

  const filteredPurchases = useMemo(() => {
    if (!purchases) return [];
    return purchases.filter(p => 
      p.vendorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.id.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [purchases, searchTerm]);

  if (loading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin h-10 w-10 text-primary" /></div>;

  return (
    <>
      <PageHeader 
        title="Material Acquisition" 
        actions={
          <Button onClick={() => setIsAddDialogOpen(true)} className="rounded-xl shadow-lg shadow-primary/20">
            <PlusCircle className="mr-2 h-4 w-4" /> New Purchase Record
          </Button>
        } 
      />

      <div className="grid grid-cols-1 gap-8">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search acquisitions..." 
            className="pl-10 h-11 rounded-xl bg-card border-none shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <Card className="rounded-[2rem] overflow-hidden border-none shadow-xl">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/10">
                  <TableHead className="p-8 uppercase text-[10px] font-black tracking-widest">Reference</TableHead>
                  <TableHead className="p-8 uppercase text-[10px] font-black tracking-widest">Vendor</TableHead>
                  <TableHead className="p-8 uppercase text-[10px] font-black tracking-widest text-center">Items</TableHead>
                  <TableHead className="p-8 uppercase text-[10px] font-black tracking-widest text-right">Investment</TableHead>
                  <TableHead className="p-8 uppercase text-[10px] font-black tracking-widest text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPurchases.map((p) => (
                  <TableRow key={p.id} className="group hover:bg-muted/5 transition-colors">
                    <TableCell className="p-8">
                      <div className="space-y-1">
                        <p className="font-mono text-xs font-bold text-primary">{p.id}</p>
                        <div className="flex items-center gap-2 text-[9px] font-black uppercase text-stone-400">
                           <Calendar className="h-2.5 w-2.5" /> {p.purchaseDate}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="p-8">
                       <p className="font-bold">{p.vendorName}</p>
                       <p className="text-[10px] text-stone-400 font-medium">Inv: {p.invoiceNumber || '---'}</p>
                    </TableCell>
                    <TableCell className="p-8 text-center">
                       <div className="flex justify-center gap-1">
                          {p.items.length} <span className="text-stone-400 font-bold uppercase text-[10px]">Artisan SKUs</span>
                       </div>
                    </TableCell>
                    <TableCell className="p-8 text-right font-black font-headline text-lg">
                       ₹{p.totalAmount.toLocaleString()}
                    </TableCell>
                    <TableCell className="p-8 text-center">
                       <Badge variant="outline" className={cn(
                         "rounded-full px-4 py-1 text-[10px] font-black uppercase tracking-widest border-2",
                         p.status === 'Received' ? 'bg-green-500/10 text-green-600 border-green-500/20' : 
                         p.status === 'Ordered' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' : 
                         'bg-red-500/10 text-red-500 border-red-500/20'
                       )}>
                         {p.status}
                       </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredPurchases.length === 0 && (
                   <TableRow><TableCell colSpan={5} className="p-20 text-center text-stone-400 italic font-headline text-xl">No acquisition records found.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-4xl rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl flex flex-col h-[90vh] bg-background">
          <div className="bg-stone-900 text-white p-8 shrink-0">
             <DialogHeader>
                <div className="flex items-center gap-3 text-primary mb-2">
                   <Wallet className="h-6 w-6" />
                   <span className="text-[10px] font-black uppercase tracking-[0.4em]">Financial Log</span>
                </div>
                <DialogTitle className="text-3xl font-headline">New Acquisition Record</DialogTitle>
                <DialogDescription className="text-stone-400">Commit new materials to inventory and synchronize master pricing.</DialogDescription>
             </DialogHeader>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
               <ScrollArea className="flex-1 px-10 py-10" dual>
                  <div className="space-y-12">
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <FormField control={form.control} name="purchaseDate" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="uppercase text-[9px] font-black tracking-widest text-muted-foreground">Transaction Date</FormLabel>
                            <FormControl><Input type="date" className="h-12 rounded-xl" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="vendorId" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="uppercase text-[9px] font-black tracking-widest text-muted-foreground">Source Vendor</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                               <FormControl><SelectTrigger className="h-12 rounded-xl"><SelectValue placeholder="Select Vendor" /></SelectTrigger></FormControl>
                               <SelectContent>
                                  {vendors?.map(v => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}
                               </SelectContent>
                            </Select>
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="invoiceNumber" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="uppercase text-[9px] font-black tracking-widest text-muted-foreground">Vendor Invoice #</FormLabel>
                            <FormControl><Input className="h-12 rounded-xl" placeholder="e.g. INV/24/001" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                     </div>

                     <div className="space-y-6">
                        <div className="flex items-center justify-between border-b pb-4">
                           <h3 className="text-xl font-headline font-bold flex items-center gap-2">
                             <Package className="h-5 w-5 text-primary" /> Artisan Components
                           </h3>
                           <Button type="button" variant="outline" size="sm" onClick={() => append({ ingredientId: '', quantity: 1, unit: 'kg', price: 0 })} className="rounded-xl border-2">
                             <PlusCircle className="h-4 w-4 mr-2" /> Add Component
                           </Button>
                        </div>
                        
                        <div className="space-y-4">
                           {fields.map((field, index) => (
                             <div key={field.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end bg-muted/20 p-6 rounded-2xl border border-dashed animate-in fade-in slide-in-from-top-4 duration-300">
                                <div className="md:col-span-5">
                                   <FormField control={form.control} name={`items.${index}.ingredientId`} render={({ field: ingField }) => (
                                     <FormItem>
                                       <FormLabel className="uppercase text-[8px] font-black tracking-widest text-stone-400">Ingredient from Master Library</FormLabel>
                                       <Select onValueChange={ingField.onChange} value={ingField.value}>
                                          <FormControl><SelectTrigger className="h-10 rounded-xl bg-background"><SelectValue placeholder="Search library..." /></SelectTrigger></FormControl>
                                          <SelectContent>
                                             {ingredients?.map(i => <SelectItem key={i.id} value={i.id}>{i.name} ({i.category})</SelectItem>)}
                                          </SelectContent>
                                       </Select>
                                     </FormItem>
                                   )} />
                                </div>
                                <div className="md:col-span-2">
                                   <FormField control={form.control} name={`items.${index}.quantity`} render={({ field: qField }) => (
                                      <FormItem><FormLabel className="uppercase text-[8px] font-black tracking-widest text-stone-400">Qty</FormLabel><FormControl><Input type="number" step="0.001" className="h-10 rounded-xl" {...qField} /></FormControl></FormItem>
                                   )} />
                                </div>
                                <div className="md:col-span-2">
                                   <FormField control={form.control} name={`items.${index}.unit`} render={({ field: uField }) => (
                                      <FormItem><FormLabel className="uppercase text-[8px] font-black tracking-widest text-stone-400">Unit</FormLabel><FormControl><Input className="h-10 rounded-xl" {...uField} /></FormControl></FormItem>
                                   )} />
                                </div>
                                <div className="md:col-span-2">
                                   <FormField control={form.control} name={`items.${index}.price`} render={({ field: pField }) => (
                                      <FormItem><FormLabel className="uppercase text-[8px] font-black tracking-widest text-stone-400">Price / Unit</FormLabel><FormControl><Input type="number" className="h-10 rounded-xl" {...pField} /></FormControl></FormItem>
                                   )} />
                                </div>
                                <div className="md:col-span-1 flex justify-end">
                                   <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="h-10 w-10 text-destructive hover:bg-destructive/10 rounded-xl"><Trash2 className="h-4 w-4" /></Button>
                                </div>
                             </div>
                           ))}
                        </div>
                     </div>
                  </div>
               </ScrollArea>

               <div className="p-10 border-t bg-stone-50 shrink-0 flex flex-col md:flex-row items-center justify-between gap-8">
                  <div className="flex items-center gap-10">
                     <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase text-stone-400 tracking-widest">Total Investment</p>
                        <p className="text-4xl font-bold font-headline text-stone-900 tabular-nums">₹{totalAmount.toLocaleString()}</p>
                     </div>
                     <Separator orientation="vertical" className="h-12 hidden md:block" />
                     <FormField control={form.control} name="status" render={({ field }) => (
                        <FormItem className="w-48">
                           <FormLabel className="uppercase text-[9px] font-black tracking-widest text-stone-400">Arrival Stage</FormLabel>
                           <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl><SelectTrigger className="h-10 rounded-full border-2 bg-background font-bold text-[10px] uppercase"><SelectValue /></SelectTrigger></FormControl>
                              <SelectContent>
                                 <SelectItem value="Ordered">Just Ordered</SelectItem>
                                 <SelectItem value="Received">Received & Stocked</SelectItem>
                                 <SelectItem value="Cancelled">Cancelled</SelectItem>
                              </SelectContent>
                           </Select>
                        </FormItem>
                     )} />
                  </div>
                  <div className="flex gap-4 w-full md:w-auto">
                     <DialogClose asChild><Button type="button" variant="ghost" className="flex-1 md:px-8 h-14 rounded-2xl font-bold uppercase text-[10px] tracking-widest">Discard</Button></DialogClose>
                     <Button type="submit" disabled={isSaving || totalAmount === 0} className="flex-2 px-12 h-14 rounded-2xl font-bold uppercase text-[10px] tracking-widest shadow-2xl shadow-primary/20 min-w-[240px]">
                        {isSaving ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                        Commit Record
                     </Button>
                  </div>
               </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}
