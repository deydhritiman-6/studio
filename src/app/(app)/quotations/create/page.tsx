
'use client';

import { useState, useMemo } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Printer, PlusCircle, Trash2, ShieldCheck, ClipboardCheck } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useCollection, useFirestore } from '@/firebase';
import { collection, doc, setDoc } from 'firebase/firestore';
import type { Product, Customer } from '@/lib/types';
import { useRouter } from 'next/navigation';

const itemSchema = z.object({
  productId: z.string().min(1, "Product is required."),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1."),
  pricePerUnit: z.coerce.number().min(0, "Price must be positive."),
});

const quotationFormSchema = z.object({
  customerId: z.string().min(1, 'Customer selection is required'),
  expiryDate: z.string().min(1, 'Expiry date is required'),
  items: z.array(itemSchema).min(1, "At least one item is required."),
  notes: z.string().optional(),
  terms: z.string().optional(),
});

type QuotationFormValues = z.infer<typeof quotationFormSchema>;

export default function CreateQuotationPage() {
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const firestore = useFirestore();
  const router = useRouter();

  const productsQuery = useMemo(() => (firestore ? collection(firestore, 'products') : null), [firestore]);
  const customersQuery = useMemo(() => (firestore ? collection(firestore, 'customers') : null), [firestore]);
  
  const { data: products } = useCollection<Product>(productsQuery);
  const { data: customers } = useCollection<Customer>(customersQuery);

  const form = useForm<QuotationFormValues>({
    resolver: zodResolver(quotationFormSchema),
    defaultValues: {
      customerId: '',
      expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Default 7 days
      items: [{ productId: '', quantity: 1, pricePerUnit: 0 }],
      notes: 'This quotation is valid for the products listed below.',
      terms: '1. Prices are subject to availability.\n2. Delivery timelines will be confirmed upon order acceptance.',
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  const watchItems = form.watch('items');
  const subtotal = watchItems.reduce((acc, item) => acc + (item.quantity * item.pricePerUnit), 0);

  async function onSubmit(values: QuotationFormValues) {
    if (!firestore || !customers || !products) return;
    setIsSaving(true);

    const customer = customers.find(c => c.id === values.customerId);
    const quotationId = `QTN-${Date.now().toString().slice(-6)}`;
    
    const quotationData = {
      id: quotationId,
      customerId: values.customerId,
      customerName: customer?.name || 'Unknown',
      date: new Date().toISOString().split('T')[0],
      expiryDate: values.expiryDate,
      totalAmount: subtotal,
      status: 'Draft',
      notes: values.notes,
      terms: values.terms,
      items: values.items.map(item => ({
        ...item,
        productName: products.find(p => p.id === item.productId)?.name || 'Unknown Product',
        total: item.quantity * item.pricePerUnit
      }))
    };

    const qRef = doc(firestore, 'quotations', quotationId);

    setDoc(qRef, quotationData)
      .then(() => {
        toast({ title: 'Quotation Created', description: `Quotation ${quotationId} has been registered.` });
        router.push('/quotations');
      })
      .catch(() => {
        toast({ variant: 'destructive', title: 'Save Failed' });
      })
      .finally(() => setIsSaving(true));
  }

  return (
    <>
      <PageHeader title="New Artisan Quotation" />
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Card className="rounded-[2rem] border-none shadow-xl">
              <CardHeader className="p-10 pb-6 border-b">
                <CardTitle className="text-2xl font-headline flex items-center gap-3">
                    <ClipboardCheck className="h-6 w-6 text-primary" />
                    Quotation Line Items
                </CardTitle>
              </CardHeader>
              <CardContent className="p-10">
                <div className="space-y-6">
                  {fields.map((field, index) => (
                    <div key={field.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end animate-in fade-in zoom-in-95">
                      <div className="md:col-span-6">
                        <FormField control={form.control} name={`items.${index}.productId`} render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Product</FormLabel>
                            <Select onValueChange={(val) => {
                                field.onChange(val);
                                const price = products?.find(p => p.id === val)?.price || 0;
                                form.setValue(`items.${index}.pricePerUnit`, price);
                            }} value={field.value}>
                              <FormControl>
                                <SelectTrigger className="h-11 rounded-xl">
                                  <SelectValue placeholder="Select product" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {products?.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )} />
                      </div>
                      <div className="md:col-span-2">
                        <FormField control={form.control} name={`items.${index}.quantity`} render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Qty</FormLabel>
                            <FormControl><Input type="number" className="h-11 rounded-xl" {...field} /></FormControl>
                          </FormItem>
                        )} />
                      </div>
                      <div className="md:col-span-3">
                         <FormField control={form.control} name={`items.${index}.pricePerUnit`} render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Rate (₹)</FormLabel>
                            <FormControl><Input type="number" className="h-11 rounded-xl" {...field} /></FormControl>
                          </FormItem>
                        )} />
                      </div>
                      <div className="md:col-span-1 flex justify-end">
                        <Button type="button" variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10 h-11 w-11 rounded-xl" onClick={() => remove(index)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  <Button type="button" variant="outline" className="w-full h-12 rounded-xl border-dashed border-2 border-stone-200 text-stone-400 font-bold uppercase text-[10px] tracking-widest hover:border-primary/30 hover:text-primary transition-all" onClick={() => append({ productId: '', quantity: 1, pricePerUnit: 0 })}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Item
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-[2rem] border-none shadow-xl">
              <CardHeader className="p-10 pb-6 border-b">
                <CardTitle className="text-xl font-headline">Notes & Clauses</CardTitle>
              </CardHeader>
              <CardContent className="p-10 space-y-6">
                <FormField control={form.control} name="notes" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Artisan Notes</FormLabel>
                    <FormControl><Textarea className="rounded-xl min-h-[100px]" {...field} /></FormControl>
                  </FormItem>
                )} />
                <FormField control={form.control} name="terms" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Terms & Conditions</FormLabel>
                    <FormControl><Textarea className="rounded-xl min-h-[100px]" {...field} /></FormControl>
                  </FormItem>
                )} />
              </CardContent>
            </Card>
          </div>

          <div className="space-y-8">
            <Card className="rounded-[2.5rem] border-none shadow-2xl bg-stone-900 text-white overflow-hidden sticky top-28">
              <CardHeader className="p-10 pb-6 bg-stone-800/50">
                <CardTitle className="text-2xl font-headline">Summary</CardTitle>
                <CardDescription className="text-stone-400">Patron and validity details.</CardDescription>
              </CardHeader>
              <CardContent className="p-10 space-y-8">
                <FormField control={form.control} name="customerId" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-black uppercase tracking-widest text-stone-500">Target Patron</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-12 rounded-xl bg-stone-800 border-none">
                          <SelectValue placeholder="Select Patron" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {customers?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )} />
                
                <FormField control={form.control} name="expiryDate" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-black uppercase tracking-widest text-stone-500">Validity Until</FormLabel>
                    <FormControl><Input type="date" className="h-12 rounded-xl bg-stone-800 border-none" {...field} /></FormControl>
                  </FormItem>
                )} />

                <Separator className="bg-stone-800" />

                <div className="flex justify-between items-baseline pt-4">
                    <span className="text-stone-500 font-bold uppercase text-[10px] tracking-widest">Estimated Value</span>
                    <span className="text-4xl font-bold text-primary tabular-nums">₹{subtotal.toLocaleString('en-IN')}</span>
                </div>

                <Button type="submit" disabled={isSaving || subtotal === 0} className="w-full h-16 text-lg font-bold rounded-2xl shadow-2xl shadow-primary/20 bg-primary text-stone-950 transition-all hover:scale-[1.02] active:scale-[0.98]">
                    {isSaving ? <Loader2 className="animate-spin h-6 w-6" /> : <ShieldCheck className="mr-2 h-6 w-6" />}
                    Commit Quotation
                </Button>

                <div className="text-center">
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-stone-600">Secure Database Synchronization</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </form>
      </Form>
    </>
  );
}
