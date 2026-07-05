'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Image from 'next/image';
import { 
  Trash2, 
  Plus, 
  Minus, 
  ShoppingBag, 
  ArrowRight, 
  ShieldCheck, 
  Truck, 
  ArrowLeft, 
  Lock, 
  Star, 
  Headphones, 
  CheckCircle,
  CreditCard
} from 'lucide-react';
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export default function CartPage() {
  const [cart, setCart] = useState<any[]>([]);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    try {
      const savedRaw = localStorage.getItem('roseberry-cart');
      if (savedRaw && savedRaw.trim()) {
        const saved = JSON.parse(savedRaw);
        if (Array.isArray(saved)) {
          setCart(saved);
        }
      } else {
        setCart([]);
      }
    } catch (e) {
      console.error('Cart parse error:', e);
      setCart([]);
    }
  }, []);

  const updateQuantity = (id: string, delta: number) => {
    const updated = cart.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    });
    setCart(updated);
    localStorage.setItem('roseberry-cart', JSON.stringify(updated));
    window.dispatchEvent(new Event('cart-updated'));
  };

  const removeItem = (id: string) => {
    const updated = cart.filter(item => item.id !== id);
    setCart(updated);
    localStorage.setItem('roseberry-cart', JSON.stringify(updated));
    window.dispatchEvent(new Event('cart-updated'));
  };

  if (!isClient) return null;

  const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const discount = subtotal > 1000 ? 50 : 0; // Mock discount for visual fidelity
  const total = subtotal - discount;

  if (cart.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 md:py-32 space-y-8 md:space-y-10 animate-in fade-in zoom-in duration-700 px-4">
        <div className="h-32 w-32 md:h-40 md:w-40 bg-stone-100 rounded-full flex items-center justify-center relative shadow-inner">
          <ShoppingBag className="h-12 w-12 md:h-16 md:w-16 text-stone-200" />
          <div className="absolute top-0 right-0 h-8 w-8 md:h-10 md:w-10 bg-white rounded-full flex items-center justify-center shadow-md animate-bounce">
            <span className="text-primary text-lg md:text-xl font-bold">?</span>
          </div>
        </div>
        <div className="text-center space-y-4">
          <h2 className="text-3xl md:text-4xl font-bold font-headline text-stone-900">Your basket is waiting</h2>
          <p className="text-stone-400 max-w-sm mx-auto text-base md:text-lg font-light leading-relaxed">Indulge in our exquisite collection and discover your favorite flavor from our Kolkata workshop.</p>
        </div>
        <Button size="lg" className="h-14 md:h-16 px-12 md:px-16 text-lg rounded-full shadow-xl shadow-primary/20 transition-all hover:scale-105 w-full sm:w-auto" asChild>
          <Link href="/shop">Browse Collection</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-12 animate-in fade-in duration-1000 px-4 md:px-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-12 pt-8">
        <div className="flex flex-col md:flex-row items-center gap-8 text-center md:text-left">
           <div className="w-32 h-32 md:w-48 md:h-48 relative rounded-full overflow-hidden bg-rose-50 shadow-inner">
              <Image 
                src="https://picsum.photos/seed/delivery-cart/400/400" 
                alt="Delivery Interaction" 
                fill 
                className="object-cover" 
                data-ai-hint="delivery illustration"
              />
           </div>
           <div className="space-y-3">
              <h1 className="text-5xl md:text-6xl font-bold font-headline text-stone-900 tracking-tight">Your Cart</h1>
              <p className="text-stone-400 text-lg md:text-xl font-light max-w-md">Review your items and proceed to checkout for a taste of luxury.</p>
              <Badge className="bg-primary/10 text-primary border-none py-1.5 px-4 rounded-full text-xs font-bold mt-2">
                <ShoppingBag className="h-3.5 w-3.5 mr-2" />
                {cart.length} {cart.length === 1 ? 'Item' : 'Items'} in your cart
              </Badge>
           </div>
        </div>
        
        <div className="hidden lg:block w-96 h-80 relative">
          <Image 
            src="https://picsum.photos/seed/cart-full/800/600" 
            alt="Artisanal Cart" 
            fill 
            className="object-contain" 
            data-ai-hint="shopping cart chocolates"
          />
          <div className="absolute -bottom-4 right-10 bg-white shadow-2xl rounded-full p-4 animate-bounce">
             <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 xl:gap-20">
        <div className="lg:col-span-8 space-y-8">
          {cart.map((item) => (
            <div key={item.id} className="group bg-white rounded-[2rem] p-6 md:p-8 flex flex-col sm:flex-row gap-8 shadow-sm hover:shadow-2xl transition-all duration-500 border border-stone-100">
              <div className="h-32 w-full sm:w-40 md:w-48 relative rounded-2xl overflow-hidden flex-shrink-0 bg-stone-50 border border-stone-100">
                <Image src={item.imageUrls[0]} alt={item.name} fill className="object-cover transition-transform duration-700 group-hover:scale-110" />
              </div>
              <div className="flex-grow flex flex-col justify-between py-1">
                <div className="flex justify-between items-start gap-4">
                  <div className="space-y-1">
                    <h3 className="font-headline text-2xl md:text-3xl text-stone-900 group-hover:text-primary transition-colors leading-tight">{item.name}</h3>
                    <div className="flex items-center gap-4 text-xs font-bold text-stone-400 uppercase tracking-widest">
                       <span>{item.flavor}</span>
                       <span className="h-1 w-1 rounded-full bg-stone-200"></span>
                       <span className="text-green-600">In Stock</span>
                    </div>
                  </div>
                  <p className="font-bold text-2xl md:text-3xl text-stone-900 tabular-nums">₹{item.price}</p>
                </div>
                
                <div className="flex flex-wrap justify-between items-center mt-8 gap-4">
                  <div className="flex items-center bg-stone-50 border border-stone-200 rounded-2xl p-1.5 shadow-inner">
                    <Button variant="ghost" size="icon" className="h-10 w-10 md:h-12 md:w-12 rounded-xl text-stone-400 hover:text-stone-900 transition-colors" onClick={() => updateQuantity(item.id, -1)}>
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-12 md:w-16 text-center text-lg font-bold text-stone-700 tabular-nums">{item.quantity}</span>
                    <Button variant="ghost" size="icon" className="h-10 w-10 md:h-12 md:w-12 rounded-xl text-stone-400 hover:text-stone-900 transition-colors" onClick={() => updateQuantity(item.id, 1)}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button 
                    variant="ghost" 
                    className="bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white transition-all h-12 w-12 md:h-14 md:w-14 p-0 rounded-2xl shadow-sm"
                    onClick={() => removeItem(item.id)}
                  >
                    <Trash2 className="h-6 w-6" />
                  </Button>
                </div>
              </div>
            </div>
          ))}

          <div className="pt-4">
            <Button variant="ghost" className="rounded-full px-8 h-14 font-bold text-primary bg-primary/5 hover:bg-primary/10 transition-all group" asChild>
              <Link href="/shop">
                <ArrowLeft className="mr-3 h-5 w-5 transition-transform group-hover:-translate-x-1" /> Continue Shopping
              </Link>
            </Button>
          </div>
        </div>

        <div className="lg:col-span-4">
          <Card className="lg:sticky lg:top-36 border-none shadow-2xl bg-white overflow-hidden rounded-[2.5rem]">
            <CardContent className="p-10 space-y-8">
              <div className="space-y-6">
                  <div className="flex justify-between items-center text-stone-500 font-medium">
                    <span className="text-lg">Subtotal</span>
                    <span className="text-stone-900 font-bold tabular-nums">₹{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-stone-500 font-medium">
                    <span className="text-lg">Shipping</span>
                    <span className="text-green-600 font-black uppercase text-xs tracking-widest bg-green-50 px-3 py-1 rounded-full">FREE</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between items-center text-stone-500 font-medium">
                      <span className="text-lg">Discount</span>
                      <span className="text-rose-500 font-bold tabular-nums">-₹{discount.toFixed(2)}</span>
                    </div>
                  )}
              </div>
              <Separator className="bg-stone-100" />
              <div className="flex justify-between items-baseline">
                <span className="text-stone-900 font-headline text-3xl font-bold">Total</span>
                <span className="text-5xl font-bold text-primary tabular-nums tracking-tighter">₹{total.toFixed(2)}</span>
              </div>
              
              <div className="space-y-4">
                <Button className="w-full h-20 text-xl font-bold shadow-2xl shadow-primary/30 rounded-3xl transition-all hover:scale-[1.02] active:scale-[0.98] group bg-gradient-to-r from-primary to-rose-600 hover:from-primary/90 hover:to-rose-600/90 text-white" asChild>
                  <Link href="/shop/checkout">
                    <Lock className="mr-3 h-6 w-6" /> Proceed to Checkout <ArrowRight className="ml-3 h-6 w-6 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
                <div className="flex items-center justify-center gap-2 text-stone-400 text-xs font-bold uppercase tracking-widest">
                  <ShieldCheck className="h-4 w-4 text-primary" /> 100% Secure Checkout
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-12">
         {[
           { icon: ShieldCheck, title: "Secure Payment", desc: "100% Protected", color: "text-green-600", bg: "bg-green-50" },
           { icon: Truck, title: "Fast Delivery", desc: "Pan India", color: "text-purple-600", bg: "bg-purple-50" },
           { icon: Star, title: "Premium Quality", desc: "Finest Ingredients", color: "text-orange-600", bg: "bg-orange-50" },
           { icon: Headphones, title: "24/7 Support", desc: "We're here to help", color: "text-blue-600", bg: "bg-blue-50" },
         ].map((badge, i) => (
           <div key={i} className="flex items-center gap-4 bg-white p-6 rounded-[2rem] border border-stone-100 shadow-sm hover:shadow-md transition-all group">
              <div className={cn("h-14 w-14 rounded-full flex items-center justify-center transition-transform group-hover:scale-110", badge.bg, badge.color)}>
                 <badge.icon className="h-6 w-6" />
              </div>
              <div>
                <p className="font-bold text-stone-900 group-hover:text-primary transition-colors">{badge.title}</p>
                <p className="text-stone-400 text-xs font-medium">{badge.desc}</p>
              </div>
           </div>
         ))}
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between gap-8 py-10 border-t border-stone-100">
         <div className="flex gap-6 items-center opacity-40 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-700">
            <div className="flex flex-col items-center gap-1">
                <CreditCard className="h-8 w-8" />
                <span className="text-[8px] font-black uppercase tracking-tighter">VISA</span>
            </div>
            <div className="flex flex-col items-center gap-1">
                <CreditCard className="h-8 w-8" />
                <span className="text-[8px] font-black uppercase tracking-tighter">MCARD</span>
            </div>
            <div className="h-10 w-px bg-stone-200 hidden md:block" />
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400">UPI • GPay • Paytm</div>
         </div>

         <div className="flex items-center gap-4 bg-stone-50 px-6 py-3 rounded-full border border-stone-100">
            <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
               <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
               <p className="text-[10px] font-black uppercase tracking-widest text-stone-900">100% Secure</p>
               <p className="text-[8px] font-bold uppercase tracking-tighter text-stone-400">SSL Encrypted Transaction</p>
            </div>
         </div>
      </div>
    </div>
  );
}
