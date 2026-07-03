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

  const addToCart = (product: Product) => {
    if (product.availabilityStatus === 'Out of Stock') {
      toast({
        variant: "destructive",
        title: "Currently Unavailable",
        description: `${product.name} is currently out of stock.`,
      });
      return;
    }

    const cart = JSON.parse(localStorage.getItem('roseberry-cart') || '[]');
    const existingIndex = Array.isArray(cart) ? cart.findIndex((item: any) => item.id === product.id) : -1;
    
    let updatedCart = Array.isArray(cart) ? [...cart] : [];
    
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

  const allProducts = products || [];

  return (
    <div className="space-y-8 md:space-y-16 animate-in fade-in duration-1000">
      <div className="text-center space-y-4 md:space-y-6 py-8 md:py-12">
        <div className="flex justify-center items-center gap-2 text-primary font-bold uppercase tracking-[0.3em] text-[9px] md:text-[10px] mb-2">
          <Sparkles className="h-3 w-3" /> Puducherry's Finest
        </div>
        <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold font-headline text-stone-900 tracking-tight leading-tight px-4">The Art of Indulgence</h1>
        <p className="text-stone-500 max-w-2xl mx-auto text-base md:text-xl font-light leading-relaxed px-4">Hand-crafted artisan chocolates made with single-origin cocoa, ethical values, and extraordinary patience.</p>
        <div className="h-px w-24 bg-primary/30 mx-auto mt-6 md:mt-8"></div>
      </div>

      {allProducts.length > 0 ? (
        <div className="grid gap-6 md:gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {allProducts.map((product) => (
            <Card key={product.id} className="group overflow-hidden flex flex-col border-stone-200 shadow-sm hover:shadow-2xl transition-all duration-500 rounded-2xl bg-white">
              <div className="aspect-[4/3] relative overflow-hidden bg-stone-100">
                <Image 
                  src={product.imageUrls?.[0] || 'https://picsum.photos/seed/default/400/300'} 
                  alt={product.name} 
                  fill 
                  className={`object-cover transition-transform duration-[1.5s] ease-in-out ${product.availabilityStatus === 'Out of Stock' ? 'grayscale opacity-60' : 'group-hover:scale-110'}`}
                  data-ai-hint={product.imageHint}
                />
                
                {product.availabilityStatus === 'Out of Stock' && (
                  <div className="absolute top-4 right-4 z-20">
                    <Badge variant="destructive" className="uppercase tracking-widest text-[9px] py-1 px-3 shadow-lg">Out of Stock</Badge>
                  </div>
                )}

                <div className="absolute inset-0 bg-stone-900/40 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col items-center justify-center gap-3">
                   <Button 
                    size="lg" 
                    className="bg-white text-stone-900 hover:bg-stone-100 rounded-full px-8 shadow-xl transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500" 
                    onClick={() => addToCart(product)}
                    disabled={product.availabilityStatus === 'Out of Stock'}
                   >
                      <ShoppingCart className="h-4 w-4 mr-2" /> {product.availabilityStatus === 'Out of Stock' ? 'Unavailable' : 'Add to Basket'}
                   </Button>
                   <Button variant="ghost" asChild className="text-white hover:text-white hover:bg-white/20 rounded-full transform translate-y-8 group-hover:translate-y-0 transition-transform duration-700">
                     <Link href={`/shop/product/${product.id}`}>
                        <Eye className="h-4 w-4 mr-2" /> View Details
                     </Link>
                   </Button>
                </div>
              </div>
              <CardHeader className="p-6 pb-2">
                 <CardTitle className="font-headline text-2xl text-stone-800 line-clamp-1 group-hover:text-primary transition-colors duration-300">{product.name}</CardTitle>
                 <p className="text-[10px] text-stone-400 font-bold tracking-[0.2em] uppercase mt-1">{product.flavor}</p>
              </CardHeader>
              <CardContent className="p-6 pt-0 flex-grow">
                 <div className="flex items-baseline gap-2 mt-4">
                   <span className={`text-2xl font-bold ${product.availabilityStatus === 'Out of Stock' ? 'text-stone-400 line-through' : 'text-primary'}`}>₹{product.price}</span>
                   <span className="text-[10px] text-stone-400 font-medium">Inclusive of all taxes</span>
                 </div>
              </CardContent>
              <CardFooter className="p-6 pt-0">
                 <Button variant="outline" className="w-full border-stone-200 hover:bg-stone-50 text-stone-600 rounded-xl h-12 transition-all hover:border-primary/50 group-hover:bg-primary group-hover:text-white group-hover:border-primary" asChild>
                    <Link href={`/shop/product/${product.id}`}>
                      {product.availabilityStatus === 'Out of Stock' ? 'Check Availability' : 'Explore Details'}
                    </Link>
                 </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
          <PackageSearch className="h-16 w-16 text-stone-200" />
          <h2 className="text-2xl font-headline text-stone-400 italic">Our kitchen is currently being restocked.</h2>
          <p className="text-stone-400 max-w-xs">New artisan creations are added daily. Please check back shortly for our updated collection.</p>
        </div>
      )}
    </div>
  );
}