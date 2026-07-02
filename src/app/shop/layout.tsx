'use client';

import Link from 'next/link';
import { ShoppingCart } from 'lucide-react';
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
      <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur-xl px-6 h-32 flex items-center animate-in fade-in slide-in-from-top-4 duration-1000 overflow-hidden shadow-sm">
        {/* Elegant top accent line with pulsing animation */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-primary via-accent to-primary animate-pulse"></div>
        
        {/* Subtle decorative glow effect */}
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-1/3 h-20 bg-primary/10 blur-[60px] rounded-full pointer-events-none animate-pulse"></div>

        <div className="grid grid-cols-3 w-full items-center">
          {/* Left Column (Spacer) */}
          <div className="flex justify-start"></div>

          {/* Center Column (Logo) */}
          <div className="flex justify-center">
            <Link href="/shop" className="hover:scale-105 transition-transform duration-500 relative z-10 block">
              <Logo className="h-20 w-auto" />
            </Link>
          </div>
          
          {/* Right Column (Actions) */}
          <div className="flex justify-end items-center gap-2 sm:gap-6 relative z-10">
            <Button 
              variant="ghost" 
              asChild 
              className="relative hover:bg-primary/10 hover:text-primary rounded-full h-20 w-20 p-0 transition-all duration-300 group shadow-sm hover:shadow-md"
            >
               <Link href="/shop/cart" aria-label="View shopping basket">
                  <ShoppingCart className="h-12 w-12 text-stone-700 group-hover:scale-110 transition-transform duration-300" />
                  {cartCount > 0 && (
                    <span className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-[12px] font-bold text-white border-2 border-white shadow-lg animate-in zoom-in-50 duration-500">
                      {cartCount}
                    </span>
                  )}
               </Link>
            </Button>
          </div>
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
