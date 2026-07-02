'use client';

import Link from 'next/link';
import { ShoppingCart, User } from 'lucide-react';
import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  const [cartCount, setCartCount] = useState(0);

  const updateCount = () => {
    try {
      const cart = JSON.parse(localStorage.getItem('roseberry-cart') || '[]');
      const count = Array.isArray(cart) ? cart.reduce((acc: number, item: any) => acc + (item.quantity || 0), 0) : 0;
      setCartCount(count);
    } catch (e) {
      setCartCount(0);
    }
  };

  useEffect(() => {
    updateCount();
    window.addEventListener('cart-updated', updateCount);
    window.addEventListener('storage', updateCount);
    return () => {
      window.removeEventListener('cart-updated', updateCount);
      window.removeEventListener('storage', updateCount);
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-stone-50 font-body">
      <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md px-6 h-20 flex items-center justify-between">
        <Link href="/shop" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
          <Logo className="h-8 w-auto" />
        </Link>
        <div className="flex items-center gap-2 sm:gap-6">
          <Button variant="ghost" asChild className="relative hover:bg-stone-100 rounded-full h-12 w-12 p-0">
             <Link href="/shop/cart" aria-label="View shopping basket">
                <ShoppingCart className="h-5 w-5 text-stone-700" />
                {cartCount > 0 && (
                  <span className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white border-2 border-white">
                    {cartCount}
                  </span>
                )}
             </Link>
          </Button>
        </div>
      </header>
      <main className="flex-1 container mx-auto py-12 px-4 md:px-6 max-w-7xl">
        {children}
      </main>
      <footer className="border-t bg-white py-16 px-6 text-center text-muted-foreground text-sm mt-auto">
        <div className="mb-8 flex justify-center">
            <Logo className="opacity-30 grayscale h-10 w-auto" />
        </div>
        <div className="flex flex-wrap justify-center gap-8 mb-8 text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400">
          <Link href="/shop" className="hover:text-primary transition-colors">Catalog</Link>
          <Link href="/shop/cart" className="hover:text-primary transition-colors">Your Basket</Link>
          <Link href="/login" className="hover:text-primary transition-colors">Wholesale Portal</Link>
          <a href="#" className="hover:text-primary transition-colors">Contact Us</a>
        </div>
        <p className="text-stone-400">&copy; {new Date().getFullYear()} Roseberry Chocolate Puducherry. All rights reserved.</p>
        <p className="mt-4 text-[10px] font-bold uppercase tracking-widest opacity-40">Artisanally crafted for the connoisseur.</p>
      </footer>
    </div>
  );
}
