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
      const count = cart.reduce((acc: number, item: any) => acc + item.quantity, 0);
      setCartCount(count);
    } catch (e) {
      setCartCount(0);
    }
  };

  useEffect(() => {
    updateCount();
    window.addEventListener('cart-updated', updateCount);
    return () => window.removeEventListener('cart-updated', updateCount);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-stone-50">
      <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md px-6 h-16 flex items-center justify-between">
        <Link href="/shop" className="flex items-center gap-2">
          <Logo />
        </Link>
        <div className="flex items-center gap-4">
          <Button variant="ghost" asChild className="relative">
             <Link href="/shop/cart" aria-label="View shopping basket">
                <ShoppingCart className="h-5 w-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
                    {cartCount}
                  </span>
                )}
             </Link>
          </Button>
          <Button variant="outline" asChild className="hidden sm:flex">
            <Link href="/login">Staff Portal</Link>
          </Button>
        </div>
      </header>
      <main className="flex-1 container mx-auto py-8 px-4 md:px-6">
        {children}
      </main>
      <footer className="border-t bg-white py-12 px-6 text-center text-muted-foreground text-sm mt-auto">
        <div className="mb-6 flex justify-center">
            <Logo className="opacity-50 grayscale" />
        </div>
        <p>&copy; {new Date().getFullYear()} Roseberry Chocolate. All rights reserved.</p>
        <p className="mt-2 text-xs opacity-60">Artisanally crafted for the connoisseur.</p>
      </footer>
    </div>
  );
}
