
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CreditCard, ShieldCheck, Lock, Sparkles, MapPin } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Separator } from '@/components/ui/separator';
import Image from 'next/image';
import { useFirestore } from '@/firebase';
import { collection, doc, setDoc } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

const checkoutSchema = z.object({
  name: z.string().min(2, 'Full name is required'),
  email: z.string().email('Valid email is required'),
  address: z.string().min(5, 'Complete shipping address is required'),
  city: z.string().min(2, 'City is required'),
  zip: z.string().min(6, 'Valid pincode required'),
  cardNumber: z.string().min(16, 'Card number must be 16 digits').max(16),
  expiry: z.string().regex(/^(0[1-9]|1[0-2])\/\d{2}$/, 'Expiry must be MM/YY'),
  cvv: z.string().min(3, 'Required').max(3),
});

export default function CheckoutPage() {
  const [cart, setCart] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const firestore = useFirestore();

  const form = useForm<z.infer<typeof checkoutSchema>>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      name: '',
      email: '',
      address: '',
      city: '',
      zip: '',
      cardNumber: '',
      expiry: '',
      cvv: '',
    },
  });

  useEffect(() => {
    setIsClient(true);
    const saved = localStorage.getItem('roseberry-cart');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) setCart(parsed);
      } catch (e) {}
    }
  }, []);

  if (!isClient) return null;

  const total = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  async function onSubmit(values: z.infer<typeof checkoutSchema>) {
    if (cart.length === 0) {
      toast({ variant: 'destructive', title: 'Basket Empty', description: 'Please add items before checkout.' });
      return;
    }
    
    if (!firestore) return;

    setIsLoading(true);
    
    const orderId = `ORD-WEB-${Date.now().toString().slice(-4)}`;
    const newOrder = {
      id: orderId,
      customerId: `WEB-${values.email.split('@')[0].toUpperCase()}`,
      customerName: values.name,
      orderDate: new Date().toISOString().split('T')[0],
      totalAmount: total,
      products: cart.map(item => ({ productId: item.id, quantity: item.quantity })),
      paymentStatus: 'Paid',
      deliveryStatus: 'Confirmed',
    };

    const orderRef = doc(firestore, 'orders', orderId);

    setDoc(orderRef, newOrder)
      .then(() => {
        localStorage.removeItem('roseberry-cart');
        window.dispatchEvent(new Event('cart-updated'));
        setIsLoading(false);
        router.push('/shop/success');
      })
      .catch(async (error) => {
        setIsLoading(false);
        const permissionError = new FirestorePermissionError({
          path: orderRef.path,
          operation: 'create',
          requestResourceData: newOrder,
        });
        errorEmitter.emit('permission-error', permissionError);
      });
  }

  return (
    <div className="max-w-6xl mx-auto space-y-12 animate-in fade-in duration-1000">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 border-b border-stone-200 pb-10">
        <div className="space-y-2">
            <h1 className="text-5xl font-bold font-headline text-stone-900 tracking-tight leading-tight">Checkout</h1>
            <p className="text-stone-400 font-light text-lg">Finalize your indulgence with our secure, artisanal service.</p>
        </div>
        <div className="flex items-center gap-4 bg-stone-100 px-6 py-3 rounded-full border border-stone-200 shadow-inner">
            <Lock className="h-4 w-4 text-primary" />
            <span className="text-[10px] text-stone-600 font-black uppercase tracking-[0.2em]">AES-256 Encrypted</span>
        </div>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-12 gap-16 xl:gap-24">
          <div className="lg:col-span-7 space-y-12">
            <div className="space-y-8">
              <h2 className="text-2xl font-bold font-headline flex items-center gap-4 text-stone-800">
                <span className="bg-primary text-white h-10 w-10 rounded-2xl flex items-center justify-center text-sm font-sans shadow-lg shadow-primary/20">01</span>
                Destination Details
              </h2>
              <Card className="border-stone-100 shadow-xl rounded-[2rem] bg-white overflow-hidden">
                <CardContent className="p-10 space-y-6">
                  <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-stone-400 uppercase text-[9px] tracking-[0.3em] font-black">Recipient Full Name</FormLabel>
                      <FormControl><Input placeholder="E.g., Priya Kumar" className="bg-stone-50 border-stone-100 rounded-xl h-12 focus:ring-primary/20" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="email" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-stone-400 uppercase text-[9px] tracking-[0.3em] font-black">Confirmation Email</FormLabel>
                      <FormControl><Input type="email" placeholder="priya@luxury.com" className="bg-stone-50 border-stone-100 rounded-xl h-12 focus:ring-primary/20" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="address" render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between">
                        <FormLabel className="text-stone-400 uppercase text-[9px] tracking-[0.3em] font-black">Delivery Address</FormLabel>
                        <MapPin className="h-3 w-3 text-stone-200" />
                      </div>
                      <FormControl><Textarea placeholder="Residence Name, Street, Landmark" className="bg-stone-50 border-stone-100 rounded-xl min-h-[120px] focus:ring-primary/20 resize-none" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <div className="grid grid-cols-2 gap-6">
                     <FormField control={form.control} name="city" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-stone-400 uppercase text-[9px] tracking-[0.3em] font-black">City</FormLabel>
                        <FormControl><Input placeholder="Bengaluru" className="bg-stone-50 border-stone-100 rounded-xl h-12 focus:ring-primary/20" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                     <FormField control={form.control} name="zip" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-stone-400 uppercase text-[9px] tracking-[0.3em] font-black">Pincode</FormLabel>
                        <FormControl><Input placeholder="560001" className="bg-stone-50 border-stone-100 rounded-xl h-12 focus:ring-primary/20" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-8">
              <h2 className="text-2xl font-bold font-headline flex items-center gap-4 text-stone-800">
                <span className="bg-stone-900 text-white h-10 w-10 rounded-2xl flex items-center justify-center text-sm font-sans shadow-lg shadow-stone-900/20">02</span>
                Payment Instrument
              </h2>
              <Card className="border-stone-100 shadow-xl rounded-[2rem] bg-white overflow-hidden">
                <div className="bg-stone-50 p-6 border-b border-stone-100 flex justify-between items-center">
                    <div className="flex items-center gap-3 text-sm font-bold text-stone-700">
                        <CreditCard className="h-5 w-5 text-stone-400" /> Card Payment
                    </div>
                    <div className="flex gap-2 opacity-30 grayscale hover:grayscale-0 transition-all duration-500 cursor-default">
                        <div className="bg-blue-600 text-[7px] text-white font-black p-1.5 rounded uppercase tracking-tighter">VISA</div>
                        <div className="bg-orange-600 text-[7px] text-white font-black p-1.5 rounded uppercase tracking-tighter">MASTER</div>
                    </div>
                </div>
                <CardContent className="p-10 space-y-6">
                   <FormField control={form.control} name="cardNumber" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-stone-400 uppercase text-[9px] tracking-[0.3em] font-black">Card Number</FormLabel>
                      <FormControl><Input placeholder="•••• •••• •••• ••••" className="bg-stone-50 border-stone-100 rounded-xl h-12 text-center tracking-[0.4em] font-mono text-lg focus:ring-primary/20" maxLength={16} {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <div className="grid grid-cols-2 gap-6">
                     <FormField control={form.control} name="expiry" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-stone-400 uppercase text-[9px] tracking-[0.3em] font-black">Expiry Date</FormLabel>
                        <FormControl><Input placeholder="MM / YY" className="bg-stone-50 border-stone-100 rounded-xl h-12 text-center focus:ring-primary/20" maxLength={5} {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                     <FormField control={form.control} name="cvv" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-stone-400 uppercase text-[9px] tracking-[0.3em] font-black">Security Code</FormLabel>
                        <FormControl><Input type="password" placeholder="•••" className="bg-stone-50 border-stone-100 rounded-xl h-12 text-center focus:ring-primary/20" maxLength={3} {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="lg:col-span-5 space-y-8">
             <Card className="bg-stone-900 text-stone-50 border-none shadow-[0_40px_80px_-20px_rgba(28,25,23,0.5)] rounded-[2.5rem] sticky top-28 overflow-hidden">
               <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px] -mr-32 -mt-32"></div>
               <CardHeader className="p-10 pb-4 relative z-10">
                 <CardTitle className="font-headline text-stone-100 text-3xl">Final Review</CardTitle>
                 <p className="text-stone-500 text-xs font-bold uppercase tracking-widest mt-2 flex items-center gap-2">
                   <Sparkles className="h-3 w-3 text-primary" /> Artisanal Packaging Included
                 </p>
               </CardHeader>
               <CardContent className="p-10 pt-4 space-y-8 relative z-10">
                  <div className="max-h-[250px] overflow-y-auto space-y-5 pr-4 scrollbar-thin scrollbar-thumb-white/10">
                    {cart.map((item) => (
                      <div key={item.id} className="flex justify-between items-center group">
                         <div className="flex items-center gap-4">
                            <div className="h-12 w-12 relative rounded-xl overflow-hidden flex-shrink-0 bg-white/5 border border-white/10 group-hover:border-primary/50 transition-colors">
                                <Image src={item.imageUrls?.[0] || 'https://picsum.photos/seed/default/400/300'} alt="" fill className="object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                            </div>
                            <div className="space-y-0.5">
                                <p className="text-sm font-bold text-stone-200 group-hover:text-primary transition-colors">{item.name}</p>
                                <p className="text-[9px] text-stone-500 font-bold uppercase tracking-tighter">Qty: {item.quantity}</p>
                            </div>
                         </div>
                         <span className="font-bold text-stone-100 tabular-nums">₹{item.price * item.quantity}</span>
                      </div>
                    ))}
                  </div>
                  <Separator className="bg-white/5" />
                  <div className="space-y-3">
                    <div className="flex justify-between text-stone-500 text-[10px] font-black uppercase tracking-[0.2em]">
                        <span>Items Subtotal</span>
                        <span className="text-stone-300 tabular-nums">₹{total}</span>
                    </div>
                    <div className="flex justify-between text-stone-500 text-[10px] font-black uppercase tracking-[0.2em]">
                        <span>Luxury Packaging</span>
                        <span className="text-primary">FREE</span>
                    </div>
                    <div className="flex justify-between text-stone-500 text-[10px] font-black uppercase tracking-[0.2em]">
                        <span>Artisan Shipping</span>
                        <span className="text-primary">FREE</span>
                    </div>
                  </div>
                  <Separator className="bg-white/5" />
                  <div className="flex justify-between items-baseline pt-2">
                    <span className="text-stone-400 font-headline text-xl italic">Total Payable</span>
                    <span className="text-5xl font-bold text-primary tracking-tighter tabular-nums">₹{total}</span>
                  </div>
                  <Button type="submit" disabled={isLoading || cart.length === 0} className="w-full h-24 text-2xl font-bold shadow-2xl shadow-primary/40 rounded-2xl mt-10 bg-primary hover:bg-primary/90 text-stone-950 transition-all hover:scale-[1.02] active:scale-[0.98]">
                    {isLoading ? (
                        <div className="flex items-center gap-4">
                            <Loader2 className="animate-spin h-7 w-7" />
                            <span className="tracking-tight italic font-headline">Processing Indulgence...</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-4">
                            <ShieldCheck className="h-7 w-7" />
                            <span>Complete Purchase</span>
                        </div>
                    )}
                  </Button>
                  <div className="flex flex-col items-center gap-6 text-center pt-8">
                    <p className="text-[10px] text-stone-500 text-center uppercase tracking-[0.3em] font-bold leading-relaxed max-w-[280px]">
                        By completing this purchase, you agree to our terms of artisan craftsmanship & luxury service.
                    </p>
                    <div className="flex items-center gap-3 opacity-20 hover:opacity-50 transition-opacity">
                      <ShieldCheck className="h-4 w-4 text-white" />
                      <span className="text-[8px] font-black tracking-widest text-white uppercase">PCI-DSS Compliant Infrastructure</span>
                    </div>
                  </div>
               </CardContent>
             </Card>
          </div>
        </form>
      </Form>
    </div>
  );
}
