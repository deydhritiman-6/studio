'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import type { Product, ProductDimensions } from '@/lib/types';
import { Camera, PlusCircle, Loader2, Link as LinkIcon, Upload, Image as ImageIcon, PackageSearch, Trash2, Edit, History, Info, Box, Ruler, AlertCircle, X, RefreshCw } from 'lucide-react';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { cn } from '@/lib/utils';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { useCollection, useFirestore } from '@/firebase';
import { collection, doc, setDoc } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ChocolateMeshViewer } from '@/components/chocolate-mesh-viewer';

const SHAPE_CONFIG: Record<string, { fields: { name: string; label: string; placeholder?: string; type: 'number' | 'text' }[] }> = {
  Square: {
    fields: [
      { name: 'sideLength', label: 'Side Length', type: 'number' },
      { name: 'height', label: 'Height / Thickness', type: 'number' },
    ]
  },
  Rectangular: {
    fields: [
      { name: 'length', label: 'Length', type: 'number' },
      { name: 'width', label: 'Width', type: 'number' },
      { name: 'height', label: 'Height / Thickness', type: 'number' },
    ]
  },
  Spherical: {
    fields: [
      { name: 'diameter', label: 'Diameter', type: 'number' },
    ]
  },
  'Half Spherical': {
    fields: [
      { name: 'diameter', label: 'Diameter', type: 'number' },
      { name: 'height', label: 'Height', type: 'number' },
    ]
  },
  Circular: {
    fields: [
      { name: 'diameter', label: 'Diameter', type: 'number' },
      { name: 'height', label: 'Height / Thickness', type: 'number' },
    ]
  },
  Cylindrical: {
    fields: [
      { name: 'diameter', label: 'Diameter', type: 'number' },
      { name: 'height', label: 'Height', type: 'number' },
    ]
  },
  Oval: {
    fields: [
      { name: 'length', label: 'Length', type: 'number' },
      { name: 'width', label: 'Width', type: 'number' },
      { name: 'height', label: 'Height / Thickness', type: 'number' },
    ]
  },
  Heart: {
    fields: [
      { name: 'width', label: 'Width', type: 'number' },
      { name: 'height', label: 'Height / Thickness', type: 'number' },
    ]
  },
  Triangular: {
    fields: [
      { name: 'base', label: 'Base', type: 'number' },
      { name: 'height', label: 'Height', type: 'number' },
      { name: 'length', label: 'Length / Thickness', type: 'number' },
    ]
  },
  Conical: {
    fields: [
      { name: 'diameter', label: 'Base Diameter', type: 'number' },
      { name: 'height', label: 'Height', type: 'number' },
    ]
  },
  Irregular: {
    fields: [
      { name: 'length', label: 'Length', type: 'number' },
      { name: 'width', label: 'Width', type: 'number' },
      { name: 'height', label: 'Height / Thickness', type: 'number' },
      { name: 'additionalDescription', label: 'Description', type: 'text' },
    ]
  },
  Other: {
    fields: [
      { name: 'custom1', label: 'Custom Dimension 1', type: 'number' },
      { name: 'customLabel1', label: 'Label for Dim 1', type: 'text' },
      { name: 'custom2', label: 'Custom Dimension 2', type: 'number' },
      { name: 'customLabel2', label: 'Label for Dim 2', type: 'text' },
      { name: 'custom3', label: 'Custom Dimension 3', type: 'number' },
      { name: 'customLabel3', label: 'Label for Dim 3', type: 'text' },
      { name: 'additionalDescription', label: 'Description', type: 'text' },
    ]
  }
};

const productFormSchema = z.object({
  name: z.string().min(1, 'Name of the Product is required.'),
  flavor: z.string().min(1, 'Flavor profile is required.'),
  weight: z.string().optional(),
  productShape: z.enum(['Square', 'Rectangular', 'Spherical', 'Half Spherical', 'Circular', 'Cylindrical', 'Oval', 'Heart', 'Triangular', 'Conical', 'Irregular', 'Other']).default('Rectangular'),
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
  price: z.coerce.number().positive('Retail Value must be a positive number.'),
  wholesalePrice: z.coerce.number().positive('Wholesale Value must be a positive number.'),
  availabilityStatus: z.enum(['In Stock', 'Out of Stock']),
  mainImage: z.string().min(1, 'Main Photo is required.'),
  subPhoto1: z.string().optional(),
  subPhoto2: z.string().optional(),
  subPhoto3: z.string().optional(),
  imageHint: z.string().default('artisan chocolate'),
});

type ProductFormValues = z.infer<typeof productFormSchema>;

export default function ProductsPage() {
  const firestore = useFirestore();
  const productsQuery = useMemo(() => firestore ? collection(firestore, 'products') : null, [firestore]);
  const { data: allProducts, loading: collectionLoading } = useCollection<Product>(productsQuery);
  
  const loading = collectionLoading || !firestore;

  const products = useMemo(() => {
    return allProducts?.filter(p => p.productionStatus === 'Product Ready') || [];
  }, [allProducts]);

  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const [viewingProduct, setViewingProduct] = useState<{images: string[], startIndex: number, productName: string, hint: string} | null>(null);

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: '',
      flavor: '',
      weight: '',
      productShape: 'Rectangular',
      productDimensions: { unit: 'mm' },
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
  const watchDimensions = useWatch({ control: form.control, name: 'productDimensions' });
  const { errors, isValid } = form.formState;

  useEffect(() => {
    if (editingProduct) {
      const urls = editingProduct.imageUrls || [];
      form.reset({
        name: editingProduct.name,
        flavor: editingProduct.flavor,
        weight: editingProduct.weight || '',
        productShape: editingProduct.productShape || 'Rectangular',
        productDimensions: editingProduct.productDimensions || { unit: 'mm' } as ProductDimensions,
        price: editingProduct.price,
        wholesalePrice: editingProduct.wholesalePrice,
        availabilityStatus: editingProduct.availabilityStatus,
        mainImage: editingProduct.mainImage || urls[0] || '',
        subPhoto1: editingProduct.subImages?.[0] || urls[1] || '',
        subPhoto2: editingProduct.subImages?.[1] || urls[2] || '',
        subPhoto3: editingProduct.subImages?.[2] || urls[3] || '',
        imageHint: editingProduct.imageHint || 'artisan chocolate',
      });
    } else if (isAddDialogOpen) {
      form.reset({
        name: '',
        flavor: '',
        weight: '',
        productShape: 'Rectangular',
        productDimensions: { unit: 'mm' } as ProductDimensions,
        price: 0,
        wholesalePrice: 0,
        availabilityStatus: 'In Stock',
        mainImage: '',
        subPhoto1: '',
        subPhoto2: '',
        subPhoto3: '',
        imageHint: 'artisan chocolate',
      });
    }
  }, [editingProduct, form, isAddDialogOpen]);

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

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast({
        variant: 'destructive',
        title: 'Invalid Format',
        description: 'Please upload JPG, PNG, or WEBP images.',
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const optimized = await optimizeImage(event.target?.result as string);
      form.setValue(fieldName, optimized, { shouldValidate: true });
    };
    reader.readAsDataURL(file);
  };

  const saveProduct = (values: ProductFormValues, id?: string) => {
    if (!firestore) return;

    const config = SHAPE_CONFIG[values.productShape];
    const missingFields = config.fields.filter(f => f.type === 'number' && !values.productDimensions[f.name as keyof ProductDimensions]);
    
    if (missingFields.length > 0) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: `Please complete all required product dimension fields for ${values.productShape}.`,
      });
      return;
    }
    
    setIsSaving(true);
    const productId = id || `P${Date.now()}`;
    const productRef = doc(firestore, 'products', productId);
    
    const subImages = [values.subPhoto1, values.subPhoto2, values.subPhoto3].filter(Boolean) as string[];
    const imageUrls = [values.mainImage, ...subImages].filter(Boolean);

    const productData = { 
      ...values, 
      id: productId,
      imageUrls,
      subImages,
      productionStatus: id ? (editingProduct?.productionStatus || 'Product Ready') : 'Product Ready'
    };

    setDoc(productRef, productData, { merge: true })
      .then(() => {
        setIsAddDialogOpen(false);
        setEditingProduct(null);
        setIsSaving(false);
        toast({ title: id ? 'Creation Refined' : 'Creation Added', description: `${values.name} has been synchronized.` });
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

  const PhotoUploadSlot = ({ fieldName, label, required = false }: { fieldName: keyof ProductFormValues, label: string, required?: boolean }) => {
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
        <div 
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "aspect-[4/3] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all duration-300 relative group overflow-hidden bg-muted/20",
            value ? "border-primary/40 bg-background" : "border-stone-200 hover:border-primary/30 hover:bg-muted/40"
          )}
        >
          {value ? (
            <>
              <Image src={value} alt={label} fill className="object-cover" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                 <RefreshCw className="text-white h-6 w-6 animate-in zoom-in-50" />
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-2 text-stone-400 group-hover:text-primary transition-colors">
               <Upload className="h-6 w-6" />
               <span className="text-[10px] font-bold uppercase tracking-tight">Select Photo</span>
            </div>
          )}
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={(e) => handleFileSelect(e, fieldName)} 
            className="hidden" 
            accept="image/jpeg,image/png,image/webp" 
          />
        </div>
      </div>
    );
  };

  const activeDialog = editingProduct ? 'edit' : (isAddDialogOpen ? 'add' : null);

  return (
    <TooltipProvider>
      <Dialog open={!!viewingProduct} onOpenChange={(open) => !open && setViewingProduct(null)}>
        <DialogContent className="sm:max-w-4xl p-0 border-0 bg-transparent shadow-none">
          <DialogHeader className="sr-only">
            <DialogTitle>{viewingProduct ? `${viewingProduct.productName} Image Gallery` : 'Image Gallery'}</DialogTitle>
          </DialogHeader>
          {viewingProduct && (
            <Carousel opts={{ startIndex: viewingProduct.startIndex, loop: true }} className="w-full">
              <CarouselContent>
                {viewingProduct.images.map((url, index) => (
                  <CarouselItem key={index}>
                    <div className="aspect-video relative">
                      <Image src={url} alt={`Product perspective ${index + 1}`} fill className="object-contain" data-ai-hint={viewingProduct.hint} />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="absolute left-4 top-1/2 -translate-y-1/2 text-accent bg-black/60 hover:bg-black/80 h-10 w-10 border-none rounded-full" />
              <CarouselNext className="absolute right-4 top-1/2 -translate-y-1/2 text-accent bg-black/60 hover:bg-black/80 h-10 w-10 border-none rounded-full" />
            </Carousel>
          )}
        </DialogContent>
      </Dialog>
      
      <Dialog open={!!activeDialog} onOpenChange={(open) => { if (!open) { setEditingProduct(null); setIsAddDialogOpen(false); } }}>
        <DialogContent className="sm:max-w-4xl rounded-[2rem] border-none shadow-2xl p-0 overflow-hidden flex flex-col h-[85vh] max-h-[90vh] bg-background">
          <div className="px-10 py-4 border-b shrink-0 bg-background/50 backdrop-blur-sm">
            <DialogHeader className="space-y-1 text-left">
              <DialogTitle className="text-2xl font-headline font-bold tracking-tight text-foreground">{activeDialog === 'edit' ? 'Refine Creation' : 'Register New Creation'}</DialogTitle>
              <DialogDescription className="text-[10px] uppercase tracking-[0.2em] font-black text-muted-foreground/60">Identity & Design Specification</DialogDescription>
            </DialogHeader>
          </div>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(activeDialog === 'edit' ? (v) => saveProduct(v, editingProduct!.id) : (v) => saveProduct(v))} className="flex flex-col flex-1 overflow-hidden">
              <div className="flex-1 overflow-y-auto px-10 custom-scrollbar bg-background/20">
                <div className="space-y-10 py-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <FormField control={form.control} name="name" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="uppercase text-[10px] font-black tracking-widest text-muted-foreground">Name of the Product</FormLabel>
                        <FormControl><Input placeholder="e.g., Velvet Noir 85%" className="h-12 rounded-xl border-stone-200" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="flavor" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="uppercase text-[10px] font-black tracking-widest text-muted-foreground">Flavor Profile</FormLabel>
                        <FormControl><Input placeholder="e.g., Single-Origin Dark Cocoa" className="h-12 rounded-xl border-stone-200" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <FormField control={form.control} name="weight" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="uppercase text-[10px] font-black tracking-widest text-muted-foreground">Product Weight</FormLabel>
                        <FormControl><Input placeholder="e.g., 100g" className="h-12 rounded-xl border-stone-200" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <FormField control={form.control} name="productShape" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="uppercase text-[10px] font-black tracking-widest text-muted-foreground">Product Shape</FormLabel>
                        <Select onValueChange={(val: any) => {
                           field.onChange(val);
                           const unit = form.getValues('productDimensions.unit');
                           form.setValue('productDimensions', { unit } as ProductDimensions);
                        }} defaultValue={field.value} value={field.value}>
                          <FormControl><SelectTrigger className="h-12 rounded-xl border-stone-200"><SelectValue placeholder="Select shape" /></SelectTrigger></FormControl>
                          <SelectContent>
                            {Object.keys(SHAPE_CONFIG).map(shape => (
                              <SelectItem key={shape} value={shape}>{shape}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>

                  <div className="bg-stone-50/30 dark:bg-stone-900/30 p-10 rounded-[2.5rem] border-2 border-dashed border-stone-200/50 space-y-8 shadow-inner">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 text-primary font-black uppercase text-[10px] tracking-[0.2em]">
                        <Ruler className="h-4 w-4" /> Dimension configuration
                      </div>
                      <FormField control={form.control} name="productDimensions.unit" render={({ field }) => (
                        <div className="flex items-center gap-2">
                           <Label className="text-[9px] font-bold text-muted-foreground uppercase tracking-tighter">Scale Unit</Label>
                           <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                             <SelectTrigger className="h-8 w-24 rounded-lg bg-background text-[10px] font-bold border-none shadow-sm">
                               <SelectValue />
                             </SelectTrigger>
                             <SelectContent>
                               <SelectItem value="mm" className="text-[10px] font-bold">mm</SelectItem>
                               <SelectItem value="cm" className="text-[10px] font-bold">cm</SelectItem>
                               <SelectItem value="inch" className="text-[10px] font-bold">inch</SelectItem>
                             </SelectContent>
                           </Select>
                        </div>
                      )} />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                      {SHAPE_CONFIG[watchShape]?.fields.map((f) => (
                        <FormField 
                          key={f.name} 
                          control={form.control} 
                          name={`productDimensions.${f.name}` as any} 
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="uppercase text-[9px] font-bold tracking-widest text-muted-foreground/70">{f.label} ({watchDimensions.unit})</FormLabel>
                              <FormControl>
                                <Input 
                                  type={f.type} 
                                  placeholder={f.placeholder || `0.00`} 
                                  className="h-10 rounded-xl bg-background border-stone-200 focus:ring-primary/20" 
                                  {...field} 
                                  value={field.value ?? ''}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )} 
                        />
                      ))}
                    </div>
                    
                    <ChocolateMeshViewer shape={watchShape} dimensions={watchDimensions} />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <FormField control={form.control} name="price" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="uppercase text-[10px] font-black tracking-widest text-muted-foreground">Retail Value (₹)</FormLabel>
                        <FormControl><Input type="number" className="h-12 rounded-xl border-stone-200" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="wholesalePrice" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="uppercase text-[10px] font-black tracking-widest text-muted-foreground">Wholesale Value (₹)</FormLabel>
                        <FormControl><Input type="number" className="h-12 rounded-xl border-stone-200" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>

                  <div className="space-y-6">
                    <h3 className="uppercase text-[10px] font-black tracking-widest text-muted-foreground border-b pb-2">Artisan Photography</h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                       <div className="md:col-span-1">
                          <PhotoUploadSlot fieldName="mainImage" label="Main Photo" required />
                       </div>
                       <div className="md:col-span-3 grid grid-cols-3 gap-6">
                          <PhotoUploadSlot fieldName="subPhoto1" label="Sub Photo 1" />
                          <PhotoUploadSlot fieldName="subPhoto2" label="Sub Photo 2" />
                          <PhotoUploadSlot fieldName="subPhoto3" label="Sub Photo 3" />
                       </div>
                    </div>
                    <p className="text-[9px] text-muted-foreground italic font-medium">Capture the perfection of your craftsmanship. Support for JPG, PNG, WEBP.</p>
                  </div>
                </div>
              </div>

              <div className="px-10 py-4 shrink-0 bg-background border-t">
                {!isValid && Object.keys(errors).length > 0 && (
                  <div className="mb-4 p-4 bg-destructive/5 border border-destructive/10 rounded-2xl flex items-center gap-4 text-destructive animate-in slide-in-from-bottom-2 duration-300">
                    <AlertCircle className="h-5 w-5 shrink-0" />
                    <div className="text-[10px] font-black uppercase tracking-widest leading-normal">
                      {errors.name && <span>Product name required. </span>}
                      {errors.flavor && <span>Flavor profile required. </span>}
                      {errors.price && <span>Retail value required. </span>}
                      {errors.mainImage && <span>Main photo required. </span>}
                    </div>
                  </div>
                )}
                
                <DialogFooter className="flex items-center justify-end gap-6 sm:justify-end">
                  <DialogClose asChild>
                    <Button type="button" variant="secondary" className="h-12 px-6 rounded-xl font-bold uppercase text-[10px] tracking-widest">Discard</Button>
                  </DialogClose>
                  <Button type="submit" disabled={isSaving} className="h-12 px-12 rounded-xl shadow-2xl shadow-primary/20 font-bold uppercase text-[10px] tracking-widest min-w-[200px]">
                    {isSaving ? <Loader2 className="mr-3 h-4 w-4 animate-spin" /> : null}
                    {activeDialog === 'edit' ? 'Save Refinement' : 'Register Creation'}
                  </Button>
                </DialogFooter>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      <PageHeader title="Artisan Portfolio" actions={<Button onClick={() => setIsAddDialogOpen(true)} className="rounded-xl h-11 px-6 shadow-lg shadow-primary/10"><PlusCircle className="mr-2 h-4 w-4" />New Creation</Button>} />
      
      {(!products || products.length === 0) && !loading ? (
        <div className="flex flex-col items-center justify-center h-80 border-2 border-dashed rounded-[2.5rem] bg-muted/50 border-border text-center px-4">
           <PackageSearch className="h-16 w-16 text-muted-foreground mb-6" />
           <p className="text-muted-foreground font-headline text-2xl italic">The collection is currently awaiting its first production batch.</p>
           <p className="text-xs uppercase tracking-widest text-muted-foreground mt-2">Only "Product Ready" items appear in this portfolio.</p>
           <Button variant="link" className="text-primary mt-4" onClick={() => setIsAddDialogOpen(true)}>Define a prototype manually</Button>
        </div>
      ) : (
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products?.map((product) => (
            <Card key={product.id} className="flex flex-col group overflow-hidden border-none shadow-sm hover:shadow-[0_20px_50px_-20px_rgba(0,0,0,0.1)] transition-all duration-700 rounded-[2rem] bg-card">
              <CardHeader className="p-0 relative">
                 <button type="button" className="block w-full aspect-[4/3] relative overflow-hidden" onClick={() => setViewingProduct({ images: product.imageUrls, startIndex: 0, productName: product.name, hint: product.imageHint })}>
                    <Image src={product.imageUrls?.[0] || 'https://picsum.photos/seed/default/400/300'} alt={product.name} fill className={`object-cover transition-transform duration-[2s] ease-in-out group-hover:scale-110 ${product.availabilityStatus === 'Out of Stock' ? 'grayscale opacity-60' : ''}`} data-ai-hint={product.imageHint} />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-700 flex items-center justify-center">
                        <ImageIcon className="text-white opacity-0 scale-50 group-hover:opacity-100 group-hover:scale-100 transition-all duration-500 h-10 w-10 drop-shadow-2xl" />
                    </div>
                  </button>
                  {product.sku && (
                    <div className="absolute top-4 left-4">
                        <Badge className="bg-stone-900/80 text-primary border-primary/20 backdrop-blur-md uppercase tracking-tighter text-[8px] px-2 py-0.5">
                            {product.sku}
                        </Badge>
                    </div>
                  )}
              </CardHeader>
              <CardContent className="p-6 flex-grow space-y-6">
                <div className="grid grid-cols-4 gap-2">
                  {product.imageUrls?.slice(1, 4).map((url, index) => (
                     <button key={index} type="button" className="block w-full aspect-square relative rounded-xl overflow-hidden border-2 border-border hover:border-primary/30 transition-all shadow-sm" onClick={() => setViewingProduct({ images: product.imageUrls, startIndex: index + 1, productName: product.name, hint: product.imageHint })}><Image src={url} alt="" fill className="object-cover" data-ai-hint={product.imageHint} /></button>
                  ))}
                </div>
                
                <div className="space-y-2 text-left">
                    <div>
                        <CardTitle className="font-headline text-2xl mb-1 group-hover:text-primary transition-colors leading-tight">{product.name}</CardTitle>
                        <p className="text-[9px] text-muted-foreground uppercase tracking-[0.3em] font-black leading-none">{product.flavor}</p>
                    </div>
                    {product.productShape && (
                        <div className="flex items-center gap-1 text-[8px] font-bold uppercase tracking-widest text-muted-foreground/60">
                           <Box className="h-2.5 w-2.5" /> Shape: {product.productShape}
                        </div>
                    )}
                </div>

                <div className="flex justify-between items-end pt-2 border-t border-border/50 text-left">
                  <div className="space-y-0.5">
                    <p className="text-2xl font-bold text-foreground tracking-tighter">₹{product.price.toLocaleString()}</p>
                    <p className="text-[9px] text-muted-foreground uppercase tracking-widest font-bold">W: ₹{product.wholesalePrice.toLocaleString()}</p>
                  </div>
                  
                  <div className="flex flex-col items-end gap-2">
                     <Badge variant={product.availabilityStatus === 'In Stock' ? 'default' : 'destructive'} className={cn(product.availabilityStatus === 'In Stock' ? 'bg-green-700 hover:bg-green-800' : '', "rounded-full uppercase tracking-widest text-[8px] py-1 px-3 shadow-lg")}>
                        {product.availabilityStatus}
                     </Badge>
                     {product.originalOrderId && (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div className="text-[8px] font-black text-primary/40 uppercase tracking-widest cursor-help flex items-center gap-1">
                                   <Info className="h-2 w-2" /> Traceable
                                </div>
                            </TooltipTrigger>
                            <TooltipContent className="bg-stone-900 border-none p-4 rounded-2xl shadow-2xl">
                                <div className="space-y-2 text-[10px]">
                                    <p className="text-primary font-bold uppercase">Manufacturing Audit</p>
                                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-left">
                                        <span className="text-stone-500">Order Ref:</span> <span className="text-stone-300">{product.originalOrderId}</span>
                                        <span className="text-stone-500">Production:</span> <span className="text-stone-300">{product.productionDate}</span>
                                        <span className="text-stone-500">Batch Qty:</span> <span className="text-stone-300">{product.quantityProduced}</span>
                                    </div>
                                </div>
                            </TooltipContent>
                        </Tooltip>
                     )}
                  </div>
                </div>
              </CardContent>
              <CardFooter className="p-6 pt-0"><Button variant="outline" className="w-full rounded-2xl h-12 hover:bg-muted text-foreground font-bold uppercase text-[10px] tracking-widest" onClick={() => setEditingProduct(product)}><Edit className="h-3.5 w-3.5 mr-2" /> Modify Portfolio</Button></CardFooter>
            </Card>
          ))}
        </div>
      )}
    </TooltipProvider>
  );
}
