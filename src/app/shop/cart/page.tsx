'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Image from 'next/image';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, ShieldCheck, Truck } from 'lucide-react';
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';

export default function CartPage() {
  const [cart, setCart] = useState<any[]>([]);
  const [isClient, setIsClient] = useState(false);

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

  if (cart.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-10 animate-in fade-in zoom-in duration-700">
        <div className="h-40 w-40 bg-stone-100 rounded-full flex items-center justify-center relative shadow-inner">
          <ShoppingBag className="h-16 w-16 text-stone-200" />
          <div className="absolute top-0 right-0 h-10 w-10 bg-white rounded-full flex items-center justify-center shadow-md animate-bounce">
            <span className="text-primary text-xl font-bold">?</span>
          </div>
        </div>
        <div className="text-center space-y-4">
          <h2 className="text-4xl font-bold font-headline text-stone-900">Your basket is waiting</h2>
          <p className="text-stone-400 max-w-sm mx-auto text-lg font-light leading-relaxed">Indulge in our exquisite collection and discover your favorite flavor from our Puducherry workshop.</p>
        </div>
        <Button size="lg" className="h-16 px-16 text-lg rounded-full shadow-xl shadow-primary/20 transition-all hover:scale-105" asChild>
          <Link href="/shop">Browse Collection</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-12 animate-in fade-in duration-1000">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-stone-200 pb-10">
        <div className="space-y-2">
          <h1 className="text-5xl font-bold font-headline text-stone-900 tracking-tight">Your Selection</h1>
          <p className="text-stone-400 font-light text-lg">Review your chosen treats before we prepare them for their journey.</p>
        </div>
        <div className="flex items-center gap-2 text-primary font-bold uppercase tracking-[0.2em] text-[10px]">
          <Truck className="h-4 w-4" /> Priority Artisanal Shipping Included
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
        <div className="lg:col-span-8 space-y-8">
          {cart.map((item) => (
            <div key={item.id} className="group relative bg-white rounded-3xl p-6 flex flex-col sm:flex-row gap-8 shadow-sm hover:shadow-xl transition-all duration-500 border border-stone-100">
              <div className="h-32 w-full sm:w-32 relative rounded-2xl overflow-hidden flex-shrink-0 bg-stone-50">
                <Image src={item.imageUrls[0]} alt={item.name} fill className="object-cover transition-transform duration-700 group-hover:scale-110" />
              </div>
              <div className="flex-grow flex flex-col justify-between py-1">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-headline text-2xl text-stone-900 mb-1 group-hover:text-primary transition-colors">{item.name}</h3>
                    <p className="text-[10px] text-stone-400 tracking-[0.2em] font-bold uppercase">{item.flavor}</p>
                  </div>
                  <p className="font-bold text-2xl text-stone-900 tabular-nums">₹{item.price * item.quantity}</p>
                </div>
                <div className="flex justify-between items-center mt-8">
                  <div className="flex items-center bg-stone-50 border border-stone-100 rounded-2xl p-1 shadow-inner">
                    <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-stone-400 hover:text-stone-900 transition-colors" onClick={() => updateQuantity(item.id, -1)}>
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-12 text-center text-sm font-bold text-stone-700 tabular-nums">{item.quantity}</span>
                    <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-stone-400 hover:text-stone-900 transition-colors" onClick={() => updateQuantity(item.id, 1)}>
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  <Button variant="ghost" size="sm" className="text-stone-300 hover:text-red-500 transition-colors h-10 px-4 rounded-xl font-bold uppercase text-[10px] tracking-widest" onClick={() => removeItem(item.id)}>
                    <Trash2 className="h-4 w-4 mr-2" /> Remove Item
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="lg:col-span-4">
          <Card className="sticky top-28 border-none shadow-2xl bg-stone-900 text-white overflow-hidden rounded-[2rem]">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-3xl -mr-16 -mt-16"></div>
            <CardContent className="p-10 space-y-8 relative z-10">
              <h2 className="text-2xl font-bold font-headline mb-4 text-stone-100">Order Summary</h2>
              <div className="space-y-6">
                  <div className="flex justify-between text-stone-400">
                    <span className="text-sm">Subtotal</span>
                    <span className="font-bold text-stone-100 tabular-nums">₹{subtotal}</span>
                  </div>
                  <div className="flex justify-between text-stone-400 items-center">
                    <span className="text-sm">Bespoke Shipping</span>
                    <span className="text-primary font-black uppercase text-[9px] tracking-[0.2em] bg-primary/10 px-3 py-1 rounded-full border border-primary/20">Complimentary</span>
                  </div>
              </div>
              <Separator className="bg-white/10" />
              <div className="flex justify-between items-baseline">
                <span className="text-stone-300 font-headline text-lg italic">Total</span>
                <span className="text-4xl font-bold text-primary tabular-nums">₹{subtotal}</span>
              </div>
              <Button className="w-full h-20 text-xl mt-6 font-bold shadow-2xl shadow-primary/30 rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98] group" asChild>
                <Link href="/shop/checkout">
                  Begin Checkout <ArrowRight className="ml-3 h-6 w-6 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
              <div className="flex flex-col items-center gap-4 pt-6 opacity-40">
                <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.3em]">
                   <ShieldCheck className="h-3 w-3" /> End-to-End Secure
                </div>
                <div className="flex gap-4 grayscale invert">
                  <div className="w-8 h-5 bg-white/20 rounded-sm"></div>
                  <div className="w-8 h-5 bg-white/20 rounded-sm"></div>
                  <div className="w-8 h-5 bg-white/20 rounded-sm"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
