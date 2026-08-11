'use client';

import Link from 'next/link';
import { Loader2, Home } from 'lucide-react';
import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { useAuth, useUser } from '@/firebase';
import { signInAnonymously } from 'firebase/auth';
import Image from 'next/image';
import { cn } from '@/lib/utils';

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  const [isAuthInitializing, setIsAuthInitializing] = useState(true);
  const [cartCount, setCartCount] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const auth = useAuth();
  const { user: firebaseUser, loading: authLoading } = useUser();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const updateCount = () => {
      try {
        const cartRaw = localStorage.getItem('roseberry-cart');
        if (cartRaw && cartRaw.trim()) {
          const cart = JSON.parse(cartRaw);
          const count = Array.isArray(cart) ? cart.reduce((acc: number, item: any) => acc + (item.quantity || 1), 0) : 0;
          setCartCount(count);
        } else {
          setCartCount(0);
        }
      } catch (e) {
        console.error('Cart parse error:', e);
        setCartCount(0);
      }
    };

    updateCount();
    window.addEventListener('cart-updated', updateCount);
    window.addEventListener('storage', updateCount);
    return () => {
      window.removeEventListener('cart-updated', updateCount);
      window.removeEventListener('storage', updateCount);
    };
  }, []);

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

  const isReady = !authLoading && !isAuthInitializing && !!firebaseUser;
  const isShrunk = isScrolled && !isHovered;

  return (
    <div className="min-h-screen flex flex-col bg-stone-50 font-body">
      <header 
        className={cn(
          "sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur-xl px-4 md:px-6 flex items-center animate-in fade-in duration-1000 overflow-hidden shadow-sm",
          isShrunk ? "h-8 md:h-11" : "h-24 md:h-32"
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-rose-500 via-primary to-orange-400 animate-pulse"></div>
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-1/3 h-20 bg-primary/10 blur-[80px] rounded-full pointer-events-none animate-pulse"></div>

        <div className={cn(
          "flex w-full items-center justify-between gap-2 relative z-10",
          isShrunk ? "scale-50 opacity-80" : "scale-100 opacity-100"
        )}>
          <div className="flex-1 flex justify-start items-center gap-2 md:gap-4">
            <Button 
              variant="default" 
              asChild 
              className={cn(
                "hidden lg:flex rounded-full px-6 h-12 border-none font-bold uppercase text-[10px] tracking-widest transition-all shadow-lg hover:scale-105 active:scale-95"
              )}
            >
              <Link href="/">
                Go to Home Page
              </Link>
            </Button>
            <Button 
              variant="default" 
              asChild 
              className="lg:hidden h-12 w-12 rounded-full border-none p-0 shadow-lg"
            >
              <Link href="/" title="Home">
                <Home className="h-5 w-5" />
              </Link>
            </Button>

            <Button 
              variant="ghost" 
              asChild 
              className="relative hover:bg-stone-50 hover:text-primary rounded-full h-16 w-16 md:h-24 md:w-24 p-0 transition-all duration-300 group shadow-sm hover:shadow-md border border-stone-100/50 overflow-hidden"
            >
              <Link href="/shop/my-orders" title="Track My Orders">
                <div className="relative w-full h-full p-2 md:p-4">
                  <div className="relative w-full h-full">
                    <Image 
                      src="/delivery.jpeg" 
                      alt="Artisan Delivery" 
                      fill 
                      className="object-contain transition-transform duration-300 group-hover:scale-110" 
                      priority
                      sizes="(max-width: 768px) 64px, 100px"
                    />
                  </div>
                </div>
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
              className="relative hover:bg-stone-50 hover:text-primary rounded-full h-16 w-16 md:h-24 md:w-24 p-0 transition-all duration-300 group shadow-sm hover:shadow-md border border-stone-100/50 overflow-hidden"
            >
              <Link href="/shop/cart" title="Your Selection Basket">
                <div className="relative w-full h-full p-2 md:p-4">
                  <div className="relative w-full h-full">
                    <Image 
                      src="/cart2.jpeg" 
                      alt="Artisan Cart" 
                      fill 
                      className="object-contain transition-transform duration-300 group-hover:scale-110" 
                      priority
                      sizes="(max-width: 768px) 64px, 100px"
                    />
                  </div>
                </div>
                {cartCount > 0 && (
                  <span className="absolute top-2 right-2 flex h-6 w-6 md:h-8 md:w-8 items-center justify-center rounded-full bg-gradient-to-br from-rose-500 to-primary text-[10px] md:text-xs font-black text-white shadow-lg border-2 border-white animate-in zoom-in duration-300 z-20">
                    {cartCount}
                  </span>
                )}
              </Link>
            </Button>
          </div>
        </div>
      </header>
      <main className="flex-1 container mx-auto pt-0 pb-4 md:pt-2 md:pb-6 px-4 md:px-6 max-w-7xl">
        {!isReady ? (
          <div className="flex items-center justify-center py-32">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
        ) : children}
      </main>
      <footer className="border-t bg-white py-12 md:py-16 px-6 text-center text-muted-foreground text-sm mt-auto max-w-[50%] mx-auto w-full rounded-b-3xl shadow-sm">
        <div className="mb-8 flex justify-center">
            <Logo className="opacity-30 grayscale h-8 sm:h-10 w-auto" />
        </div>
        <div className="flex flex-wrap justify-center gap-4 sm:gap-8 mb-8 text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400">
          <Link href="/shop" className="hover:text-primary transition-colors">Catalog</Link>
          <Link href="/shop/cart" className="hover:text-primary transition-colors">Your Basket</Link>
          <Link href="/shop/my-orders" className="hover:text-primary transition-colors">Track Orders</Link>
          <Link href="/login" className="hover:text-primary transition-colors">Wholesale Portal</Link>
        </div>
        <p className="text-stone-400 text-xs sm:text-sm">&copy; {new Date().getFullYear()} Roseberry Chocolate Kolkata. All rights reserved.</p>
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
