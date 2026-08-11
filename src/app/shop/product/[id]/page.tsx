'use client';

import { useState, useEffect, useMemo } from 'react';
import type { Product, ProductGallery } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { ShoppingCart, ArrowLeft, CheckCircle2, Star, ShieldCheck, Loader2, Ruler, Cuboid, ChevronLeft, ChevronRight } from 'lucide-react';
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
  
  // Attempt to fetch from primary products collection
  const productRef = useMemo(() => firestore ? doc(firestore, 'products', productId) : null, [firestore, productId]);
  const { data: productRaw, loading: productLoading } = useDoc<Product>(productRef as any);

  // Fetch associated gallery entries
  const galleriesQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'product-galleries'), where('productId', '==', productId));
  }, [firestore, productId]);
  
  const { data: galleries, loading: galleriesLoading } = useCollection<ProductGallery>(galleriesQuery);

  // Fallback: If product doc doesn't exist, it might be a virtual product from gallery
  const virtualGalleryQuery = useMemo(() => {
    if (!firestore || (productRaw && !productRaw.isArchived)) return null;
    return query(collection(firestore, 'product-galleries'), where('id', '==', productId));
  }, [firestore, productId, productRaw]);
  
  const { data: virtualGalleries } = useCollection<ProductGallery>(virtualGalleryQuery);

  const product = useMemo(() => {
    const galleryEntry = virtualGalleries?.[0] || galleries?.[0];
    
    if (productRaw && !productRaw.isArchived) {
      return {
        ...productRaw,
        imageUrls: Array.from(new Set([
          ...(productRaw.imageUrls || []),
          ...(galleryEntry ? [galleryEntry.mainImage, ...galleryEntry.subImages] : [])
        ]))
      };
    }
    
    if (galleryEntry) {
      return {
        id: galleryEntry.id,
        name: galleryEntry.productName,
        flavor: 'Artisan Selection',
        description: 'Meticulously tempered in Kolkata for the true connoisseur. Zero artificial preservatives. Just pure artisan joy.',
        price: 0,
        wholesalePrice: 0,
        availabilityStatus: 'In Stock',
        imageUrls: [galleryEntry.mainImage, ...galleryEntry.subImages],
        imageHint: 'artisan chocolate',
        productShape: 'Rectangular',
        productionStatus: 'Product Ready',
        isArchived: false,
      } as Product;
    }

    return null;
  }, [productRaw, galleries, virtualGalleries]);

  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const allImages = useMemo(() => product?.imageUrls || [], [product]);
  const mainPreviewImage = selectedImage || allImages[0] || 'https://picsum.photos/seed/default/400/300';
  
  // Display alternative images in thumbnails (exclude the one currently featured on top)
  const thumbnails = useMemo(() => {
    return allImages.filter(url => url !== mainPreviewImage);
  }, [allImages, mainPreviewImage]);

  // Reset gallery state when product changes to ensure it opens with primary image
  useEffect(() => {
    setSelectedImage(null);
  }, [productId]);

  if (productLoading || galleriesLoading) return <div className="flex items-center justify-center py-32"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
  
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
        if (Array.isArray(parsed)) cart = savedRaw ? JSON.parse(savedRaw) : [];
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

  const handleNextImage = () => {
    const currentIndex = allImages.indexOf(mainPreviewImage);
    const nextIndex = (currentIndex + 1) % allImages.length;
    setSelectedImage(allImages[nextIndex]);
  };

  const handlePrevImage = () => {
    const currentIndex = allImages.indexOf(mainPreviewImage);
    const prevIndex = (currentIndex - 1 + allImages.length) % allImages.length;
    setSelectedImage(allImages[prevIndex]);
  };

  return (
    <div className="space-y-12 animate-in slide-in-from-bottom-8 duration-1000">
      <div className="flex items-center justify-between">
        <Button 
          variant="ghost" 
          className="text-primary hover:text-rose-700 px-4 h-12 rounded-full hover:bg-primary/5 group transition-all duration-300 transform hover:scale-105" 
          onClick={() => router.back()}
        >
          <div className="flex items-center gap-2">
            <ArrowLeft className="h-5 w-5 transition-transform group-hover:-translate-x-2 duration-300" /> 
            <span className="text-sm md:text-base font-black uppercase tracking-[0.15em] font-headline">Back to Collection</span>
          </div>
        </Button>
        <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-300">Ref: {product.id}</div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 xl:gap-24">
        <div className="lg:col-span-7 space-y-8">
          <div className="aspect-square relative rounded-[2.5rem] overflow-hidden shadow-2xl bg-white border border-stone-100 p-8 flex flex-col">
            <div className="relative flex-1 w-full rounded-[1.5rem] overflow-hidden group">
              <Image 
                src={mainPreviewImage} 
                alt={product.name} 
                fill 
                className="object-cover transition-all duration-[1s] group-hover:scale-110" 
                priority 
                data-ai-hint={product.imageHint} 
                sizes="(max-width: 1024px) 100vw, 800px" 
              />
              
              {/* Primary Label Overlay */}
              <div className="absolute top-6 left-6 z-20">
                <div className="bg-stone-900/60 backdrop-blur-md border border-white/20 rounded-full px-5 py-2 shadow-2xl">
                  <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white">
                    Primary Product Image
                  </p>
                </div>
              </div>

              {allImages.length > 1 && (
                <>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handlePrevImage(); }}
                    className="absolute left-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white hover:text-stone-900 z-10"
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleNextImage(); }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white hover:text-stone-900 z-10"
                    aria-label="Next image"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </button>
                </>
              )}
            </div>
          </div>
          {thumbnails.length > 0 && (
            <div className="flex flex-wrap justify-center gap-8 px-4">
               {thumbnails.map((url, i) => (
                  <button 
                    key={i} 
                    onClick={() => setSelectedImage(url)} 
                    className={`h-28 w-28 md:h-40 md:w-40 relative rounded-[1.5rem] overflow-hidden border-2 transition-all border-transparent opacity-60 hover:opacity-100 hover:scale-105 shadow-md`}
                  >
                     <Image src={url} alt={`${product.name} perspective ${i + 1}`} fill className="object-cover" data-ai-hint={product.imageHint} sizes="(max-width: 768px) 120px, 200px" />
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
            <p className="border-l-4 border-primary/20 pl-6 italic">
              {product.description || "Meticulously tempered in Kolkata for the true connoisseur. Zero artificial preservatives. Just pure artisan joy."}
            </p>
            
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
                     <p className="text-sm font-bold text-stone-900">{product.productShape || 'Rectangular'}</p>
                  </div>
                  {product.weight && (
                    <div className="space-y-1">
                       <p className="text-[9px] font-bold text-stone-400 uppercase tracking-tighter">Approx. Weight</p>
                       <p className="text-sm font-bold text-stone-900">{product.weight}</p>
                    </div>
                  )}
                  {product.sku && (
                    <div className="space-y-1">
                       <p className="text-[9px] font-bold text-stone-400 uppercase tracking-tighter">Artisan ID</p>
                       <p className="text-sm font-bold text-stone-900 font-mono">{product.sku}</p>
                    </div>
                  )}
               </div>
               
               {product.productDimensions && (
                 <div className="pt-4 border-t border-stone-200/50">
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-stone-400 mb-4">
                       <Cuboid className="h-3 w-3" /> Interactive 3D Model
                    </div>
                    <ChocolateMeshViewer 
                      shape={product.productShape || 'Rectangular'} 
                      dimensions={product.productDimensions} 
                      textureId={product.textureId} 
                      surfacePattern={product.surfacePattern}
                      segmentType={product.segmentType}
                      patternParams={product.surfacePatternParams}
                    />
                 </div>
               )}
            </div>
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
