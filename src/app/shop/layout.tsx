'use client';

import Link from 'next/link';
import { ShoppingCart, Loader2, Package } from 'lucide-react';
import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { useAuth, useUser } from '@/firebase';
import { signInAnonymously } from 'firebase/auth';

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  const [cartCount, setCartCount] = useState(0);
  const [isAuthInitializing, setIsAuthInitializing] = useState(true);
  const auth = useAuth();
  const { user: firebaseUser, loading: authLoading } = useUser();

  useEffect(() => {
    if (!auth || authLoading) return;

    const initAuth = async () => {
      try {
        if (!firebaseUser) {
          setIsAuthInitializing(true);
          await signInAnonymously(auth);
        }
      } catch (error) {
        console.error('Anonymous auth failed:', error);
      } finally {
        setIsAuthInitializing(false);
      }
    };

    initAuth();
  }, [auth, authLoading, firebaseUser]);

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

  const isReady = !authLoading && !isAuthInitializing && !!firebaseUser;

  return (
    <div className="min-h-screen flex flex-col bg-stone-50 font-body">
      <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur-xl px-4 md:px-6 h-24 md:h-32 flex items-center animate-in fade-in slide-in-from-top-4 duration-1000 overflow-hidden shadow-sm">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-rose-500 via-primary to-orange-400 animate-pulse"></div>
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-1/3 h-20 bg-primary/10 blur-[80px] rounded-full pointer-events-none animate-pulse"></div>

        <div className="flex w-full items-center justify-between gap-2 relative z-10">
          <div className="flex-1 flex justify-start">
            <Button variant="ghost" asChild className="rounded-full px-2 sm:px-6 font-bold uppercase text-[9px] sm:text-[10px] tracking-widest text-stone-500 hover:text-primary transition-colors">
              <Link href="/shop/my-orders">
                <Package className="mr-1 sm:mr-2 h-4 w-4" /> <span className="hidden xs:inline">My Orders</span>
              </Link>
            </Button>
          </div>
          
          <div className="flex-shrink-0">
            <Link href="/shop" className="hover:scale-105 transition-transform duration-500 block">
              <Logo className="h-12 sm:h-16 md:h-20 w-auto drop-shadow-[0_2px_15px_rgba(var(--primary),0.2)]" />
            </Link>
          </div>

          <div className="flex-1 flex justify-end items-center">
            <Button 
              variant="ghost" 
              asChild 
              className="relative hover:bg-primary/10 hover:text-primary rounded-full h-12 w-12 sm:h-16 sm:w-16 md:h-20 md:w-20 p-0 transition-all duration-300 group shadow-sm hover:shadow-md border border-stone-100/50"
            >
               <Link href="/shop/cart" aria-label="View shopping basket">
                  <ShoppingCart className="h-6 w-6 sm:h-8 sm:w-8 md:h-10 md:w-10 text-stone-700 group-hover:scale-110 transition-transform duration-300 group-hover:text-primary" />
                  {cartCount > 0 && (
                    <span className="absolute top-1 right-1 sm:top-2 sm:right-2 flex h-5 w-5 sm:h-7 sm:w-7 items-center justify-center rounded-full bg-gradient-to-tr from-primary to-orange-500 text-[10px] sm:text-[12px] font-bold text-white border-2 border-white shadow-lg animate-in zoom-in-50 duration-500 pulse-glow">
                      {cartCount}
                    </span>
                  )}
               </Link>
            </Button>
          </div>
        </div>
      </header>
      <main className="flex-1 container mx-auto py-8 md:py-12 px-4 md:px-6 max-w-7xl">
        {!isReady ? (
          <div className="flex items-center justify-center py-32">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
        ) : children}
      </main>
      <footer className="border-t bg-white py-12 md:py-16 px-6 text-center text-muted-foreground text-sm mt-auto">
        <div className="mb-8 flex justify-center">
            <Logo className="opacity-30 grayscale h-8 sm:h-10 w-auto" />
        </div>
        <div className="flex flex-wrap justify-center gap-4 sm:gap-8 mb-8 text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400">
          <Link href="/shop" className="hover:text-primary transition-colors">Catalog</Link>
          <Link href="/shop/cart" className="hover:text-primary transition-colors">Your Basket</Link>
          <Link href="/shop/my-orders" className="hover:text-primary transition-colors">Track Orders</Link>
          <Link href="/login" className="hover:text-primary transition-colors">Wholesale Portal</Link>
        </div>
        <p className="text-stone-400 text-xs sm:text-sm">&copy; {new Date().getFullYear()} Roseberry Chocolate Puducherry. All rights reserved.</p>
        <p className="mt-4 text-[8px] sm:text-[10px] font-bold uppercase tracking-widest opacity-40">Artisanally crafted for the connoisseur.</p>
      </footer>
      <style jsx global>{`
        .pulse-glow {
          animation: pulse-glow 2s infinite;
        }
        @keyframes pulse-glow {
          0% { box-shadow: 0 0 0 0 rgba(222, 133, 40, 0.4); }
          70% { box-shadow: 0 0 0 10px rgba(222, 133, 40, 0); }
          100% { box-shadow: 0 0 0 0 rgba(222, 133, 40, 0); }
        }
      `}</style>
    </div>
  );
}
