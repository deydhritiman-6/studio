'use client';

import { useState, useEffect, useMemo } from 'react';
import type { Product, ProductGallery } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { ShoppingCart, ArrowLeft, CheckCircle2, Star, ShieldCheck, Loader2, Ruler, Cuboid } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useDoc, useFirestore, useCollection } from '@/firebase';
import { doc, collection, query, where } from 'firebase/firestore';
import { ChocolateMeshViewer } from '@/components/chocolate-mesh-viewer';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;
  const { toast } = useToast();
  
  const firestore = useFirestore();
  const productRef = useMemo(() => firestore ? doc(firestore, 'products', productId) : null, [firestore, productId]);
  const { data: product, loading } = useDoc<Product>(productRef as any);

  const galleriesQuery = useMemo(() => {
    if (!firestore || !product?.id) return null;
    return query(collection(firestore, 'product-galleries'), where('productId', '==', product.id));
  }, [firestore, product?.id]);
  
  const { data: galleries } = useCollection<ProductGallery>(galleriesQuery);

  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const allImages = useMemo(() => {
    if (!product) return [];
    const base = product.imageUrls || [];
    const galleryImages = galleries?.flatMap(g => [g.mainImage, ...g.subImages]) || [];
    return Array.from(new Set([...base, ...galleryImages]));
  }, [product, galleries]);

  const mainPreviewImage = selectedImage || allImages[0] || 'https://picsum.photos/seed/default/400/300';
  const thumbnails = useMemo(() => allImages.slice(1, 4), [allImages]);

  useEffect(() => {
    if (allImages.length > 0 && !selectedImage) {
      setSelectedImage(allImages[0]);
    }
  }, [allImages, selectedImage]);

  if (loading) return <div className="flex items-center justify-center py-32"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
  if (!product || product.isArchived) return (
    <div className="flex flex-col items-center justify-center py-32 space-y-6">
      <p className="text-stone-400 font-headline text-2xl italic">The flavor you seek is currently unavailable.</p>
      <Button variant="outline" onClick={() => router.push('/shop')}>Return to Collection</Button>
    </div>
  );

  const addToCart = () => {
    let cart = [];
    try {
      const savedRaw = localStorage.getItem('roseberry-cart');
      if (savedRaw && savedRaw.trim()) {
        const parsed = JSON.parse(savedRaw);
        if (Array.isArray(parsed)) cart = parsed;
      }
    } catch (e) {}
    const existingIndex = cart.findIndex((item: any) => item.id === product.id);
    let updatedCart = [...cart];
    if (existingIndex > -1) updatedCart[existingIndex].quantity += 1;
    else updatedCart.push({ ...product, quantity: 1 });
    localStorage.setItem('roseberry-cart', JSON.stringify(updatedCart));
    toast({ title: "Selection Saved", description: `${product.name} has been added to your basket.` });
    window.dispatchEvent(new Event('cart-updated'));
  };

  return (
    <div className="space-y-12 animate-in slide-in-from-bottom-8 duration-1000">
      <div className="flex items-center justify-between">
        <Button variant="ghost" className="text-stone-400 hover:text-stone-900 px-0 hover:bg-transparent group" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" /> Back to Collection
        </Button>
        <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-300">Ref: {product.id}</div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 xl:gap-24">
        <div className="lg:col-span-7 space-y-8">
          <div className="aspect-square relative rounded-[2.5rem] overflow-hidden shadow-2xl bg-white border border-stone-100 p-8">
            <div className="relative w-full h-full rounded-[1.5rem] overflow-hidden group">
              <Image src={mainPreviewImage} alt={product.name} fill className="object-cover transition-all duration-[1s] group-hover:scale-110" priority data-ai-hint={product.imageHint} sizes="(max-width: 1024px) 100vw, 800px" />
            </div>
          </div>
          {thumbnails.length > 0 && (
            <div className="grid grid-cols-3 gap-6 px-4 md:px-12">
               {thumbnails.map((url, i) => (
                  <button key={i} onClick={() => setSelectedImage(url)} className={`aspect-square relative rounded-xl overflow-hidden border-2 transition-all ${selectedImage === url ? 'border-primary shadow-lg scale-105' : 'border-transparent opacity-60 hover:opacity-100 hover:scale-105'}`}>
                     <Image src={url} alt={`${product.name} perspective ${i + 1}`} fill className="object-cover" data-ai-hint={product.imageHint} sizes="(max-width: 768px) 33vw, 200px" />
                  </button>
               ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-5 flex flex-col justify-center space-y-10">
          <div className="space-y-6">
            <div className="flex items-center gap-3 text-primary">
                <div className="flex gap-1">{[...Array(5)].map((_, i) => <Star key={i} className="h-3 w-3 fill-current" />)}</div>
                <span className="text-[10px] font-black tracking-[0.3em] uppercase opacity-60">Hand-Crafted Excellence</span>
            </div>
            <h1 className="text-5xl font-bold font-headline text-stone-900 leading-tight">{product.name}</h1>
            <p className="text-2xl text-stone-400 font-light italic">{product.flavor}</p>
          </div>

          <div className="flex items-center gap-6">
             <span className="text-5xl font-bold text-primary">₹{product.price}</span>
             <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 uppercase tracking-widest text-[10px] px-3 py-1 font-bold">{product.availabilityStatus}</Badge>
          </div>

          <div className="space-y-8 text-stone-600 leading-relaxed text-lg font-light">
            <p className="border-l-4 border-primary/20 pl-6 italic">Meticulously tempered in Kolkata for the true connoisseur. Zero artificial preservatives. Just pure artisan joy.</p>
            
            {product.productDimensions && (
              <div className="bg-stone-50 p-8 rounded-[2rem] border border-stone-100 space-y-8">
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                        <Ruler className="h-4 w-4" /> Technical Specifications
                    </div>
                    <Badge variant="secondary" className="text-[9px] font-black uppercase tracking-widest bg-white border shadow-sm">
                       {product.textureName || 'Smooth Milk'}
                    </Badge>
                 </div>
                 
                 <div className="grid grid-cols-2 gap-y-6">
                    <div className="space-y-1">
                       <p className="text-[9px] font-bold text-stone-400 uppercase tracking-tighter">Artisan Shape</p>
                       <p className="text-sm font-bold text-stone-900">{product.productShape}</p>
                    </div>
                    {product.productDimensions.diameter && (
                      <div className="space-y-1">
                         <p className="text-[9px] font-bold text-stone-400 uppercase tracking-tighter">Diameter</p>
                         <p className="text-sm font-bold text-stone-900">{product.productDimensions.diameter} {product.productDimensions.unit}</p>
                      </div>
                    )}
                    {(product.productDimensions.length || product.productDimensions.sideLength) && (
                      <div className="space-y-1">
                         <p className="text-[9px] font-bold text-stone-400 uppercase tracking-tighter">Length</p>
                         <p className="text-sm font-bold text-stone-900">{product.productDimensions.length || product.productDimensions.sideLength} {product.productDimensions.unit}</p>
                      </div>
                    )}
                    {product.productDimensions.width && (
                      <div className="space-y-1">
                         <p className="text-[9px] font-bold text-stone-400 uppercase tracking-tighter">Width</p>
                         <p className="text-sm font-bold text-stone-900">{product.productDimensions.width} {product.productDimensions.unit}</p>
                      </div>
                    )}
                    {product.productDimensions.height && (
                      <div className="space-y-1">
                         <p className="text-[9px] font-bold text-stone-400 uppercase tracking-tighter">Thickness</p>
                         <p className="text-sm font-bold text-stone-900">{product.productDimensions.height} {product.productDimensions.unit}</p>
                      </div>
                    )}
                 </div>
                 
                 <div className="pt-4 border-t border-stone-200/50">
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-stone-400 mb-4">
                       <Cuboid className="h-3 w-3" /> Interactive 3D Model
                    </div>
                    <ChocolateMeshViewer shape={product.productShape || 'Rectangular'} dimensions={product.productDimensions} textureId={product.textureId} />
                 </div>
              </div>
            )}
          </div>

          <div className="pt-10 space-y-8">
             <Button size="lg" className="w-full text-xl h-20 shadow-2xl shadow-primary/30 rounded-2xl font-bold transition-all hover:scale-[1.02] active:scale-[0.98]" onClick={addToCart} disabled={product.availabilityStatus === 'Out of Stock'}>
                <ShoppingCart className="h-6 w-6 mr-4" /> {product.availabilityStatus === 'Out of Stock' ? 'Sold Out' : 'Reserve Your Indulgence'}
             </Button>
             <div className="grid grid-cols-3 gap-4 text-center">
               <div className="space-y-2"><ShieldCheck className="h-5 w-5 mx-auto text-stone-300" /><p className="text-[9px] text-stone-400 font-bold uppercase tracking-widest leading-tight">Secure Checkout</p></div>
               <div className="space-y-2"><div className="h-5 w-5 mx-auto text-stone-300 flex items-center justify-center text-[10px] font-bold">IN</div><p className="text-[9px] text-stone-400 font-bold uppercase tracking-widest leading-tight">Artisan Made in India</p></div>
               <div className="space-y-2"><CheckCircle2 className="h-5 w-5 mx-auto text-stone-300" /><p className="text-[9px] text-stone-400 font-bold uppercase tracking-widest leading-tight">Zero Preservatives</p></div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}