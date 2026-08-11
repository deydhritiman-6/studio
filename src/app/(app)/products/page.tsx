
'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import type { Product, ProductDimensions, ProductGallery, SurfacePattern, SegmentType, SurfacePatternParams } from '@/lib/types';
import { 
  PlusCircle, 
  Loader2, 
  Upload, 
  Trash2, 
  Edit, 
  Ruler, 
  AlertCircle, 
  RefreshCw, 
  PackageSearch, 
  Eye, 
  CopyCheck,
  Search,
  CheckCircle2,
  Images,
  Palette,
  Droplets,
  Sparkles,
  Layers,
  ArrowRight,
  LayoutGrid,
  X,
  RotateCw,
  Maximize,
  Move
} from 'lucide-react';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { useCollection, useFirestore } from '@/firebase';
import { collection, doc, setDoc, updateDoc, query, where } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ChocolateMeshViewer } from '@/components/chocolate-mesh-viewer';
import { TextureSelector } from '@/components/texture-selector';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CHOCOLATE_TEXTURES, DEFAULT_TEXTURE } from '@/lib/textures';
import Link from 'next/link';

const SHAPE_CONFIG: Record<string, { fields: { name: string; label: string; placeholder?: string; type: 'number' | 'text' }[] }> = {
  Square: {
    fields: [
      { name: 'sideLength', label: 'Side Length (MM)', type: 'number' },
      { name: 'height', label: 'Height (MM)', type: 'number' },
    ]
  },
  Rectangular: {
    fields: [
      { name: 'length', label: 'Length (MM)', type: 'number' },
      { name: 'width', label: 'Width (MM)', type: 'number' },
      { name: 'height', label: 'Height (MM)', type: 'number' },
    ]
  },
  Bar: {
    fields: [
      { name: 'length', label: 'Bar Length (MM)', type: 'number' },
      { name: 'width', label: 'Bar Width (MM)', type: 'number' },
      { name: 'height', label: 'Thickness (MM)', type: 'number' },
    ]
  },
  Spherical: {
    fields: [
      { name: 'diameter', label: 'Diameter (MM)', type: 'number' },
    ]
  },
  'Half Spherical': {
    fields: [
      { name: 'diameter', label: 'Diameter (MM)', type: 'number' },
      { name: 'height', label: 'Height (MM)', type: 'number' },
    ]
  },
  Dome: {
    fields: [
      { name: 'diameter', label: 'Base Diameter (MM)', type: 'number' },
      { name: 'height', label: 'Dome Height (MM)', type: 'number' },
    ]
  },
  Circular: {
    fields: [
      { name: 'diameter', label: 'Diameter (MM)', type: 'number' },
      { name: 'height', label: 'Height (MM)', type: 'number' },
    ]
  },
  Round: {
    fields: [
      { name: 'diameter', label: 'Diameter (MM)', type: 'number' },
      { name: 'height', label: 'Height (MM)', type: 'number' },
    ]
  },
  Cylindrical: {
    fields: [
      { name: 'diameter', label: 'Diameter (MM)', type: 'number' },
      { name: 'height', label: 'Height (MM)', type: 'number' },
    ]
  },
  Oval: {
    fields: [
      { name: 'length', label: 'Length (MM)', type: 'number' },
      { name: 'width', label: 'Width (MM)', type: 'number' },
      { name: 'height', label: 'Height (MM)', type: 'number' },
    ]
  },
  Heart: {
    fields: [
      { name: 'width', label: 'Width (MM)', type: 'number' },
      { name: 'height', label: 'Height (MM)', type: 'number' },
    ]
  },
  Triangular: {
    fields: [
      { name: 'base', label: 'Base (MM)', type: 'number' },
      { name: 'height', label: 'Height (MM)', type: 'number' },
      { name: 'length', label: 'Length (MM)', type: 'number' },
    ]
  },
  Conical: {
    fields: [
      { name: 'diameter', label: 'Base Diameter (MM)', type: 'number' },
      { name: 'height', label: 'Height (MM)', type: 'number' },
    ]
  },
  Irregular: {
    fields: [
      { name: 'length', label: 'Length (MM)', type: 'number' },
      { name: 'width', label: 'Width (MM)', type: 'number' },
      { name: 'height', label: 'Height (MM)', type: 'number' },
      { name: 'additionalDescription', label: 'Description', type: 'text' },
    ]
  },
  Other: {
    fields: [
      { name: 'custom1', label: 'Custom Dimension 1 (MM)', type: 'number' },
      { name: 'customLabel1', label: 'Label for Dim 1', type: 'text' },
      { name: 'custom2', label: 'Custom Dimension 2 (MM)', type: 'number' },
      { name: 'customLabel2', label: 'Label for Dim 2', type: 'text' },
      { name: 'custom3', label: 'Custom Dimension 3 (MM)', type: 'number' },
      { name: 'customLabel3', label: 'Label for Dim 3', type: 'text' },
      { name: 'additionalDescription', label: 'Description', type: 'text' },
    ]
  }
};

const productFormSchema = z.object({
  name: z.string().min(1, 'Name of the Product is required.'),
  flavor: z.string().min(1, 'Flavor profile is required.'),
  weight: z.string().optional(),
  productShape: z.enum(['Square', 'Rectangular', 'Spherical', 'Half Spherical', 'Circular', 'Cylindrical', 'Oval', 'Heart', 'Triangular', 'Conical', 'Irregular', 'Other', 'Bar', 'Dome', 'Round']).default('Rectangular'),
  textureId: z.string().default(DEFAULT_TEXTURE.id),
  surfacePattern: z.enum(['None', 'Molded Chocolate Grid Texture', 'Rippled Surface', 'Wavy Surface', 'Ribbed Surface', 'Striped Surface', 'Crosshatch Surface', 'Polka Dot Surface', 'Granular Surface', 'Embossed Surface', 'Debossed Surface']).default('None'),
  segmentType: z.enum(['Square', 'Rectangular', 'Rounded', 'Modular', 'Premium']).default('Square'),
  productDimensions: z.object({
    unit: z.enum(['mm', 'cm', 'inch']).default('mm'),
    length: z.coerce.number().optional(),
    width: z.coerce.number().optional(),
    height: z.coerce.number().optional(),
    diameter: z.coerce.number().optional(),
    sideLength: z.coerce.number().optional(),
    base: z.coerce.number().optional(),
    radius: z.coerce.number().optional(),
    custom1: z.coerce.number().optional(),
    custom2: z.coerce.number().optional(),
    custom3: z.coerce.number().optional(),
    customLabel1: z.string().optional(),
    customLabel2: z.string().optional(),
    customLabel3: z.string().optional(),
    additionalDescription: z.string().optional(),
  }),
  surfacePatternParams: z.object({
    length: z.coerce.number().optional().default(10),
    width: z.coerce.number().optional().default(10),
    depth: z.coerce.number().optional().default(1),
    scale: z.coerce.number().optional().default(1),
    repeatX: z.coerce.number().optional().default(4),
    repeatY: z.coerce.number().optional().default(4),
    spacing: z.coerce.number().optional().default(0),
    offsetX: z.coerce.number().optional().default(0),
    offsetY: z.coerce.number().optional().default(0),
    rotation: z.coerce.number().optional().default(0),
  }).default({}),
  price: z.coerce.number().min(0, 'Retail Value must be at least 0.'),
  wholesalePrice: z.coerce.number().min(0, 'Wholesale Value must be at least 0.'),
  availabilityStatus: z.enum(['In Stock', 'Out of Stock']),
  mainImage: z.string().min(1, 'Main Photo is required.'),
  subPhoto1: z.string().optional(),
  subPhoto2: z.string().optional(),
  subPhoto3: z.string().optional(),
  imageHint: z.string().default('artisan chocolate'),
});

type ProductFormValues = z.infer<typeof productFormSchema>;

const sanitizeData = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map(sanitizeData);
  } else if (obj !== null && typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj)
        .filter(([_, v]) => v !== undefined && v !== null && (typeof v !== 'number' || !Number.isNaN(v)))
        .map(([k, v]) => [k, sanitizeData(v)])
    );
  }
  return obj;
};

export default function ProductsPage() {
  const firestore = useFirestore();
  const productsQuery = useMemo(() => firestore ? collection(firestore, 'products') : null, [firestore]);
  const { data: allProductsRaw, loading } = useCollection<Product>(productsQuery);

  const galleriesQuery = useMemo(() => firestore ? collection(firestore, 'product-galleries') : null, [firestore]);
  const { data: galleries } = useCollection<ProductGallery>(galleriesQuery);
  
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isGalleryPickerOpen, setIsGalleryPickerOpen] = useState<{ open: boolean, field: keyof ProductFormValues } | null>(null);
  const [productToArchive, setProductToArchive] = useState<Product | null>(null);
  
  const { toast } = useToast();
  
  const [viewingProduct, setViewingProduct] = useState<{images: string[], startIndex: number, productName: string, hint: string} | null>(null);
  const [identityMode, setIdentityMode] = useState<'existing' | 'new'>('existing');

  const galleryIdentities = useMemo(() => {
    const namesWithGalleries = galleries?.map(g => g.productName) || [];
    return Array.from(new Set(namesWithGalleries)).sort();
  }, [galleries]);

  const products = useMemo(() => {
    if (!allProductsRaw || !galleries) return [];
    
    const list: Product[] = [];
    
    // 1. Incorporate every single entry from the Photo Gallery into the Portfolio
    galleries.forEach(g => {
      const base = allProductsRaw.find(p => p.id === g.productId || p.name === g.productName);
      
      list.push({
        ...(base || {}),
        id: base?.id || g.id,
        name: g.productName,
        flavor: base?.flavor || 'Artisan Selection',
        price: base?.price || 0,
        wholesalePrice: base?.wholesalePrice || 0,
        availabilityStatus: base?.availabilityStatus || 'In Stock',
        imageUrls: [g.mainImage, ...g.subImages], // Use images from the Gallery
        imageHint: base?.imageHint || 'artisan chocolate',
        productShape: base?.productShape || 'Rectangular',
        sku: base?.sku,
        textureName: base?.textureName,
        productionStatus: 'Product Ready',
        isArchived: false,
      } as Product);
    });

    // 2. Add technical products that are "Product Ready" but don't have a manual Gallery entry yet
    allProductsRaw.forEach(p => {
      if (p.productionStatus === 'Product Ready' && !p.isArchived) {
        const alreadyInList = list.some(item => item.id === p.id || item.name === p.name);
        if (!alreadyInList) {
          list.push(p);
        }
      }
    });

    return list.sort((a, b) => a.name.localeCompare(b.name));
  }, [allProductsRaw, galleries]);

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: '',
      flavor: '',
      weight: '',
      productShape: 'Rectangular',
      textureId: DEFAULT_TEXTURE.id,
      surfacePattern: 'None',
      segmentType: 'Square',
      productDimensions: { unit: 'mm' },
      surfacePatternParams: {
        length: 10,
        width: 10,
        depth: 1,
        scale: 1,
        repeatX: 4,
        repeatY: 4,
        spacing: 0,
        offsetX: 0,
        offsetY: 0,
        rotation: 0,
      },
      price: 0,
      wholesalePrice: 0,
      availabilityStatus: 'In Stock',
      mainImage: '',
      subPhoto1: '',
      subPhoto2: '',
      subPhoto3: '',
      imageHint: 'artisan chocolate',
    }
  });

  const watchShape = useWatch({ control: form.control, name: 'productShape' });
  const watchTextureId = useWatch({ control: form.control, name: 'textureId' });
  const watchPattern = useWatch({ control: form.control, name: 'surfacePattern' });
  const watchSegment = useWatch({ control: form.control, name: 'segmentType' });
  const watchDimensions = useWatch({ control: form.control, name: 'productDimensions' });
  const watchPatternParams = useWatch({ control: form.control, name: 'surfacePatternParams' });

  const currentTexture = useMemo(() => CHOCOLATE_TEXTURES.find(t => t.id === watchTextureId) || DEFAULT_TEXTURE, [watchTextureId]);

  useEffect(() => {
    if (editingProduct) {
      const urls = editingProduct.imageUrls || [];
      form.reset({
        name: editingProduct.name,
        flavor: editingProduct.flavor,
        weight: editingProduct.weight || '',
        productShape: (editingProduct.productShape as any) || 'Rectangular',
        textureId: editingProduct.textureId || DEFAULT_TEXTURE.id,
        surfacePattern: editingProduct.surfacePattern || 'None',
        segmentType: editingProduct.segmentType || 'Square',
        productDimensions: editingProduct.productDimensions || { unit: 'mm' } as ProductDimensions,
        surfacePatternParams: editingProduct.surfacePatternParams || {
          length: 10,
          width: 10,
          depth: 1,
          scale: 1,
          repeatX: 4,
          repeatY: 4,
          spacing: 0,
          offsetX: 0,
          offsetY: 0,
          rotation: 0,
        },
        price: editingProduct.price,
        wholesalePrice: editingProduct.wholesalePrice,
        availabilityStatus: editingProduct.availabilityStatus,
        mainImage: urls[0] || '',
        subPhoto1: urls[1] || '',
        subPhoto2: urls[2] || '',
        subPhoto3: urls[3] || '',
        imageHint: editingProduct.imageHint || 'artisan chocolate',
      });
      setIdentityMode('existing');
    } else if (isAddDialogOpen) {
      form.reset({
        name: '',
        flavor: '',
        weight: '',
        productShape: 'Rectangular',
        textureId: DEFAULT_TEXTURE.id,
        surfacePattern: 'None',
        segmentType: 'Square',
        productDimensions: { unit: 'mm' } as ProductDimensions,
        surfacePatternParams: {
          length: 10,
          width: 10,
          depth: 1,
          scale: 1,
          repeatX: 4,
          repeatY: 4,
          spacing: 0,
          offsetX: 0,
          offsetY: 0,
          rotation: 0,
        },
        price: 0,
        wholesalePrice: 0,
        availabilityStatus: 'In Stock',
        mainImage: '',
        subPhoto1: '',
        subPhoto2: '',
        subPhoto3: '',
        imageHint: 'artisan chocolate',
      });
      setIdentityMode('new');
    }
  }, [editingProduct, form, isAddDialogOpen]);

  const handleReEnroll = (product: Product) => {
    setEditingProduct(null);
    setIsAddDialogOpen(true);
    
    setTimeout(() => {
      const urls = product.imageUrls || [];
      form.reset({
        name: product.name,
        flavor: product.flavor,
        weight: product.weight || '',
        productShape: (product.productShape as any) || 'Rectangular',
        textureId: product.textureId || DEFAULT_TEXTURE.id,
        surfacePattern: product.surfacePattern || 'None',
        segmentType: product.segmentType || 'Square',
        productDimensions: product.productDimensions || { unit: 'mm' } as ProductDimensions,
        surfacePatternParams: product.surfacePatternParams || {
          length: 10,
          width: 10,
          depth: 1,
          scale: 1,
          repeatX: 4,
          repeatY: 4,
          spacing: 0,
          offsetX: 0,
          offsetY: 0,
          rotation: 0,
        },
        price: product.price,
        wholesalePrice: product.wholesalePrice,
        availabilityStatus: product.availabilityStatus,
        mainImage: urls[0] || '',
        subPhoto1: urls[1] || '',
        subPhoto2: urls[2] || '',
        subPhoto3: urls[3] || '',
        imageHint: product.imageHint || 'artisan chocolate',
      });
      setIdentityMode('existing');
    }, 100);
  };

  const optimizeImage = (dataUrl: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        const scale = MAX_WIDTH / img.width;
        canvas.width = MAX_WIDTH;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.6)); 
      };
      img.src = dataUrl;
    });
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>, fieldName: keyof ProductFormValues) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const optimized = await optimizeImage(event.target?.result as string);
      form.setValue(fieldName, optimized, { shouldValidate: true });
    };
    reader.readAsDataURL(file);
  };

  const saveProduct = async (values: ProductFormValues, id?: string) => {
    if (!firestore) return;

    setIsSaving(true);
    const productId = id || `P${Date.now()}`;
    const productRef = doc(firestore, 'products', productId);
    
    const imageUrls = [values.mainImage, values.subPhoto1, values.subPhoto2, values.subPhoto3].filter(Boolean) as string[];
    const texture = CHOCOLATE_TEXTURES.find(t => t.id === values.textureId) || DEFAULT_TEXTURE;

    const productData = sanitizeData({ 
      ...values, 
      id: productId,
      imageUrls,
      textureName: texture.name,
      textureCategory: texture.category,
      productionStatus: 'Product Ready'
    });

    setDoc(productRef, productData, { merge: true })
      .then(() => {
        setIsAddDialogOpen(false);
        setEditingProduct(null);
        setIsSaving(false);
        toast({ title: id ? 'Creation Refined' : 'Creation Registered' });
      })
      .catch(async (serverError) => {
        setIsSaving(false);
        const permissionError = new FirestorePermissionError({
          path: productRef.path,
          operation: id ? 'update' : 'create',
          requestResourceData: productData,
        });
        errorEmitter.emit('permission-error', permissionError);
      });
  };

  const handleMoveToBin = (id: string) => {
    if (!firestore) return;
    const productRef = doc(firestore, 'products', id);
    updateDoc(productRef, { isArchived: true, deletedAt: new Date().toISOString() })
      .then(() => { toast({ title: 'Moved to Bin' }); setProductToArchive(null); })
      .catch((e) => {
        console.error('Archive failed - likely gallery-only item:', e);
        setProductToArchive(null);
        toast({ variant: 'destructive', title: 'Action Failed', description: 'This item is currently only managed in the Photo Gallery.' });
      });
  };

  const PhotoSlot = ({ fieldName, label, required = false }: { fieldName: keyof ProductFormValues, label: string, required?: boolean }) => {
    const value = form.watch(fieldName) as string;
    const fileInputRef = useRef<HTMLInputElement>(null);

    return (
      <div className="space-y-2">
        <Label className="uppercase text-[9px] font-black tracking-widest text-muted-foreground flex justify-between">
          {label} {required && <span className="text-primary">*</span>}
          {value && (
            <button type="button" onClick={() => form.setValue(fieldName, '', { shouldValidate: true })} className="text-destructive hover:text-destructive/80 flex items-center gap-1 transition-colors">
              <Trash2 className="h-2.5 w-2.5" /> Remove
            </button>
          )}
        </Label>
        <div className={cn(
            "aspect-[4/3] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center transition-all duration-300 relative group overflow-hidden bg-muted/20",
            value ? "border-primary/40 bg-background" : "border-stone-200 hover:border-primary/30"
          )}>
          {value ? (
            <>
              <Image src={value} alt={label} fill className="object-cover" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                 <Button type="button" size="sm" variant="secondary" className="h-8 rounded-lg text-[9px] font-bold uppercase" onClick={() => fileInputRef.current?.click()}>
                    <RefreshCw className="h-3 w-3 mr-1" /> Replace
                 </Button>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-4">
               <div className="flex gap-2">
                  <Button type="button" variant="outline" size="sm" className="h-9 px-4 rounded-xl text-[9px] font-bold uppercase tracking-widest border-2 hover:bg-primary/10 hover:text-primary transition-all" onClick={() => fileInputRef.current?.click()}>
                    <Upload className="h-3 w-3 mr-2" /> Device
                  </Button>
                  <Button type="button" variant="outline" size="sm" className="h-9 px-4 rounded-xl text-[9px] font-bold uppercase tracking-widest border-2 hover:bg-accent/10 hover:text-accent transition-all" onClick={() => setIsGalleryPickerOpen({ open: true, field: fieldName })}>
                    <Images className="h-3 w-3 mr-2" /> Gallery
                  </Button>
               </div>
               <span className="text-[8px] font-black uppercase tracking-widest text-stone-300">Select Acquisition Mode</span>
            </div>
          )}
          <input type="file" ref={fileInputRef} onChange={(e) => handleFileSelect(e, fieldName)} className="hidden" accept="image/jpeg,image/png,image/webp" />
        </div>
      </div>
    );
  };

  return (
    <TooltipProvider>
      <Dialog open={!!viewingProduct} onOpenChange={(open) => !open && setViewingProduct(null)}>
        <DialogContent className="sm:max-w-4xl p-0 border-0 bg-transparent shadow-none">
          {viewingProduct && (
            <Carousel opts={{ startIndex: viewingProduct.startIndex, loop: true }} className="w-full">
              <CarouselContent>
                {viewingProduct.images.map((url, index) => (
                  <CarouselItem key={index}>
                    <div className="aspect-video relative">
                      <Image src={url} alt={`Preview ${index + 1}`} fill className="object-contain" data-ai-hint={viewingProduct.hint} sizes="(max-width: 768px) 100vw, 800px" />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="absolute left-4 top-1/2 -translate-y-1/2 text-white bg-black/60 hover:bg-black/80 h-10 w-10 border-none rounded-full" />
              <CarouselNext className="absolute right-4 top-1/2 -translate-y-1/2 text-white bg-black/60 h-10 w-10 border-none rounded-full" />
            </Carousel>
          )}
        </DialogContent>
      </Dialog>
      
      <Dialog open={isAddDialogOpen || !!editingProduct} onOpenChange={(open) => { if (!open) { setEditingProduct(null); setIsAddDialogOpen(false); } }}>
        <DialogContent 
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
          className="sm:max-w-6xl rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden flex flex-col h-[95vh] bg-background"
        >
          <div className="px-10 py-6 border-b shrink-0 bg-background z-20 flex items-center justify-between">
            <DialogHeader className="space-y-1 text-left">
              <DialogTitle className="text-3xl font-headline text-foreground">{editingProduct ? 'Refine Creation' : 'Register New Creation'}</DialogTitle>
              <DialogDescription className="text-[10px] uppercase tracking-[0.2em] font-black text-muted-foreground/60">Artisanal Visual & Technical Specification</DialogDescription>
            </DialogHeader>
            <DialogClose asChild>
              <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full hover:bg-muted transition-colors">
                <X className="h-6 w-6" />
                <span className="sr-only">Close</span>
              </Button>
            </DialogClose>
          </div>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit((v) => saveProduct(v, editingProduct?.id))} className="flex flex-col flex-1 overflow-hidden">
              <ScrollArea className="flex-1 px-10 custom-scrollbar" dual>
                <div className="space-y-12 py-10">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <FormField control={form.control} name="name" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="uppercase text-[10px] font-black tracking-widest text-muted-foreground">Product Identity</FormLabel>
                        <Tabs value={identityMode} onValueChange={(v: any) => setIdentityMode(v)} className="w-full">
                           <TabsList className="grid w-full grid-cols-2 bg-muted/30 h-9 rounded-xl p-1 mb-2">
                             <TabsTrigger value="existing" className="rounded-lg text-[9px] uppercase font-bold">Select Existing</TabsTrigger>
                             <TabsTrigger value="new" className="rounded-lg text-[9px] uppercase font-bold">Create New</TabsTrigger>
                           </TabsList>
                           <TabsContent value="existing" className="mt-0">
                             <Select onValueChange={(val) => { field.onChange(val); const gal = galleries?.find(g => g.productName === val); if (gal) { form.setValue('mainImage', gal.mainImage, { shouldValidate: true }); form.setValue('subPhoto1', gal.subImages?.[0] || '', { shouldValidate: true }); form.setValue('subPhoto2', gal.subImages?.[1] || '', { shouldValidate: true }); form.setValue('subPhoto3', gal.subImages?.[2] || '', { shouldValidate: true }); } }} value={field.value}>
                                <FormControl><SelectTrigger className="h-12 rounded-xl"><SelectValue placeholder="Search identities..." /></SelectTrigger></FormControl>
                                <SelectContent>{galleryIdentities.map(name => (<SelectItem key={name} value={name}>{name}</SelectItem>))}</SelectContent>
                             </Select>
                           </TabsContent>
                           <TabsContent value="new" className="mt-0">
                             <FormControl><Input placeholder="Type new identity name..." className="h-12 rounded-xl" {...field} /></FormControl>
                           </TabsContent>
                        </Tabs>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="flavor" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="uppercase text-[10px] font-black tracking-widest text-muted-foreground">Flavor Profile</FormLabel>
                        <FormControl><Input placeholder="e.g., Sea Salt Dark Truffle" className="h-12 rounded-xl" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>

                  <div className="bg-muted/20 p-10 rounded-[2.5rem] border-2 border-dashed space-y-10">
                    <div className="flex flex-col lg:flex-row gap-10">
                       <div className="lg:w-1/2 space-y-8">
                          <div className="flex items-center gap-2 text-primary font-black uppercase text-[10px] tracking-[0.2em] mb-4">
                            <Ruler className="h-4 w-4" /> Dimension Logic
                          </div>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <FormField control={form.control} name="productShape" render={({ field }) => (
                              <FormItem className="col-span-2">
                                <FormLabel className="uppercase text-[9px] font-bold text-muted-foreground">Artisan Shape</FormLabel>
                                <Select onValueChange={(val: any) => field.onChange(val)} value={field.value}>
                                  <FormControl><SelectTrigger className="h-10 rounded-xl"><SelectValue /></SelectTrigger></FormControl>
                                  <SelectContent>{Object.keys(SHAPE_CONFIG).map(shape => (<SelectItem key={shape} value={shape}>{shape}</SelectItem>))}</SelectContent>
                                </Select>
                              </FormItem>
                            )} />
                            {(SHAPE_CONFIG[watchShape] || SHAPE_CONFIG['Rectangular']).fields.map((f) => (
                              <FormField key={f.name} control={form.control} name={`productDimensions.${f.name}` as any} render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="uppercase text-[9px] font-bold text-muted-foreground">{f.label}</FormLabel>
                                  <FormControl><Input type={f.type} className="h-10 rounded-xl" {...field} value={field.value ?? ''} /></FormControl>
                                  <FormMessage />
                                </FormItem>
                              )} />
                            ))}
                          </div>

                          <Separator className="bg-stone-200/50" />
                          
                          <div className="space-y-6">
                            <div className="flex items-center gap-2 text-primary font-black uppercase text-[10px] tracking-[0.2em]">
                                <LayoutGrid className="h-4 w-4" /> Surface Pattern Workspace
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <FormField control={form.control} name="surfacePattern" render={({ field }) => (
                                  <FormItem className="col-span-2">
                                    <FormLabel className="uppercase text-[9px] font-bold text-muted-foreground">Surface Geometry</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                      <FormControl><SelectTrigger className="h-10 rounded-xl"><SelectValue /></SelectTrigger></FormControl>
                                      <SelectContent>
                                        <SelectItem value="None">None</SelectItem>
                                        <SelectItem value="Molded Chocolate Grid Texture">Signature Grid</SelectItem>
                                        <SelectItem value="Rippled Surface">Rippled</SelectItem>
                                        <SelectItem value="Wavy Surface">Wavy</SelectItem>
                                        <SelectItem value="Ribbed Surface">Ribbed</SelectItem>
                                        <SelectItem value="Striped Surface">Striped</SelectItem>
                                        <SelectItem value="Crosshatch Surface">Crosshatch</SelectItem>
                                        <SelectItem value="Polka Dot Surface">Polka Dot</SelectItem>
                                        <SelectItem value="Granular Surface">Granular</SelectItem>
                                        <SelectItem value="Embossed Surface">Embossed</SelectItem>
                                        <SelectItem value="Debossed Surface">Debossed</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </FormItem>
                                )} />

                                {watchPattern !== 'None' && (
                                  <div className="col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-4 duration-300">
                                     {watchPattern === 'Molded Chocolate Grid Texture' && (
                                       <FormField control={form.control} name="segmentType" render={({ field }) => (
                                          <FormItem>
                                            <FormLabel className="uppercase text-[9px] font-bold text-muted-foreground">Segment Geometry</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                              <FormControl><SelectTrigger className="h-10 rounded-xl"><SelectValue /></SelectTrigger></FormControl>
                                              <SelectContent>
                                                {['Square', 'Rectangular', 'Rounded', 'Modular', 'Premium'].map(s => (<SelectItem key={s} value={s}>{s}</SelectItem>))}
                                              </SelectContent>
                                            </Select>
                                          </FormItem>
                                        )} />
                                     )}

                                     <div className="col-span-2 border-t pt-6 mt-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                        <FormField control={form.control} name="surfacePatternParams.length" render={({ field }) => (
                                          <FormItem>
                                            <FormLabel className="uppercase text-[8px] font-black text-stone-400 flex items-center gap-1"><Maximize className="h-3 w-3" /> Unit Length (MM)</FormLabel>
                                            <FormControl><Input type="number" className="h-10 rounded-xl" {...field} /></FormControl>
                                          </FormItem>
                                        )} />
                                        <FormField control={form.control} name="surfacePatternParams.width" render={({ field }) => (
                                          <FormItem>
                                            <FormLabel className="uppercase text-[8px] font-black text-stone-400 flex items-center gap-1"><Maximize className="h-3 w-3 rotate-90" /> Unit Width (MM)</FormLabel>
                                            <FormControl><Input type="number" className="h-10 rounded-xl" {...field} /></FormControl>
                                          </FormItem>
                                        )} />
                                        <FormField control={form.control} name="surfacePatternParams.depth" render={({ field }) => (
                                          <FormItem>
                                            <FormLabel className="uppercase text-[8px] font-black text-stone-400 flex items-center gap-1"><Layers className="h-3 w-3" /> Relief Depth (MM)</FormLabel>
                                            <FormControl><Input type="number" className="h-10 rounded-xl" {...field} /></FormControl>
                                          </FormItem>
                                        )} />
                                        <FormField control={form.control} name="surfacePatternParams.repeatX" render={({ field }) => (
                                          <FormItem>
                                            <FormLabel className="uppercase text-[8px] font-black text-stone-400">Repeat X (Tiling)</FormLabel>
                                            <FormControl><Input type="number" className="h-10 rounded-xl" {...field} /></FormControl>
                                          </FormItem>
                                        )} />
                                        <FormField control={form.control} name="surfacePatternParams.repeatY" render={({ field }) => (
                                          <FormItem>
                                            <FormLabel className="uppercase text-[8px] font-black text-stone-400">Repeat Y (Tiling)</FormLabel>
                                            <FormControl><Input type="number" className="h-10 rounded-xl" {...field} /></FormControl>
                                          </FormItem>
                                        )} />
                                        <FormField control={form.control} name="surfacePatternParams.rotation" render={({ field }) => (
                                          <FormItem>
                                            <FormLabel className="uppercase text-[8px] font-black text-stone-400 flex items-center gap-1"><RotateCw className="h-3 w-3" /> Rotation (°)</FormLabel>
                                            <FormControl><Input type="number" className="h-10 rounded-xl" {...field} /></FormControl>
                                          </FormItem>
                                        )} />
                                        <FormField control={form.control} name="surfacePatternParams.offsetX" render={({ field }) => (
                                          <FormItem>
                                            <FormLabel className="uppercase text-[8px] font-black text-stone-400 flex items-center gap-1"><Move className="h-3 w-3" /> Offset X</FormLabel>
                                            <FormControl><Input type="number" className="h-10 rounded-xl" {...field} /></FormControl>
                                          </FormItem>
                                        )} />
                                        <FormField control={form.control} name="surfacePatternParams.offsetY" render={({ field }) => (
                                          <FormItem>
                                            <FormLabel className="uppercase text-[8px] font-black text-stone-400 flex items-center gap-1"><Move className="h-3 w-3 rotate-90" /> Offset Y</FormLabel>
                                            <FormControl><Input type="number" className="h-10 rounded-xl" {...field} /></FormControl>
                                          </FormItem>
                                        )} />
                                        <FormField control={form.control} name="surfacePatternParams.spacing" render={({ field }) => (
                                          <FormItem>
                                            <FormLabel className="uppercase text-[8px] font-black text-stone-400">Element Spacing</FormLabel>
                                            <FormControl><Input type="number" className="h-10 rounded-xl" {...field} /></FormControl>
                                          </FormItem>
                                        )} />
                                     </div>
                                  </div>
                                )}
                            </div>
                          </div>

                          <Separator className="bg-stone-200/50" />
                          <div className="space-y-4">
                             <div className="flex items-center gap-2 text-primary font-black uppercase text-[10px] tracking-[0.2em]">
                                <Palette className="h-4 w-4" /> Design Specification Summary
                             </div>
                             <div className="grid grid-cols-2 gap-4 bg-background/50 p-6 rounded-2xl border">
                                <div className="space-y-1">
                                   <p className="text-[8px] font-black uppercase text-stone-400">Shape</p>
                                   <p className="text-sm font-bold">{watchShape}</p>
                                </div>
                                <div className="space-y-1">
                                   <p className="text-[8px] font-black uppercase text-stone-400">Texture</p>
                                   <p className="text-sm font-bold text-primary">{currentTexture.name}</p>
                                </div>
                                <div className="space-y-1">
                                   <p className="text-[8px] font-black uppercase text-stone-400">Surface Relief</p>
                                   <p className="text-xs font-medium text-stone-600">{watchPattern}</p>
                                </div>
                                {watchPattern !== 'None' && (
                                  <div className="space-y-1">
                                    <p className="text-[8px] font-black uppercase text-stone-400">Unit Size</p>
                                    <p className="text-xs font-medium text-stone-600">{watchPatternParams.length}x{watchPatternParams.width} mm</p>
                                  </div>
                                )}
                                {watchPattern === 'Molded Chocolate Grid Texture' && (
                                  <div className="space-y-1">
                                    <p className="text-[8px] font-black uppercase text-stone-400">Segments</p>
                                    <p className="text-xs font-medium text-stone-600">{watchSegment}</p>
                                  </div>
                                )}
                                <div className="space-y-1 col-span-2">
                                   <p className="text-[8px] font-black uppercase text-stone-400">Exact Dimensions</p>
                                   <p className="text-xs font-medium text-stone-600">
                                      {watchDimensions.length || watchDimensions.sideLength || watchDimensions.diameter || '0'} x {watchDimensions.width || watchDimensions.sideLength || watchDimensions.diameter || '0'} x {watchDimensions.height || '0'} mm
                                   </p>
                                </div>
                             </div>
                          </div>
                       </div>
                       
                       <div className="lg:w-1/2">
                          <ChocolateMeshViewer 
                            shape={watchShape} 
                            dimensions={watchDimensions as any} 
                            textureId={watchTextureId}
                            surfacePattern={watchPattern as any}
                            segmentType={watchSegment as any}
                            patternParams={watchPatternParams as SurfacePatternParams}
                          />
                       </div>
                    </div>
                  </div>

                  <div className="space-y-8">
                     <div className="flex items-center gap-2 text-primary font-black uppercase text-[10px] tracking-[0.2em]">
                        <Sparkles className="h-4 w-4" /> Artisan Texture Workspace
                     </div>
                     <TextureSelector 
                        selectedId={watchTextureId} 
                        onSelect={(id) => form.setValue('textureId', id)}
                        onRemove={() => form.setValue('textureId', DEFAULT_TEXTURE.id)}
                     />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <FormField control={form.control} name="price" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="uppercase text-[10px] font-black tracking-widest text-muted-foreground">Retail Value (₹)</FormLabel>
                        <FormControl><Input type="number" className="h-12 rounded-xl" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="wholesalePrice" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="uppercase text-[10px] font-black tracking-widest text-muted-foreground">Wholesale Value (₹)</FormLabel>
                        <FormControl><Input type="number" className="h-12 rounded-xl" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>

                  <div className="space-y-6">
                    <h3 className="uppercase text-[10px] font-black tracking-widest text-muted-foreground border-b pb-2">Photography Asset Control</h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                       <div className="md:col-span-1"><PhotoSlot fieldName="mainImage" label="Main Portrait" required /></div>
                       <div className="md:col-span-3 grid grid-cols-3 gap-6">
                          <PhotoSlot fieldName="subPhoto1" label="Perspective A" />
                          <PhotoSlot fieldName="subPhoto2" label="Perspective B" />
                          <PhotoSlot fieldName="subPhoto3" label="Perspective C" />
                       </div>
                    </div>
                  </div>
                </div>
              </ScrollArea>

              <div className="px-10 py-6 shrink-0 border-t flex items-center justify-end gap-6 bg-background">
                <DialogClose asChild><Button type="button" variant="secondary" className="h-12 px-8 rounded-xl font-bold uppercase text-[10px] tracking-widest">Discard</Button></DialogClose>
                <Button type="submit" disabled={isSaving} className="h-12 px-12 rounded-xl shadow-2xl shadow-primary/20 font-bold uppercase text-[10px] tracking-widest min-w-[220px]">
                  {isSaving ? <><Loader2 className="mr-3 h-4 w-4 animate-spin" /> Processing...</> : (editingProduct ? 'Save Refinement' : 'Register Creation')}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!isGalleryPickerOpen} onOpenChange={(open) => !open && setIsGalleryPickerOpen(null)}>
        <DialogContent className="sm:max-w-4xl rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden flex flex-col h-[80vh] bg-stone-50">
           <div className="px-10 py-6 border-b bg-white shrink-0">
              <DialogHeader><DialogTitle className="text-2xl font-headline flex items-center gap-3"><Images className="h-6 w-6 text-primary" /> Select from Artisan Gallery</DialogTitle></DialogHeader>
           </div>
           <ScrollArea className="flex-1 p-10">
              <div className="space-y-12">
                 {galleryIdentities.map(productName => {
                    const pg = galleries?.filter(g => g.productName === productName) || [];
                    if (pg.length === 0) return null;
                    return (
                      <div key={productName} className="space-y-4">
                         <h3 className="text-lg font-headline font-bold text-stone-800 border-l-4 border-primary/40 pl-4">{productName}</h3>
                         <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
                            {pg.map(entry => ([entry.mainImage, ...entry.subImages].map((img, idx) => (
                                <button key={`${entry.id}-${idx}`} type="button" onClick={() => { if (isGalleryPickerOpen?.field) { form.setValue(isGalleryPickerOpen.field, img, { shouldValidate: true }); setIsGalleryPickerOpen(null); } }} className="aspect-square relative rounded-xl overflow-hidden group border-2 border-transparent hover:border-primary transition-all shadow-sm">
                                  <Image src={img} alt="" fill className="object-cover group-hover:scale-110 transition-transform duration-500" sizes="(max-width: 768px) 150px, 200px" />
                                  <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 flex items-center justify-center"><CheckCircle2 className="text-white h-8 w-8 drop-shadow-xl" /></div>
                                </button>
                            ))))}
                         </div>
                      </div>
                    );
                 })}
              </div>
           </ScrollArea>
           <div className="px-10 py-4 border-t bg-white shrink-0 flex justify-end">
              <Button variant="ghost" onClick={() => setIsGalleryPickerOpen(null)} className="rounded-xl font-bold uppercase text-[10px] tracking-widest">Close Gallery</Button>
           </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!productToArchive} onOpenChange={(o) => !o && setProductToArchive(null)}>
        <DialogContent className="sm:max-w-md rounded-[2.5rem] border-none shadow-2xl overflow-hidden p-0">
          <div className="bg-amber-50 p-8 border-b border-amber-100"><DialogHeader><DialogTitle className="text-2xl font-headline flex items-center gap-3 text-amber-700"><Trash2 className="h-8 w-8" /> Move to Bin</DialogTitle></DialogHeader></div>
          <div className="p-10 flex gap-4">
             <Button variant="ghost" onClick={() => setProductToArchive(null)} className="flex-1 h-12 rounded-xl font-bold uppercase text-[10px] tracking-widest">Abort</Button>
             <Button className="flex-2 px-10 h-12 rounded-xl font-bold uppercase text-[10px] tracking-widest shadow-xl shadow-primary/20" onClick={() => productToArchive && handleMoveToBin(productToArchive.id)}>Confirm Move</Button>
          </div>
        </DialogContent>
      </Dialog>
      
      <PageHeader title="Artisan Portfolio" actions={
          <div className="flex gap-2">
            <Button asChild variant="outline" className="rounded-xl h-11 px-6 border-2"><Link href="/products/bin"><Trash2 className="mr-2 h-4 w-4" /> View Bin</Link></Button>
            <Button onClick={() => setIsAddDialogOpen(true)} className="rounded-xl h-11 px-6 shadow-lg shadow-primary/20"><PlusCircle className="mr-2 h-4 w-4" /> New Creation</Button>
          </div>
      } />
      
      {loading ? (<div className="flex justify-center py-20"><Loader2 className="animate-spin h-10 w-10 text-primary" /></div>) : products.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-80 border-2 border-dashed rounded-[2.5rem] bg-muted/50 text-center px-4">
           <PackageSearch className="h-16 w-16 text-muted-foreground mb-6" />
           <p className="text-muted-foreground font-headline text-2xl italic">The collection is currently awaiting its first production batch.</p>
           <Button variant="link" className="text-primary mt-4" onClick={() => setIsAddDialogOpen(true)}>Define prototype</Button>
        </div>
      ) : (
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => (
            <Card key={product.id} className="flex flex-col group overflow-hidden border-none shadow-sm hover:shadow-2xl transition-all duration-500 rounded-[2rem] bg-card relative">
              <CardHeader className="p-0 relative">
                 <button type="button" className="block w-full aspect-[4/3] relative overflow-hidden" onClick={() => setViewingProduct({ images: product.imageUrls, startIndex: 0, productName: product.name, hint: product.imageHint })}>
                    <Image 
                      src={product.imageUrls?.[0] || 'https://picsum.photos/seed/default/400/300'} 
                      alt={product.name} 
                      fill 
                      className={`object-cover transition-transform duration-700 ${product.availabilityStatus === 'Out of Stock' ? 'grayscale opacity-60' : 'group-hover:scale-110'}`}
                      data-ai-hint={product.imageHint}
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  </button>
                  <div className="absolute top-4 left-4 flex gap-2">
                    {product.sku && <Badge variant="secondary" className="uppercase tracking-tighter text-[8px]">{product.sku}</Badge>}
                    <Badge variant="outline" className="bg-white/90 backdrop-blur-sm border-none shadow-sm uppercase tracking-widest text-[8px] font-black">{product.productShape}</Badge>
                  </div>
                  <div className="absolute top-4 right-4 translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-500">
                    <Button variant="destructive" size="icon" className="h-8 w-8 rounded-full shadow-2xl bg-white/20 backdrop-blur-md border border-white/20 hover:bg-destructive" onClick={(e) => { e.stopPropagation(); setProductToArchive(product); }}><Trash2 className="h-4 w-4" /></Button>
                  </div>
              </CardHeader>
              <CardContent className="p-6 flex-grow space-y-6">
                <div className="space-y-1">
                   <CardTitle className="font-headline text-2xl group-hover:text-primary transition-colors duration-300 leading-none">{product.name}</CardTitle>
                   <p className="text-[10px] text-stone-400 uppercase tracking-[0.3em] font-black">{product.flavor}</p>
                </div>
                <div className="flex justify-between items-end pt-4 border-t">
                  <div className="space-y-0.5">
                    <p className="text-2xl font-bold">₹{product.price.toLocaleString()}</p>
                    <p className="text-[9px] text-stone-400 uppercase tracking-widest">{product.textureName || 'Smooth Milk'}</p>
                  </div>
                  <Badge variant={product.availabilityStatus === 'In Stock' ? 'default' : 'destructive'} className="rounded-full uppercase tracking-widest text-[8px] py-1.5 px-4">{product.availabilityStatus}</Badge>
                </div>
              </CardContent>
              <CardFooter className="p-6 pt-0 grid grid-cols-2 gap-3">
                <Button variant="outline" className="rounded-2xl h-11 font-bold uppercase text-[9px] tracking-widest" onClick={() => setEditingProduct(product)}><Edit className="h-3 w-3 mr-1.5" /> Refine</Button>
                <Button variant="secondary" className="rounded-2xl h-11 font-bold uppercase text-[9px] tracking-widest" onClick={() => handleReEnroll(product)}><CopyCheck className="h-3 w-3 mr-1.5" /> Re-Enroll</Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </TooltipProvider>
  );
}
