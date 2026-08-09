
'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import type { Product, ProductDimensions } from '@/lib/types';
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
  CheckCircle2
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
import { collection, doc, setDoc } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ChocolateMeshViewer } from '@/components/chocolate-mesh-viewer';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
        .filter(([_, v]) => v !== undefined && !Number.isNaN(v))
        .map(([k, v]) => [k, sanitizeData(v)])
    );
  }
  return obj;
};

export default function ProductsPage() {
  const firestore = useFirestore();
  const productsQuery = useMemo(() => firestore ? collection(firestore, 'products') : null, [firestore]);
  const { data: allProducts, loading } = useCollection<Product>(productsQuery);
  
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  
  const [viewingProduct, setViewingProduct] = useState<{images: string[], startIndex: number, productName: string, hint: string} | null>(null);
  const [identityMode, setIdentityMode] = useState<'existing' | 'new'>('existing');

  const uniqueProductNames = useMemo(() => {
    if (!allProducts) return [];
    return Array.from(new Set(allProducts.map(p => p.name))).sort();
  }, [allProducts]);

  const products = useMemo(() => {
    return allProducts?.filter(p => p.productionStatus === 'Product Ready') || [];
  }, [allProducts]);

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
      setIdentityMode('new');
    }
  }, [editingProduct, form, isAddDialogOpen]);

  const handleReEnroll = (product: Product) => {
    // Re-enroll is "edit but as a new document"
    setEditingProduct(null);
    setIsAddDialogOpen(true);
    
    // Manual pre-fill of form
    setTimeout(() => {
      const urls = product.imageUrls || [];
      form.reset({
        name: product.name,
        flavor: product.flavor,
        weight: product.weight || '',
        productShape: product.productShape || 'Rectangular',
        productDimensions: product.productDimensions || { unit: 'mm' } as ProductDimensions,
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

    const productData = sanitizeData({ 
      ...values, 
      id: productId,
      imageUrls,
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

  const onInvalid = (errs: any) => {
    console.error('Registration Validation Errors:', errs);
    toast({ variant: 'destructive', title: 'Specification Error', description: 'Review required fields and ensure the Main Photo is provided.' });
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
                 <RefreshCw className="text-white h-6 w-6" />
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-2 text-stone-400 group-hover:text-primary transition-colors">
               <Upload className="h-6 w-6" />
               <span className="text-[9px] font-bold uppercase tracking-tight">Select Photo</span>
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

  return (
    <TooltipProvider>
      <Dialog open={!!viewingProduct} onOpenChange={(open) => !open && setViewingProduct(null)}>
        <DialogContent className="sm:max-w-4xl p-0 border-0 bg-transparent shadow-none">
          <DialogHeader className="sr-only">
            <DialogTitle>{viewingProduct?.productName || 'Gallery'}</DialogTitle>
          </DialogHeader>
          {viewingProduct && (
            <Carousel opts={{ startIndex: viewingProduct.startIndex, loop: true }} className="w-full">
              <CarouselContent>
                {viewingProduct.images.map((url, index) => (
                  <CarouselItem key={index}>
                    <div className="aspect-video relative">
                      <Image src={url} alt={`Preview ${index + 1}`} fill className="object-contain" data-ai-hint={viewingProduct.hint} />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="absolute left-4 top-1/2 -translate-y-1/2 text-white bg-black/60 hover:bg-black/80 h-10 w-10 border-none rounded-full" />
              <CarouselNext className="absolute right-4 top-1/2 -translate-y-1/2 text-white bg-black/60 hover:bg-black/80 h-10 w-10 border-none rounded-full" />
            </Carousel>
          )}
        </DialogContent>
      </Dialog>
      
      <Dialog open={isAddDialogOpen || !!editingProduct} onOpenChange={(open) => { if (!open) { setEditingProduct(null); setIsAddDialogOpen(false); } }}>
        <DialogContent className="sm:max-w-4xl rounded-[2rem] border-none shadow-2xl p-0 overflow-hidden flex flex-col h-[85vh] bg-background">
          <div className="px-10 py-4 border-b shrink-0 bg-background">
            <DialogHeader className="space-y-1 text-left">
              <DialogTitle className="text-2xl font-headline text-foreground">{editingProduct ? 'Refine Creation' : 'Register New Creation'}</DialogTitle>
              <DialogDescription className="text-[10px] uppercase tracking-[0.2em] font-black text-muted-foreground/60">Artisanal Specification Entry</DialogDescription>
            </DialogHeader>
          </div>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit((v) => saveProduct(v, editingProduct?.id), onInvalid)} className="flex flex-col flex-1 overflow-hidden">
              <div className="flex-1 overflow-y-auto px-10 custom-scrollbar">
                <div className="space-y-10 py-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <FormField control={form.control} name="name" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="uppercase text-[10px] font-black tracking-widest text-muted-foreground">Product Identity</FormLabel>
                        <Tabs value={identityMode} onValueChange={(v: any) => setIdentityMode(v)} className="w-full">
                           <TabsList className="grid w-full grid-cols-2 bg-muted/30 h-9 rounded-xl p-1 mb-2">
                             <TabsTrigger value="existing" className="rounded-lg text-[9px] uppercase font-bold">Select Existing</TabsTrigger>
                             <TabsTrigger value="new" className="rounded-lg text-[9px] uppercase font-bold">Manual Entry</TabsTrigger>
                           </TabsList>
                           <TabsContent value="existing" className="mt-0">
                             <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                                <FormControl>
                                  <SelectTrigger className="h-12 rounded-xl">
                                    <SelectValue placeholder="Search identities..." />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {uniqueProductNames.map(name => (
                                    <SelectItem key={name} value={name}>{name}</SelectItem>
                                  ))}
                                </SelectContent>
                             </Select>
                           </TabsContent>
                           <TabsContent value="new" className="mt-0">
                             <FormControl>
                                <Input placeholder="Type new identity name..." className="h-12 rounded-xl" {...field} />
                             </FormControl>
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
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <FormField control={form.control} name="weight" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="uppercase text-[10px] font-black tracking-widest text-muted-foreground">Net Weight</FormLabel>
                        <FormControl><Input placeholder="e.g., 120g" className="h-12 rounded-xl" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <FormField control={form.control} name="productShape" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="uppercase text-[10px] font-black tracking-widest text-muted-foreground">Artisan Shape</FormLabel>
                        <Select onValueChange={(val: any) => field.onChange(val)} defaultValue={field.value} value={field.value}>
                          <FormControl><SelectTrigger className="h-12 rounded-xl"><SelectValue /></SelectTrigger></FormControl>
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

                  <div className="bg-muted/20 p-10 rounded-[2.5rem] border-2 border-dashed space-y-8">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 text-primary font-black uppercase text-[10px] tracking-[0.2em]">
                        <Ruler className="h-4 w-4" /> Dimension Logic
                      </div>
                      <FormField control={form.control} name="productDimensions.unit" render={({ field }) => (
                        <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                          <SelectTrigger className="h-8 w-24 rounded-lg bg-background text-[10px] font-bold">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="mm">mm</SelectItem>
                            <SelectItem value="cm">cm</SelectItem>
                            <SelectItem value="inch">inch</SelectItem>
                          </SelectContent>
                        </Select>
                      )} />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                      {(SHAPE_CONFIG[watchShape] || SHAPE_CONFIG['Rectangular']).fields.map((f) => (
                        <FormField 
                          key={f.name} 
                          control={form.control} 
                          name={`productDimensions.${f.name}` as any} 
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="uppercase text-[9px] font-bold tracking-widest text-muted-foreground">{f.label}</FormLabel>
                              <FormControl>
                                <Input 
                                  type={f.type} 
                                  className="h-10 rounded-xl" 
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
                    
                    <ChocolateMeshViewer shape={watchShape} dimensions={watchDimensions as any} />
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
                       <div className="md:col-span-1">
                          <PhotoSlot fieldName="mainImage" label="Main Portrait" required />
                       </div>
                       <div className="md:col-span-3 grid grid-cols-3 gap-6">
                          <PhotoSlot fieldName="subPhoto1" label="Perspective A" />
                          <PhotoSlot fieldName="subPhoto2" label="Perspective B" />
                          <PhotoSlot fieldName="subPhoto3" label="Perspective C" />
                       </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-10 py-4 shrink-0 border-t flex flex-col items-end">
                {!isValid && Object.keys(errors).length > 0 && (
                  <div className="mb-4 p-4 bg-destructive/10 rounded-xl flex items-center gap-4 text-destructive w-full">
                    <AlertCircle className="h-5 w-5" />
                    <div className="text-[10px] font-black uppercase tracking-widest">Incomplete Specification Detected. Check dimensions and photography.</div>
                  </div>
                )}
                
                <DialogFooter className="w-full flex items-center justify-end gap-6">
                  <DialogClose asChild>
                    <Button type="button" variant="secondary" className="h-12 px-8 rounded-xl font-bold uppercase text-[10px] tracking-widest">Discard</Button>
                  </DialogClose>
                  <Button type="submit" disabled={isSaving} className="h-12 px-12 rounded-xl shadow-2xl shadow-primary/20 font-bold uppercase text-[10px] tracking-widest min-w-[220px]">
                    {isSaving ? (
                      <>
                        <Loader2 className="mr-3 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      editingProduct ? 'Save Refinement' : 'Register Creation'
                    )}
                  </Button>
                </DialogFooter>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      <PageHeader title="Artisan Portfolio" actions={<Button onClick={() => setIsAddDialogOpen(true)} className="rounded-xl h-11 px-6"><PlusCircle className="mr-2 h-4 w-4" />New Creation</Button>} />
      
      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin h-10 w-10 text-primary" /></div>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-80 border-2 border-dashed rounded-[2.5rem] bg-muted/50 text-center px-4">
           <PackageSearch className="h-16 w-16 text-muted-foreground mb-6" />
           <p className="text-muted-foreground font-headline text-2xl italic">The collection is currently awaiting its first production batch.</p>
           <Button variant="link" className="text-primary mt-4" onClick={() => setIsAddDialogOpen(true)}>Define prototype</Button>
        </div>
      ) : (
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => (
            <Card key={product.id} className="flex flex-col group overflow-hidden border-none shadow-sm hover:shadow-2xl transition-all duration-500 rounded-[2rem] bg-card">
              <CardHeader className="p-0 relative">
                 <button type="button" className="block w-full aspect-[4/3] relative overflow-hidden" onClick={() => setViewingProduct({ images: product.imageUrls, startIndex: 0, productName: product.name, hint: product.imageHint })}>
                    <Image src={product.imageUrls?.[0] || 'https://picsum.photos/seed/default/400/300'} alt={product.name} fill className={`object-cover transition-transform duration-700 ${product.availabilityStatus === 'Out of Stock' ? 'grayscale' : 'group-hover:scale-110'}`} data-ai-hint={product.imageHint} />
                  </button>
                  <div className="absolute top-4 left-4 flex gap-2">
                    {product.sku && <Badge variant="secondary" className="uppercase tracking-tighter text-[8px]">{product.sku}</Badge>}
                    <Badge variant="outline" className="bg-white/90 backdrop-blur-sm border-none shadow-sm uppercase tracking-widest text-[8px] font-black">{product.productShape}</Badge>
                  </div>
              </CardHeader>
              <CardContent className="p-6 flex-grow space-y-6">
                <div className="space-y-1">
                   <CardTitle className="font-headline text-2xl group-hover:text-primary transition-colors">{product.name}</CardTitle>
                   <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black">{product.flavor}</p>
                </div>

                <div className="flex justify-between items-end pt-4 border-t">
                  <div className="space-y-0.5">
                    <p className="text-2xl font-bold">₹{product.price.toLocaleString()}</p>
                    <p className="text-[9px] text-muted-foreground uppercase tracking-widest">W: ₹{product.wholesalePrice.toLocaleString()}</p>
                  </div>
                  <Badge variant={product.availabilityStatus === 'In Stock' ? 'default' : 'destructive'} className="rounded-full uppercase tracking-widest text-[8px] py-1.5 px-4">
                    {product.availabilityStatus}
                  </Badge>
                </div>
              </CardContent>
              <CardFooter className="p-6 pt-0 grid grid-cols-2 gap-3">
                <Button variant="outline" className="rounded-2xl h-11 font-bold uppercase text-[9px] tracking-widest" onClick={() => setEditingProduct(product)}>
                   <Edit className="h-3 w-3 mr-1.5" /> Refine
                </Button>
                <Button variant="secondary" className="rounded-2xl h-11 font-bold uppercase text-[9px] tracking-widest" onClick={() => handleReEnroll(product)}>
                   <CopyCheck className="h-3 w-3 mr-1.5" /> Re-Enroll
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </TooltipProvider>
  );
}
