'use client';

import { useState, useEffect } from 'react';
import { products as initialProducts } from '@/lib/data';
import type { Product } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { ShoppingCart, ArrowLeft, CheckCircle2, Star } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;
  const [product, setProduct] = useState<Product | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const saved = localStorage.getItem('roseberry-products');
    const source = saved ? JSON.parse(saved) : initialProducts;
    const found = source.find((p: Product) => p.id === productId);
    if (found) {
      setProduct(found);
      setSelectedImage(found.imageUrls[0]);
    }
  }, [productId]);

  if (!product) {
    return <div className="text-center py-20 text-stone-500">Product not found.</div>;
  }

  const addToCart = () => {
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
      description: `${product.name} has been added to your order.`,
    });
    window.dispatchEvent(new Event('cart-updated'));
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      <Button variant="ghost" className="mb-4 text-stone-500 hover:text-stone-900" onClick={() => router.back()}>
        <ArrowLeft className="h-4 w-4 mr-2" /> Back to Catalog
      </Button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20">
        <div className="space-y-6">
          <div className="aspect-square relative rounded-2xl overflow-hidden shadow-2xl bg-stone-200">
            <Image 
              src={selectedImage || product.imageUrls[0]} 
              alt={product.name} 
              fill 
              className="object-cover transition-all duration-500" 
              priority
              data-ai-hint={product.imageHint}
            />
          </div>
          <div className="grid grid-cols-4 gap-4">
             {product.imageUrls.map((url, i) => (
                <button 
                  key={i} 
                  onClick={() => setSelectedImage(url)}
                  className={`aspect-square relative rounded-xl overflow-hidden border-2 transition-all ${selectedImage === url ? 'border-primary' : 'border-transparent opacity-70 hover:opacity-100'}`}
                >
                   <Image src={url} alt={`${product.name} view ${i + 1}`} fill className="object-cover" data-ai-hint={product.imageHint} />
                </button>
             ))}
          </div>
        </div>

        <div className="space-y-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-stone-400">
                <Star className="h-4 w-4 fill-primary text-primary" />
                <Star className="h-4 w-4 fill-primary text-primary" />
                <Star className="h-4 w-4 fill-primary text-primary" />
                <Star className="h-4 w-4 fill-primary text-primary" />
                <Star className="h-4 w-4 fill-primary text-primary" />
                <span className="text-xs font-bold tracking-widest ml-2">PREMIUM QUALITY</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold font-headline text-stone-900">{product.name}</h1>
            <p className="text-2xl text-stone-500 font-light">{product.flavor}</p>
          </div>

          <div className="flex items-baseline gap-4">
             <span className="text-4xl font-bold text-primary">₹{product.price}</span>
             <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 uppercase tracking-widest text-[10px] py-1">
               {product.availabilityStatus}
             </Badge>
          </div>

          <div className="space-y-6 text-stone-600 leading-relaxed">
            <p>Our {product.name} is a testament to the pursuit of perfection. Every bar is carefully tempered and molded by our master chocolatiers in Puducherry, ensuring a flawless snap and a velvet-smooth melt that lingers on the palate.</p>
            <ul className="space-y-3">
               <li className="flex items-center gap-3"><CheckCircle2 className="h-5 w-5 text-primary shrink-0" /> <span>Ethically sourced, single-origin cocoa beans.</span></li>
               <li className="flex items-center gap-3"><CheckCircle2 className="h-5 w-5 text-primary shrink-0" /> <span>Zero artificial preservatives or flavorings.</span></li>
               <li className="flex items-center gap-3"><CheckCircle2 className="h-5 w-5 text-primary shrink-0" /> <span>Presented in gold-embossed bespoke packaging.</span></li>
            </ul>
          </div>

          <div className="pt-8 border-t flex flex-col gap-6">
             <Button size="lg" className="w-full text-lg h-16 shadow-lg shadow-primary/20" onClick={addToCart}>
                <ShoppingCart className="h-6 w-6 mr-3" /> Add to Basket
             </Button>
             <div className="flex justify-center gap-8 text-[10px] text-stone-400 font-bold tracking-[0.2em] uppercase">
                <span className="flex items-center gap-1">Fast Delivery</span>
                <span className="flex items-center gap-1">Secure Checkout</span>
                <span className="flex items-center gap-1">Gift Wrapped</span>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
