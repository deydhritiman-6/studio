'use client';

import { useState, useEffect } from 'react';
import { products as initialProducts } from '@/lib/data';
import type { Product } from '@/lib/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { ShoppingCart, Eye } from 'lucide-react';
import Link from 'next/link';

export default function ShopPage() {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const { toast } = useToast();

  useEffect(() => {
    const saved = localStorage.getItem('roseberry-products');
    if (saved) {
      try {
        setProducts(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse products", e);
      }
    }
  }, []);

  const addToCart = (product: Product) => {
    const cart = JSON.parse(localStorage.getItem('roseberry-cart') || '[]');
    const existingIndex = cart.findIndex((item: any) => item.id === product.id);
    
    if (existingIndex > -1) {
      cart[existingIndex].quantity += 1;
    } else {
      cart.push({ ...product, quantity: 1 });
    }
    
    localStorage.setItem('roseberry-cart', JSON.stringify(cart));
    toast({
      title: "Added to basket",
      description: `${product.name} has been added.`,
    });
    window.dispatchEvent(new Event('cart-updated'));
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      <div className="text-center space-y-4 py-8">
        <h1 className="text-4xl md:text-6xl font-bold font-headline text-stone-900 tracking-tight">The Art of Indulgence</h1>
        <p className="text-stone-600 max-w-2xl mx-auto text-lg">Hand-crafted artisan chocolates made with single-origin cocoa and extraordinary patience.</p>
      </div>

      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {products.filter(p => p.availabilityStatus === 'In Stock').map((product) => (
          <Card key={product.id} className="group overflow-hidden flex flex-col border-stone-200 shadow-sm hover:shadow-xl transition-all duration-300">
            <div className="aspect-[4/3] relative overflow-hidden">
              <Image 
                src={product.imageUrls[0]} 
                alt={product.name} 
                fill 
                className="object-cover group-hover:scale-105 transition-transform duration-700"
                data-ai-hint={product.imageHint}
              />
              <div className="absolute inset-0 bg-stone-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                 <Button size="sm" className="bg-white text-stone-900 hover:bg-stone-100" onClick={() => addToCart(product)}>
                    <ShoppingCart className="h-4 w-4 mr-2" /> Add to Basket
                 </Button>
              </div>
            </div>
            <CardHeader className="p-5 pb-2">
               <CardTitle className="font-headline text-xl text-stone-800 line-clamp-1">{product.name}</CardTitle>
               <p className="text-sm text-stone-500 font-medium tracking-wide uppercase">{product.flavor}</p>
            </CardHeader>
            <CardContent className="p-5 pt-0 flex-grow">
               <p className="text-xl font-bold text-primary">₹{product.price}</p>
            </CardContent>
            <CardFooter className="p-5 pt-0">
               <Button variant="outline" className="w-full border-stone-200 hover:bg-stone-50 text-stone-600" asChild>
                  <Link href={`/shop/product/${product.id}`}>
                    <Eye className="h-4 w-4 mr-2" /> View Details
                  </Link>
               </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
