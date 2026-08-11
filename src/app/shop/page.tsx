'use client';

import { useState, useEffect, useMemo } from 'react';
import type { Product } from '@/lib/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { ShoppingCart, Eye, Sparkles, Loader2, PackageSearch } from 'lucide-react';
import Link from 'next/link';
import { useCollection, useFirestore } from '@/firebase';
import { collection } from 'firebase/firestore';
import { Badge } from '@/components/ui/badge';

export default function ShopPage() {
  const firestore = useFirestore();
  const productsQuery = useMemo(() => firestore ? collection(firestore, 'products') : null, [firestore]);
  const { data: products, loading } = useCollection<Product>(productsQuery);
  const { toast } = useToast();

  const allProducts = useMemo(() => {
    if (!products) return [];
    // Filter out archived products in real-time
    return products.filter(p => !p.isArchived);
  }, [products]);

  const addToCart = (product: Product) => {
    if (product.availabilityStatus === 'Out of Stock') {
      toast({
        variant: "destructive",
        title: "Currently Unavailable",
        description: `${product.name} is currently out of stock.`,
      });
      return;
    }

    let updatedCart = [];
    try {
      const cartRaw = localStorage.getItem('roseberry-cart');
      updatedCart = (cartRaw && cartRaw.trim()) ? JSON.parse(cartRaw) : [];
      if (!Array.isArray(updatedCart)) updatedCart = [];
    } catch (e) {
      updatedCart = [];
    }

    const existingIndex = updatedCart.findIndex((item: any) => item.id === product.id);
    
    if (existingIndex > -1) {
      updatedCart[existingIndex].quantity += 1;
    } else {
      updatedCart.push({ ...product, quantity: 1 });
    }
    
    localStorage.setItem('roseberry-cart', JSON.stringify(updatedCart));
    toast({
      title: "Added to basket",
      description: `${product.name} is now in your selection.`,
    });
    window.dispatchEvent(new Event('cart-updated'));
  };

  if (loading || !firestore) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-10 animate-in fade-in duration-1000">
      <div className="text-center space-y-4 md:space-y-6 pt-2 pb-6 md:pt-4 md:pb-8 relative">
        <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl aspect-square bg-gradient-to-tr from-primary/5 via-rose-500/5 to-accent/5 blur-[120px] rounded-full"></div>
        </div>

        <div className="flex justify-center items-center gap-2 text-primary font-bold uppercase tracking-[0.3em] text-[9px] md:text-[10px] mb-1 px-6 py-2 rounded-full bg-white border border-primary/10 w-fit mx-auto shadow-sm">
          <Sparkles className="h-3 w-3 text-orange-500" /> 
          <span className="bg-gradient-to-r from-orange-600 via-primary to-rose-600 bg-clip-text text-transparent">Kolkata's Finest</span>
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold font-headline tracking-tight leading-[1.1] px-4 bg-gradient-to-br from-stone-900 via-stone-800 to-primary bg-clip-text text-transparent max-w-5xl mx-auto">
          Handmade Artisan Chocolate <br className="hidden md:block" /> & Luxury Truffle in Kolkata
        </h1>

        <p className="text-stone-500 max-w-2xl mx-auto text-base md:text-xl font-light leading-relaxed px-4">
          Hand-crafted artisan chocolates made with single-origin cocoa, ethical values, and <span className="text-rose-500 italic font-serif">extraordinary patience</span>.
        </p>

        <div className="flex justify-center items-center gap-4 mt-4 md:mt-6">
           <div className="h-px w-12 bg-gradient-to-r from-transparent to-primary/30"></div>
           <div className="h-2 w-2 rounded-full bg-primary/40 animate-pulse"></div>
           <div className="h-px w-12 bg-gradient-to-l from-transparent to-primary/30"></div>
        </div>
      </div>

      {allProducts.length > 0 ? (
        <div className="grid gap-6 md:gap-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {allProducts.map((product) => (
            <Card key={product.id} className="group overflow-hidden flex flex-col border-stone-100 shadow-sm hover:shadow-2xl transition-all duration-700 rounded-[2rem] bg-white border-2 hover:border-primary/20">
              <div className="aspect-[4/3] relative overflow-hidden bg-stone-50">
                <Image 
                  src={product.imageUrls?.[0] || 'https://picsum.photos/seed/default/400/300'} 
                  alt={product.name} 
                  fill 
                  className={`object-cover transition-transform duration-[2s] ease-in-out ${product.availabilityStatus === 'Out of Stock' ? 'grayscale opacity-60' : 'group-hover:scale-110'}`}
                  data-ai-hint={product.imageHint}
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                />
                
                {product.availabilityStatus === 'Out of Stock' && (
                  <div className="absolute top-6 right-6 z-20">
                    <Badge variant="destructive" className="uppercase tracking-widest text-[9px] py-1.5 px-4 shadow-xl font-black">Out of Stock</Badge>
                  </div>
                )}

                <div className="absolute inset-0 bg-stone-900/60 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col items-center justify-center gap-4 backdrop-blur-[2px]">
                   <Button 
                    size="lg" 
                    className="bg-white text-stone-900 hover:bg-stone-100 rounded-full px-10 h-14 shadow-2xl transform translate-y-6 group-hover:translate-y-0 transition-transform duration-500 font-bold" 
                    onClick={() => addToCart(product)}
                    disabled={product.availabilityStatus === 'Out of Stock'}
                   >
                      <ShoppingCart className="h-5 w-5 mr-3" /> {product.availabilityStatus === 'Out of Stock' ? 'Unavailable' : 'Add to Basket'}
                   </Button>
                   <Button variant="ghost" asChild className="text-white hover:text-white hover:bg-white/10 rounded-full h-12 transform translate-y-12 group-hover:translate-y-0 transition-transform duration-700 font-medium">
                     <Link href={`/shop/product/${product.id}`}>
                        <Eye className="h-4 w-4 mr-2" /> View Details
                     </Link>
                   </Button>
                </div>
              </div>
              <CardHeader className="p-8 pb-3">
                 <CardTitle className="font-headline text-3xl text-stone-800 line-clamp-1 group-hover:text-primary transition-colors duration-300 leading-none">{product.name}</CardTitle>
                 <p className="text-[10px] text-stone-400 font-black tracking-[0.3em] uppercase mt-3">{product.flavor}</p>
              </CardHeader>
              <CardContent className="p-8 pt-0 flex-grow">
                 <div className="flex items-baseline gap-3 mt-6">
                   <span className={`text-3xl font-bold tracking-tighter ${product.availabilityStatus === 'Out of Stock' ? 'text-stone-300 line-through' : 'text-primary'}`}>₹{product.price}</span>
                   <span className="text-[10px] text-stone-400 font-bold uppercase tracking-widest opacity-60">Tax Inc.</span>
                 </div>
              </CardContent>
              <CardFooter className="p-8 pt-0">
                 <Button variant="outline" className="w-full border-stone-100 hover:bg-stone-50 text-stone-600 rounded-2xl h-14 transition-all hover:border-primary/50 group-hover:bg-stone-900 group-hover:text-white group-hover:border-stone-900 font-bold uppercase text-xs tracking-widest" asChild>
                    <Link href={`/shop/product/${product.id}`}>
                      {product.availabilityStatus === 'Out of Stock' ? 'Check Availability' : 'Explore Details'}
                    </Link>
                 </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-32 text-center space-y-6">
          <div className="h-24 w-24 bg-stone-100 rounded-full flex items-center justify-center animate-bounce">
            <PackageSearch className="h-10 w-10 text-stone-300" />
          </div>
          <h2 className="text-3xl font-headline text-stone-400 italic">Our kitchen is currently being restocked.</h2>
          <p className="text-stone-400 max-w-sm mx-auto leading-relaxed">New artisan creations are added daily. Please check back shortly for our updated collection.</p>
          <Button variant="outline" className="rounded-full px-8" asChild><Link href="/shop/my-orders">Track Existing Orders</Link></Button>
        </div>
      )}
    </div>
  );
}