'use client';

import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { useAuth, useUser } from '@/firebase';
import { signInAnonymously } from 'firebase/auth';
import Image from 'next/image';

const DeliveryIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 64 64"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    {/* Delivery Person (Left) */}
    <circle cx="18" cy="16" r="6" strokeWidth="3" />
    <path d="M6 48c0-8 6-12 12-12h4l10 10" strokeWidth="3" />
    
    {/* The Artisan Chocolate Box (Center) */}
    <rect x="22" y="30" width="20" height="14" rx="2" fill="currentColor" fillOpacity="0.15" strokeWidth="2.5" />
    <path d="M22 37h20" strokeWidth="1" opacity="0.6" />
    <path d="M32 30v14" strokeWidth="1" opacity="0.6" />
    
    {/* Patron/Client (Right) */}
    <circle cx="48" cy="20" r="5" strokeWidth="3" />
    <path d="M58 52c0-6-4-10-10-10h-2l-6-6" strokeWidth="3" />
    
    {/* Subtle Floor indicator */}
    <path d="M12 58h40" strokeWidth="1.5" opacity="0.2" />
  </svg>
);

const ArtisanCartIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    {/* Cart handle and frame */}
    <path d="M15 25H25L30 65H80L85 30H27" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="35" cy="75" r="4.5" fill="currentColor" />
    <circle cx="75" cy="75" r="4.5" fill="currentColor" />
    
    {/* Boxes inside - Colorful boxes mimicking the reference */}
    <rect x="33" y="20" width="14" height="24" rx="1.5" fill="#5b6e92" transform="rotate(-6 33 20)" />
    <rect x="49" y="15" width="16" height="26" rx="1.5" fill="#74a4bc" transform="rotate(4 49 15)" />
    <rect x="40" y="35" width="15" height="22" rx="1.5" fill="#c48c6a" transform="rotate(-12 40 35)" />
    <rect x="58" y="30" width="13" height="24" rx="1.5" fill="#d49a8e" transform="rotate(7 58 30)" />
    <rect x="70" y="18" width="12" height="30" rx="1.5" fill="#8d6e63" transform="rotate(3 70 18)" />
    
    {/* Heart Badge on side of cart */}
    <circle cx="65" cy="60" r="9" fill="#d49a8e" stroke="white" strokeWidth="1.5" />
    <path d="M65 63C65 63 61.5 60.5 61.5 58.5C61.5 57.1193 62.6193 56 64 56C64.8414 56 65 56.5 65 57C65 56.5 65.1586 56 66 56C67.3807 56 68.5 57.1193 68.5 58.5C68.5 60.5 65 63 65 63Z" fill="white" />
    
    {/* Illustrative Sparkles */}
    <path d="M25 10L26.5 14L30.5 15.5L26.5 17L25 21L23.5 17L19.5 15.5L23.5 14L25 10Z" fill="#ffd700" opacity="0.7" />
    <path d="M88 55L89 58L92 59L89 60L88 63L87 60L84 59L87 58L88 55Z" fill="#ffd700" opacity="0.7" />
  </svg>
);

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  const [isAuthInitializing, setIsAuthInitializing] = useState(true);
  const [cartCount, setCartCount] = useState(0);
  const auth = useAuth();
  const { user: firebaseUser, loading: authLoading } = useUser();

  useEffect(() => {
    const updateCount = () => {
      const cart = JSON.parse(localStorage.getItem('roseberry-cart') || '[]');
      const count = Array.isArray(cart) ? cart.reduce((acc: number, item: any) => acc + (item.quantity || 1), 0) : 0;
      setCartCount(count);
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

  return (
    <div className="min-h-screen flex flex-col bg-stone-50 font-body">
      <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur-xl px-4 md:px-6 h-24 md:h-32 flex items-center animate-in fade-in slide-in-from-top-4 duration-1000 overflow-hidden shadow-sm">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-rose-500 via-primary to-orange-400 animate-pulse"></div>
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-1/3 h-20 bg-primary/10 blur-[80px] rounded-full pointer-events-none animate-pulse"></div>

        <div className="flex w-full items-center justify-between gap-2 relative z-10">
          <div className="flex-1 flex justify-start">
            <Button 
              variant="ghost" 
              asChild 
              className="relative hover:bg-stone-50 hover:text-primary rounded-full h-16 w-16 md:h-24 md:w-24 p-0 transition-all duration-300 group shadow-sm hover:shadow-md border border-stone-100/50"
            >
              <Link href="/shop/my-orders" title="Track My Orders">
                <DeliveryIcon className="h-13 w-13 md:h-20 md:w-20 text-stone-700 transition-transform duration-300 group-hover:scale-110" />
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
              className="relative hover:bg-stone-50 hover:text-primary rounded-full h-16 w-16 md:h-24 md:w-24 p-0 transition-all duration-300 group shadow-sm hover:shadow-md border border-stone-100/50"
            >
              <Link href="/shop/cart" title="Your Selection Basket">
                <ArtisanCartIcon className="h-13 w-13 md:h-20 md:w-20 text-stone-700 transition-transform duration-300 group-hover:scale-110" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-6 w-6 md:h-8 md:w-8 items-center justify-center rounded-full bg-gradient-to-br from-rose-500 to-primary text-[10px] md:text-xs font-black text-white shadow-lg border-2 border-white animate-in zoom-in duration-300">
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
