'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Loader2, Home, ArrowLeft } from 'lucide-react';
import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import { useEffect, useState, createContext, useContext } from 'react';
import { useAuth, useUser } from '@/firebase';
import { signInAnonymously } from 'firebase/auth';
import Image from 'next/image';
import { Footer } from '@/components/footer';
import { AuthModal } from '@/components/auth-modal';

interface ShopContextType {
  requireAuth: (callback: () => void) => void;
}

const ShopContext = createContext<ShopContextType | undefined>(undefined);

export const useShopAuth = () => {
  const context = useContext(ShopContext);
  if (!context) throw new Error('useShopAuth must be used within a ShopLayout');
  return context;
};

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isAuthInitializing, setIsAuthInitializing] = useState(true);
  const [cartCount, setCartCount] = useState(0);
  
  // Auth state
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  const auth = useAuth();
  const { user: firebaseUser, loading: authLoading } = useUser();

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
          // Initial anonymous session to keep tracking simple while browsing
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

  const requireAuth = (callback: () => void) => {
    if (firebaseUser && !firebaseUser.isAnonymous && firebaseUser.emailVerified) {
      callback();
    } else {
      setPendingAction(() => callback);
      setIsAuthModalOpen(true);
    }
  };

  const handleAuthSuccess = () => {
    if (pendingAction) {
      pendingAction();
      setPendingAction(null);
    }
  };

  const isReady = !authLoading && !isAuthInitializing && !!firebaseUser;

  // Show "Back to Shop" button on these specific pages
  const showBackToShop = 
    pathname === '/shop/cart' || 
    pathname === '/shop/my-orders' || 
    pathname === '/shop/checkout' || 
    pathname.startsWith('/shop/product/');

  return (
    <ShopContext.Provider value={{ requireAuth }}>
      <div className="min-h-screen flex flex-col bg-stone-50 font-body">
        {/* Floating Header Wrapper */}
        <div className="fixed top-0 z-50 w-full pt-4 px-4 md:px-8 pointer-events-none">
          <header className="pointer-events-auto max-w-7xl mx-auto border bg-white/70 backdrop-blur-lg rounded-full px-6 md:px-10 h-16 md:h-20 flex items-center shadow-2xl transition-all duration-500">
            <div className="w-full grid grid-cols-2 lg:grid-cols-12 items-center gap-4 relative z-10">
              
              {/* Logo - Left */}
              <div className="lg:col-span-3 flex justify-start">
                <Link href="/" className="hover:scale-105 transition-transform duration-500 block">
                  <Logo className="h-8 md:h-12 w-auto" />
                </Link>
              </div>

              {/* Navigation - Center (Visible on Desktop) */}
              <div className="hidden lg:flex lg:col-span-6 justify-center">
                <nav className="flex items-center gap-6 xl:gap-8 text-[10px] font-black uppercase tracking-[0.2em] text-stone-500">
                  <Link href="/" className="relative group hover:text-amber-600 transition-colors duration-300">
                    Home
                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-amber-600 transition-all duration-300 group-hover:w-full"></span>
                  </Link>
                  <Link href="/#story" className="relative group hover:text-rose-700 transition-colors duration-300">
                    Our Story
                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-rose-700 transition-all duration-300 group-hover:w-full"></span>
                  </Link>
                  <Link href="/inside-roseberry" className="relative group hover:text-amber-600 transition-colors duration-300">
                    Inside Roseberry
                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-amber-600 transition-all duration-300 group-hover:w-full"></span>
                  </Link>
                  <Link href="/shop" className="relative group hover:text-rose-700 transition-colors duration-300">
                    Collections
                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-rose-700 transition-all duration-300 group-hover:w-full"></span>
                  </Link>
                  <Link href="/#reviews" className="relative group hover:text-amber-600 transition-colors duration-300">
                    Reviews
                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-amber-600 transition-all duration-300 group-hover:w-full"></span>
                  </Link>
                  <Link href="/#footer" className="relative group hover:text-rose-700 transition-colors duration-300">
                    Contact
                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-rose-700 transition-all duration-300 group-hover:w-full"></span>
                  </Link>
                </nav>
              </div>

              {/* Actions - Right */}
              <div className="lg:col-span-3 flex justify-end items-center gap-2 md:gap-4">
                <div className="flex items-center gap-1 md:gap-2">
                  {/* Back to Shop Button (Visible on Cart/My Orders/Checkout/Product Detail) */}
                  {showBackToShop && (
                    <Button 
                      asChild 
                      className="hidden xl:flex bg-[#3D1E16] hover:bg-[#4A251B] text-[#D4AF37] border border-[#D4AF37]/20 rounded-full h-10 md:h-12 px-6 md:px-8 font-black uppercase text-[10px] tracking-[0.2em] shadow-lg shadow-black/20 transition-all hover:scale-105 active:scale-95 group mr-2"
                    >
                      <Link href="/shop">
                        <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" /> Back to Shop
                      </Link>
                    </Button>
                  )}

                  {/* Track Orders */}
                  <Button 
                    variant="ghost" 
                    asChild 
                    className="relative hover:bg-stone-50 hover:text-primary rounded-full h-10 w-10 md:h-12 md:w-12 p-0 transition-all duration-300 group shadow-sm hover:shadow-md border border-stone-100/50 overflow-hidden"
                  >
                    <Link href="/shop/my-orders" title="Track My Orders">
                      <div className="relative w-full h-full p-2">
                        <Image 
                          src="/delivery.jpeg" 
                          alt="Artisan Delivery" 
                          fill 
                          className="object-contain transition-transform duration-300 group-hover:scale-110" 
                          priority
                          sizes="48px"
                        />
                      </div>
                    </Link>
                  </Button>

                  {/* Cart */}
                  <Button 
                    variant="ghost" 
                    asChild 
                    className="relative hover:bg-stone-50 hover:text-primary rounded-full h-10 w-10 md:h-12 md:w-12 p-0 transition-all duration-300 group shadow-sm hover:shadow-md border border-stone-100/50 overflow-hidden"
                  >
                    <Link href="/shop/cart" title="Your Selection Basket">
                      <div className="relative w-full h-full p-2">
                        <Image 
                          src="/cart2.jpeg" 
                          alt="Artisan Cart" 
                          fill 
                          className="object-contain transition-transform duration-300 group-hover:scale-110" 
                          priority
                          sizes="48px"
                        />
                      </div>
                      {cartCount > 0 && (
                        <span className="absolute top-1 right-1 flex h-4 w-4 md:h-5 md:w-5 items-center justify-center rounded-full bg-gradient-to-br from-rose-500 to-primary text-[7px] md:text-[8px] font-black text-white shadow-lg border border-white animate-in zoom-in duration-300 z-20">
                          {cartCount}
                        </span>
                      )}
                    </Link>
                  </Button>

                  {/* Mobile Home Link */}
                  <Button 
                    variant="ghost" 
                    asChild 
                    className="lg:hidden h-10 w-10 rounded-full border border-stone-100 p-0 shadow-sm"
                  >
                    <Link href="/" title="Home">
                      <Home className="h-5 w-5 text-stone-500" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </header>
        </div>

        {/* Spacer to account for fixed floating header */}
        <div className="h-20 md:h-24 shrink-0"></div>

        <main className="flex-1 container mx-auto pt-0 pb-4 md:pt-2 md:pb-6 px-4 md:px-6 max-w-7xl">
          {!isReady ? (
            <div className="flex items-center justify-center py-32">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
          ) : children}
        </main>
        
        <Footer />
        
        <AuthModal 
          isOpen={isAuthModalOpen} 
          onOpenChange={setIsAuthModalOpen} 
          onSuccess={handleAuthSuccess}
        />
      </div>
    </ShopContext.Provider>
  );
}