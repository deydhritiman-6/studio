'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Image from 'next/image';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';

export default function CartPage() {
  const [cart, setCart] = useState<any[]>([]);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const saved = localStorage.getItem('roseberry-cart');
    if (saved) setCart(JSON.parse(saved));
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
      <div className="flex flex-col items-center justify-center py-32 space-y-8 animate-in fade-in zoom-in duration-500">
        <div className="h-32 w-32 bg-stone-100 rounded-full flex items-center justify-center">
          <ShoppingBag className="h-16 w-16 text-stone-300" />
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold font-headline text-stone-900">Your basket is waiting</h2>
          <p className="text-stone-500 max-w-sm">Indulge in our exquisite collection and discover your favorite flavor.</p>
        </div>
        <Button size="lg" className="h-14 px-12" asChild>
          <Link href="/shop">Browse Collection</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-12 animate-in fade-in duration-500">
      <h1 className="text-4xl font-bold font-headline text-stone-900">Your Selection</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-6">
          {cart.map((item) => (
            <Card key={item.id} className="overflow-hidden border-stone-200 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6 flex gap-8">
                <div className="h-28 w-28 relative rounded-xl overflow-hidden flex-shrink-0 bg-stone-100">
                  <Image src={item.imageUrls[0]} alt={item.name} fill className="object-cover" />
                </div>
                <div className="flex-grow flex flex-col justify-between py-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-lg text-stone-900 mb-1">{item.name}</h3>
                      <p className="text-sm text-stone-500 tracking-wide uppercase">{item.flavor}</p>
                    </div>
                    <p className="font-bold text-xl text-primary">₹{item.price * item.quantity}</p>
                  </div>
                  <div className="flex justify-between items-center mt-4">
                    <div className="flex items-center bg-stone-50 border rounded-lg p-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-stone-400 hover:text-stone-900" onClick={() => updateQuantity(item.id, -1)}>
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-10 text-center text-sm font-bold text-stone-700">{item.quantity}</span>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-stone-400 hover:text-stone-900" onClick={() => updateQuantity(item.id, 1)}>
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <Button variant="ghost" size="sm" className="text-stone-400 hover:text-red-500" onClick={() => removeItem(item.id)}>
                      <Trash2 className="h-4 w-4 mr-2" /> Remove
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="lg:col-span-1">
          <Card className="sticky top-24 border-stone-200 shadow-xl bg-white border-t-4 border-t-primary">
            <CardContent className="p-8 space-y-6">
              <h2 className="text-2xl font-bold font-headline text-stone-900 mb-4">Summary</h2>
              <div className="space-y-4">
                  <div className="flex justify-between text-stone-500">
                    <span>Subtotal</span>
                    <span className="font-medium text-stone-900">₹{subtotal}</span>
                  </div>
                  <div className="flex justify-between text-stone-500">
                    <span>Standard Shipping</span>
                    <span className="text-green-600 font-bold uppercase text-[10px] tracking-widest bg-green-50 px-2 py-1 rounded">Complimentary</span>
                  </div>
              </div>
              <Separator />
              <div className="flex justify-between items-baseline">
                <span className="text-stone-900 font-bold">Total</span>
                <span className="text-3xl font-bold text-primary">₹{subtotal}</span>
              </div>
              <Button className="w-full h-16 text-xl mt-6 font-bold shadow-lg shadow-primary/20" asChild>
                <Link href="/shop/checkout">
                  Secure Checkout <ArrowRight className="ml-3 h-6 w-6" />
                </Link>
              </Button>
              <div className="flex items-center justify-center gap-2 text-[10px] text-stone-400 font-bold uppercase tracking-widest pt-4">
                 <ShoppingBag className="h-3 w-3" /> Artisanally packaged with care
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
