'use client';

import { useState, useEffect } from 'react';
import { products as initialProducts } from '@/lib/data';
import type { Product } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { ShoppingCart, ArrowLeft, CheckCircle2, Star, ShieldCheck } from 'lucide-react';
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
    let source = initialProducts;
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) source = parsed;
      } catch (e) {}
    }
    const found = source.find((p: Product) => p.id === productId);
    if (found) {
      setProduct(found);
      setSelectedImage(found.imageUrls[0]);
    }
  }, [productId]);

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-6">
        <p className="text-stone-400 font-headline text-2xl italic">The flavor you seek is currently unavailable.</p>
        <Button variant="outline" onClick={() => router.push('/shop')}>Return to Collection</Button>
      </div>
    );
  }

  const addToCart = () => {
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
      title: "Selection Saved",
      description: `${product.name} has been added to your basket.`,
    });
    window.dispatchEvent(new Event('cart-updated'));
  };

  return (
    <div className="space-y-12 animate-in slide-in-from-bottom-8 duration-1000">
      <div className="flex items-center justify-between">
        <Button variant="ghost" className="text-stone-400 hover:text-stone-900 px-0 hover:bg-transparent transition-colors group" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" /> Back to Collection
        </Button>
        <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-300">Product Ref: {product.id}</div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 xl:gap-24">
        <div className="lg:col-span-7 space-y-8">
          <div className="aspect-square relative rounded-[2.5rem] overflow-hidden shadow-2xl bg-white border border-stone-100 p-8">
            <div className="relative w-full h-full rounded-[1.5rem] overflow-hidden group">
              <Image 
                src={selectedImage || product.imageUrls[0]} 
                alt={product.name} 
                fill 
                className="object-cover transition-all duration-[1s] group-hover:scale-110" 
                priority
                data-ai-hint={product.imageHint}
              />
            </div>
          </div>
          <div className="grid grid-cols-4 gap-6 px-4">
             {product.imageUrls.map((url, i) => (
                <button 
                  key={i} 
                  onClick={() => setSelectedImage(url)}
                  className={`aspect-square relative rounded-2xl overflow-hidden border-2 transition-all duration-300 ${selectedImage === url ? 'border-primary shadow-lg ring-4 ring-primary/5' : 'border-transparent opacity-60 hover:opacity-100 hover:border-stone-200'}`}
                >
                   <Image src={url} alt={`${product.name} perspective ${i + 1}`} fill className="object-cover" data-ai-hint={product.imageHint} />
                </button>
             ))}
          </div>
        </div>

        <div className="lg:col-span-5 flex flex-col justify-center space-y-10">
          <div className="space-y-6">
            <div className="flex items-center gap-3 text-primary">
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => <Star key={i} className="h-3 w-3 fill-current" />)}
                </div>
                <span className="text-[10px] font-black tracking-[0.3em] uppercase opacity-60">Hand-Crafted Excellence</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold font-headline text-stone-900 leading-tight">{product.name}</h1>
            <p className="text-2xl text-stone-400 font-light italic">{product.flavor}</p>
          </div>

          <div className="flex items-center gap-6">
             <span className="text-5xl font-bold text-primary tabular-nums">₹{product.price}</span>
             <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 uppercase tracking-widest text-[10px] px-3 py-1 font-bold">
               {product.availabilityStatus}
             </Badge>
          </div>

          <div className="space-y-8 text-stone-600 leading-relaxed text-lg font-light">
            <p className="border-l-4 border-primary/20 pl-6 italic">Our {product.name} is a testament to the pursuit of perfection. Every bar is carefully tempered and molded by our master chocolatiers in Puducherry, ensuring a flawless snap and a velvet-smooth melt that lingers on the palate.</p>
            <ul className="space-y-4 pt-4">
               <li className="flex items-start gap-4"><CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-1" /> <span>Ethically sourced, single-origin cocoa beans from select estates.</span></li>
               <li className="flex items-start gap-4"><CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-1" /> <span>Zero artificial preservatives, colorants, or synthetic flavorings.</span></li>
               <li className="flex items-start gap-4"><CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-1" /> <span>Presented in gold-embossed bespoke packaging, ready for gifting.</span></li>
            </ul>
          </div>

          <div className="pt-10 space-y-8">
             <Button size="lg" className="w-full text-xl h-20 shadow-2xl shadow-primary/30 rounded-2xl font-bold transition-all hover:scale-[1.02] active:scale-[0.98]" onClick={addToCart}>
                <ShoppingCart className="h-6 w-6 mr-4" /> Reserve Your Indulgence
             </Button>
             <div className="grid grid-cols-3 gap-4 text-center">
               <div className="space-y-2">
                 <ShieldCheck className="h-5 w-5 mx-auto text-stone-300" />
                 <p className="text-[9px] text-stone-400 font-bold uppercase tracking-widest leading-tight">Secure Checkout</p>
               </div>
               <div className="space-y-2">
                 <div className="h-5 w-5 mx-auto text-stone-300 flex items-center justify-center text-[10px] font-bold">IN</div>
                 <p className="text-[9px] text-stone-400 font-bold uppercase tracking-widest leading-tight">Artisan Made in India</p>
               </div>
               <div className="space-y-2">
                 <div className="h-5 w-5 mx-auto text-stone-300 flex items-center justify-center text-[10px] font-bold">12h</div>
                 <p className="text-[9px] text-stone-400 font-bold uppercase tracking-widest leading-tight">Freshly Prepared</p>
               </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
