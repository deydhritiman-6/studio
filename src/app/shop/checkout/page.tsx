'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CreditCard, ShieldCheck, Lock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Separator } from '@/components/ui/separator';

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
    if (saved) setCart(JSON.parse(saved));
  }, []);

  if (!isClient) return null;

  const total = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  async function onSubmit(values: z.infer<typeof checkoutSchema>) {
    setIsLoading(true);
    
    // Simulate payment gateway delay
    setTimeout(() => {
      try {
        const existingOrders = JSON.parse(localStorage.getItem('roseberry-orders') || '[]');
        const newOrder = {
          id: `ORD-WEB-${Date.now().toString().slice(-4)}`,
          customerId: `WEB-CUST-${Date.now().toString().slice(-4)}`,
          customerName: values.name,
          orderDate: new Date().toISOString().split('T')[0],
          totalAmount: total,
          products: cart.map(item => ({ productId: item.id, quantity: item.quantity })),
          paymentStatus: 'Paid',
          deliveryStatus: 'Confirmed',
        };
        
        localStorage.setItem('roseberry-orders', JSON.stringify([newOrder, ...existingOrders]));
        localStorage.removeItem('roseberry-cart');
        window.dispatchEvent(new Event('cart-updated'));
        
        setIsLoading(false);
        router.push('/shop/success');
      } catch (error) {
        setIsLoading(false);
        toast({ variant: 'destructive', title: 'System Error', description: 'Failed to process order. Please try again.' });
      }
    }, 2500);
  }

  return (
    <div className="max-w-6xl mx-auto space-y-12 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <h1 className="text-4xl font-bold font-headline text-stone-900">Secure Checkout</h1>
        <div className="flex items-center gap-2 text-stone-400 text-xs font-bold uppercase tracking-widest">
            <Lock className="h-3 w-3" /> End-to-End Encrypted
        </div>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          <div className="space-y-10">
            <div className="space-y-6">
              <h2 className="text-xl font-bold font-headline flex items-center gap-2 border-b pb-4">
                <span className="bg-stone-900 text-white h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-sans">1</span>
                Shipping Information
              </h2>
              <Card className="border-stone-200 shadow-sm">
                <CardContent className="p-6 space-y-4">
                  <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-stone-500 uppercase text-[10px] tracking-widest font-bold">Recipient Full Name</FormLabel>
                      <FormControl><Input placeholder="E.g., Rohan Kumar" className="bg-stone-50/50" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="email" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-stone-500 uppercase text-[10px] tracking-widest font-bold">Email Address</FormLabel>
                      <FormControl><Input type="email" placeholder="rohan@example.com" className="bg-stone-50/50" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="address" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-stone-500 uppercase text-[10px] tracking-widest font-bold">Delivery Address</FormLabel>
                      <FormControl><Textarea placeholder="Apartment, Street, Landmark" className="bg-stone-50/50 min-h-[100px]" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <div className="grid grid-cols-2 gap-4">
                     <FormField control={form.control} name="city" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-stone-500 uppercase text-[10px] tracking-widest font-bold">City</FormLabel>
                        <FormControl><Input placeholder="Bengaluru" className="bg-stone-50/50" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                     <FormField control={form.control} name="zip" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-stone-500 uppercase text-[10px] tracking-widest font-bold">Pincode</FormLabel>
                        <FormControl><Input placeholder="560001" className="bg-stone-50/50" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <h2 className="text-xl font-bold font-headline flex items-center gap-2 border-b pb-4">
                <span className="bg-stone-900 text-white h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-sans">2</span>
                Payment Method
              </h2>
              <Card className="border-stone-200 shadow-sm overflow-hidden">
                <div className="bg-stone-50 p-4 border-b flex justify-between items-center">
                    <div className="flex items-center gap-2 text-sm font-bold text-stone-700">
                        <CreditCard className="h-4 w-4" /> Credit / Debit Card
                    </div>
                    <div className="flex gap-1 opacity-50 grayscale hover:grayscale-0 transition-all cursor-default">
                        <div className="bg-blue-600 text-[8px] text-white font-bold p-1 rounded">VISA</div>
                        <div className="bg-orange-600 text-[8px] text-white font-bold p-1 rounded">MASTER</div>
                    </div>
                </div>
                <CardContent className="p-6 space-y-4">
                   <FormField control={form.control} name="cardNumber" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-stone-500 uppercase text-[10px] tracking-widest font-bold">Card Number</FormLabel>
                      <FormControl><Input placeholder="•••• •••• •••• ••••" className="bg-stone-50/50 text-center tracking-[0.3em] font-mono" maxLength={16} {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <div className="grid grid-cols-2 gap-4">
                     <FormField control={form.control} name="expiry" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-stone-500 uppercase text-[10px] tracking-widest font-bold">Expiry Date</FormLabel>
                        <FormControl><Input placeholder="MM / YY" className="bg-stone-50/50 text-center" maxLength={5} {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                     <FormField control={form.control} name="cvv" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-stone-500 uppercase text-[10px] tracking-widest font-bold">Security Code</FormLabel>
                        <FormControl><Input type="password" placeholder="•••" className="bg-stone-50/50 text-center" maxLength={3} {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="space-y-8">
             <Card className="bg-stone-900 text-stone-50 border-none shadow-2xl shadow-stone-900/40 sticky top-24">
               <CardHeader className="p-8 pb-4">
                 <CardTitle className="font-headline text-stone-100 text-2xl">Final Review</CardTitle>
               </CardHeader>
               <CardContent className="p-8 pt-4 space-y-6">
                  <div className="max-h-[300px] overflow-y-auto space-y-4 pr-2 scrollbar-thin scrollbar-thumb-stone-700">
                    {cart.map((item) => (
                      <div key={item.id} className="flex justify-between items-center text-sm">
                         <div className="flex items-center gap-3">
                            <div className="h-10 w-10 relative rounded overflow-hidden flex-shrink-0">
                                <Image src={item.imageUrls[0]} alt="" fill className="object-cover" />
                            </div>
                            <span>{item.name} <span className="text-stone-500 ml-1">x{item.quantity}</span></span>
                         </div>
                         <span className="font-bold">₹{item.price * item.quantity}</span>
                      </div>
                    ))}
                  </div>
                  <Separator className="bg-stone-800" />
                  <div className="space-y-2">
                    <div className="flex justify-between text-stone-400 text-sm">
                        <span>Items Subtotal</span>
                        <span>₹{total}</span>
                    </div>
                    <div className="flex justify-between text-stone-400 text-sm">
                        <span>Bespoke Packaging</span>
                        <span className="uppercase text-[10px] tracking-widest font-bold text-primary">Free</span>
                    </div>
                  </div>
                  <Separator className="bg-stone-800" />
                  <div className="flex justify-between items-baseline text-2xl font-bold">
                    <span className="text-stone-400 font-headline text-lg">Payable Amount</span>
                    <span className="text-primary">₹{total}</span>
                  </div>
                  <Button type="submit" disabled={isLoading} className="w-full h-20 text-xl font-bold shadow-xl shadow-primary/30 mt-6 bg-primary hover:bg-primary/90 text-stone-900">
                    {isLoading ? (
                        <>
                            <Loader2 className="animate-spin mr-3 h-6 w-6" />
                            Processing Securely...
                        </>
                    ) : (
                        <>
                            <ShieldCheck className="mr-3 h-6 w-6" />
                            Complete Purchase
                        </>
                    )}
                  </Button>
                  <div className="flex flex-col items-center gap-4 text-center pt-4">
                    <p className="text-[10px] text-stone-500 text-center uppercase tracking-widest leading-relaxed">
                        By completing this purchase, you agree to our<br/>terms of artisan craftsmanship & luxury service.
                    </p>
                    <div className="flex gap-4 opacity-30 grayscale invert">
                        <div className="w-10 h-6 bg-stone-100 rounded"></div>
                        <div className="w-10 h-6 bg-stone-100 rounded"></div>
                        <div className="w-10 h-6 bg-stone-100 rounded"></div>
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
