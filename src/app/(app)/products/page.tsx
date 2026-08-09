'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import type { Product, ProductDimensions } from '@/lib/types';
import { Camera, PlusCircle, Loader2, Link as LinkIcon, Upload, Image as ImageIcon, PackageSearch, Trash2, Edit, History, Info, Box, Ruler, AlertCircle } from 'lucide-react';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { useCollection, useFirestore } from '@/firebase';
import { collection, doc, setDoc } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { Skeleton } from '@/components/ui/skeleton';
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
      { name: 'radius', label: 'Radius (Optional)', type: 'number' },
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
  productShape: z.enum(['Square', 'Rectangular', 'Spherical', 'Half Spherical', 'Circular', 'Cylindrical', 'Oval', 'Triangular', 'Conical', 'Irregular', 'Other']).default('Rectangular'),
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
  imageUrls: z.array(z.string()).min(1, "At least one picture is required.").max(4, "Maximum 4 visuals allowed."),
  imageHint: z.string().min(1, 'Image hint is required.'),
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
  
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [viewingProduct, setViewingProduct] = useState<{images: string[], startIndex: number, productName: string, hint: string} | null>(null);

  const [remoteUrl, setRemoteUrl] = useState('');

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: '',
      flavor: '',
      weight: '',
      productShape: 'Rectangular',
      productDimensions: {
        unit: 'mm',
      },
      price: 0,
      wholesalePrice: 0,
      availabilityStatus: 'In Stock',
      imageUrls: [],
      imageHint: '',
    }
  });

  const watchShape = useWatch({ control: form.control, name: 'productShape' });
  const watchDimensions = useWatch({ control: form.control, name: 'productDimensions' });
  const { errors, isValid } = form.formState;

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
      setHasCameraPermission(null);
    }
  };

  useEffect(() => {
    if (editingProduct) {
      form.reset({
        name: editingProduct.name,
        flavor: editingProduct.flavor,
        weight: editingProduct.weight || '',
        productShape: editingProduct.productShape || 'Rectangular',
        productDimensions: editingProduct.productDimensions || { unit: 'mm' } as ProductDimensions,
        price: editingProduct.price,
        wholesalePrice: editingProduct.wholesalePrice,
        availabilityStatus: editingProduct.availabilityStatus,
        imageUrls: editingProduct.imageUrls || [],
        imageHint: editingProduct.imageHint || 'product photo',
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
        imageUrls: [],
        imageHint: '',
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
    
    const productData = { 
      ...values, 
      id: productId,
      productionStatus: id ? (editingProduct?.productionStatus || 'Product Ready') : 'Product Ready'
    };

    setDoc(productRef, productData, { merge: true })
      .then(() => {
        setIsAddDialogOpen(false);
        setEditingProduct(null);
        setIsSaving(false);
        toast({ 
          title: id ? 'Creation Refined' : 'Creation Added', 
          description: `${values.name} has been synchronized with the collection.` 
        });
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

  const onAddSubmit = (values: ProductFormValues) => {
    saveProduct(values);
  };

  const onEditSubmit = (values: ProductFormValues) => {
    if (!editingProduct) return;
    saveProduct(values, editingProduct.id);
  };
  
  const enableCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setHasCameraPermission(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      setHasCameraPermission(false);
      toast({
        variant: 'destructive',
        title: 'Camera Access Denied',
        description: 'Please enable camera permissions to capture artisanal photography.',
      });
    }
  };
  
  const capturePhoto = async () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const MAX_WIDTH = 800;
      const scale = MAX_WIDTH / video.videoWidth;
      canvas.width = MAX_WIDTH;
      canvas.height = video.videoHeight * scale;
      
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        const optimizedUrl = await optimizeImage(dataUrl);
        form.setValue('imageUrls', [optimizedUrl], { shouldValidate: true });
        form.setValue('imageHint', 'custom photo', { shouldValidate: true });
        stopCamera();
        toast({ title: "Artisan Shot Captured", description: "Photo successfully optimized and added." });
      }
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    let fileArray = Array.from(files).slice(0, 4);
    const fileToUrlPromises = fileArray.map(file => {
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async e => {
          const optimized = await optimizeImage(e.target!.result as string);
          resolve(optimized);
        };
        reader.onerror = e => reject(e);
        reader.readAsDataURL(file);
      });
    });

    Promise.all(fileToUrlPromises).then(urls => {
        form.setValue('imageUrls', urls, { shouldValidate: true });
        form.setValue('imageHint', 'uploaded image', { shouldValidate: true });
        toast({ title: "Visuals Uploaded", description: `${urls.length} optimized images added.` });
    });
  };

  const handleAddRemoteUrl = () => {
    if (!remoteUrl) return;
    const currentUrls = form.getValues('imageUrls') || [];
    if (currentUrls.length >= 4) {
      toast({ variant: 'destructive', title: 'Limit Reached', description: 'Maximum of 4 visuals allowed per creation.' });
      return;
    }
    form.setValue('imageUrls', [...currentUrls, remoteUrl], { shouldValidate: true });
    form.setValue('imageHint', 'remote image', { shouldValidate: true });
    setRemoteUrl('');
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
              <CarouselPrevious className="absolute left-4 top-1/2 -translate-y-1/2 text-accent bg-black/60 hover:bg-black/80 h-10 w-10 border-none" />
              <CarouselNext className="absolute right-4 top-1/2 -translate-y-1/2 text-accent bg-black/60 hover:bg-black/80 h-10 w-10 border-none" />
            </Carousel>
          )}
        </DialogContent>
      </Dialog>
      
      <Dialog open={!!activeDialog} onOpenChange={(open) => {
        if (!open) {
          setEditingProduct(null);
          setIsAddDialogOpen(false);
          stopCamera();
        }
      }}>
        <DialogContent className="sm:max-w-4xl rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden flex flex-col max-h-[90vh]">
          <div className="p-8 bg-muted/30 border-b shrink-0">
            <DialogHeader>
              <DialogTitle className="text-3xl font-headline">{activeDialog === 'edit' ? 'Refine Creation' : 'Register New Creation'}</DialogTitle>
              <DialogDescription className="text-muted-foreground">Define the identity and physical profile of your artisan masterpiece.</DialogDescription>
            </DialogHeader>
          </div>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(activeDialog === 'edit' ? onEditSubmit : onAddSubmit)} className="flex flex-col flex-1 overflow-hidden">
              <ScrollArea className="flex-1 px-8">
                <div className="space-y-8 py-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <FormField control={form.control} name="name" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="uppercase text-[10px] font-black tracking-widest text-muted-foreground">Name of the Product</FormLabel>
                        <FormControl><Input placeholder="e.g., Velvet Noir 85%" className="h-12 rounded-xl" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="flavor" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="uppercase text-[10px] font-black tracking-widest text-muted-foreground">Flavor Profile</FormLabel>
                        <FormControl><Input placeholder="e.g., Single-Origin Dark Cocoa" className="h-12 rounded-xl" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <FormField control={form.control} name="weight" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="uppercase text-[10px] font-black tracking-widest text-muted-foreground">Product Weight</FormLabel>
                        <FormControl><Input placeholder="e.g., 100g" className="h-12 rounded-xl" {...field} /></FormControl>
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
                          <FormControl><SelectTrigger className="h-12 rounded-xl"><SelectValue placeholder="Select shape" /></SelectTrigger></FormControl>
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

                  <div className="bg-stone-50 p-8 rounded-[2rem] border-2 border-dashed border-stone-200 space-y-6 shadow-inner">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2 text-primary font-black uppercase text-[10px] tracking-[0.2em]">
                        <Ruler className="h-4 w-4" /> Dimension configuration
                      </div>
                      <FormField control={form.control} name="productDimensions.unit" render={({ field }) => (
                        <div className="flex items-center gap-2">
                           <Label className="text-[9px] font-bold text-stone-400 uppercase tracking-tighter">Scale Unit</Label>
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
                        <FormField key={f.name} control={form.control} name={`productDimensions.${f.name}` as any} render={({ field }) => (
                          <FormItem>
                            <FormLabel className="uppercase text-[9px] font-bold tracking-widest text-stone-500">{f.label} ({watchDimensions.unit})</FormLabel>
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
                        )} />
                      ))}
                    </div>

                    <div className="mt-6 pt-6 border-t border-stone-200 space-y-3">
                       <h4 className="text-[9px] font-black uppercase tracking-[0.3em] text-stone-400">Design Specification Summary</h4>
                       <div className="p-4 bg-background rounded-xl border border-stone-100 flex flex-wrap gap-x-8 gap-y-2 shadow-sm">
                          <div className="space-y-0.5">
                             <p className="text-[8px] font-bold uppercase text-muted-foreground">Type</p>
                             <p className="text-xs font-bold text-stone-900">{watchShape}</p>
                          </div>
                          {SHAPE_CONFIG[watchShape]?.fields.filter(f => f.type === 'number').map(f => (
                             <div key={f.name} className="space-y-0.5">
                                <p className="text-[8px] font-bold uppercase text-muted-foreground">{f.label}</p>
                                <p className="text-xs font-bold text-stone-900">{watchDimensions[f.name as keyof ProductDimensions] || '--'} {watchDimensions.unit}</p>
                             </div>
                          ))}
                       </div>
                    </div>
                    
                    <ChocolateMeshViewer shape={watchShape} dimensions={watchDimensions} />
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
                  
                  <FormField control={form.control} name="availabilityStatus" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="uppercase text-[10px] font-black tracking-widest text-muted-foreground">Availability Status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                        <FormControl><SelectTrigger className="h-12 rounded-xl"><SelectValue placeholder="Select status" /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="In Stock">Available for Reserve</SelectItem>
                          <SelectItem value="Out of Stock">Currently Maturing</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  
                  <div className="space-y-4">
                    <FormLabel className="uppercase text-[10px] font-black tracking-widest text-muted-foreground">Artisan Photography</FormLabel>
                    <Tabs defaultValue="gallery" className="w-full" onValueChange={(tab) => { if (tab !== 'camera') stopCamera(); }}>
                      <TabsList className="grid w-full grid-cols-4 bg-muted rounded-xl p-1 h-12">
                        <TabsTrigger value="gallery" className="rounded-lg"><ImageIcon className="h-4 w-4 mr-2" /> Gallery</TabsTrigger>
                        <TabsTrigger value="camera" className="rounded-lg"><Camera className="h-4 w-4 mr-2" /> Live</TabsTrigger>
                        <TabsTrigger value="url" className="rounded-lg"><LinkIcon className="h-4 w-4 mr-2" /> URL</TabsTrigger>
                        <TabsTrigger value="upload" className="rounded-lg"><Upload className="h-4 w-4 mr-2" /> File</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="gallery" className="pt-4">
                        <RadioGroup onValueChange={(value) => {
                          const selectedImage = PlaceHolderImages.find(img => img.imageUrl === value);
                          if (selectedImage) {
                            form.setValue('imageUrls', [selectedImage.imageUrl], { shouldValidate: true });
                            form.setValue('imageHint', selectedImage.imageHint, { shouldValidate: true });
                          }
                        }} value={form.watch('imageUrls')?.[0]} className="grid grid-cols-3 gap-4">
                          {PlaceHolderImages.map((image) => (
                            <div key={image.id} className="relative">
                              <RadioGroupItem value={image.imageUrl} id={image.id} className="peer sr-only" />
                              <Label htmlFor={image.id} className="block cursor-pointer rounded-2xl border-2 border-muted bg-popover hover:border-accent peer-data-[state=checked]:border-primary transition-all overflow-hidden aspect-[4/3] relative">
                                <Image src={image.imageUrl} alt={image.description} fill className="object-cover" data-ai-hint={image.imageHint} />
                              </Label>
                            </div>
                          ))}
                        </RadioGroup>
                      </TabsContent>
                      
                      <TabsContent value="camera" className="pt-4 space-y-4">
                        <div className="w-full aspect-[4/3] bg-black rounded-2xl flex items-center justify-center overflow-hidden border-2 border-dashed border-border">
                          <video ref={videoRef} className={cn("w-full h-full object-cover", hasCameraPermission === true ? 'block' : 'hidden')} autoPlay muted playsInline />
                          {hasCameraPermission !== true && <Camera className="h-16 w-16 text-muted-foreground opacity-20" />}
                        </div>
                        <div className="flex justify-center gap-2">
                          {hasCameraPermission !== true ? (
                            <Button type="button" onClick={enableCamera} variant="outline" className="rounded-xl">Initialize Camera</Button>
                          ) : (
                            <Button type="button" onClick={capturePhoto} className="rounded-xl px-10">Capture Creation</Button>
                          )}
                        </div>
                      </TabsContent>

                      <TabsContent value="url" className="pt-4 space-y-4">
                        <div className="flex gap-2">
                          <Input placeholder="Enter high-end photography URL..." value={remoteUrl} onChange={(e) => setRemoteUrl(e.target.value)} className="h-12 rounded-xl" />
                          <Button type="button" onClick={handleAddRemoteUrl} className="h-12 rounded-xl px-6">Apply</Button>
                        </div>
                      </TabsContent>

                      <TabsContent value="upload" className="pt-4 space-y-4">
                        <div className="grid w-full items-center gap-1.5">
                          <Input id="picture" type="file" multiple accept="image/*" onChange={handleFileChange} className="cursor-pointer py-3 h-auto rounded-xl" />
                        </div>
                      </TabsContent>
                    </Tabs>
                    
                    {form.watch('imageUrls')?.length > 0 && (
                      <div className="mt-6 space-y-3">
                        <Label className="text-[9px] text-muted-foreground uppercase tracking-[0.3em] font-black">Selection Portfolio ({form.watch('imageUrls').length}/4)</Label>
                        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin">
                          {form.watch('imageUrls').map((url, i) => (
                            <div key={i} className="relative h-20 w-24 shrink-0 rounded-2xl overflow-hidden border-2 border-border shadow-md group">
                              <Image src={url} alt="" fill className="object-cover" />
                              <button type="button" className="absolute top-1 right-1 bg-black/40 hover:bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-all" onClick={() => {
                                const newUrls = [...form.getValues('imageUrls')];
                                newUrls.splice(i, 1);
                                form.setValue('imageUrls', newUrls, { shouldValidate: true });
                              }}><Trash2 className="h-3 w-3" /></button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    <FormField control={form.control} name="imageUrls" render={() => <FormMessage />} />
                  </div>
                  <canvas ref={canvasRef} className="hidden" />
                </div>
              </ScrollArea>

              <div className="p-8 border-t shrink-0 bg-stone-50/50">
                {!isValid && Object.keys(errors).length > 0 && (
                  <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-2xl flex items-center gap-3 text-destructive animate-in slide-in-from-bottom-2 duration-300">
                    <AlertCircle className="h-5 w-5" />
                    <div className="text-[10px] font-black uppercase tracking-widest leading-none">
                      {errors.name && <span>Please enter a product name. </span>}
                      {errors.flavor && <span>Please enter the flavor profile. </span>}
                      {errors.price && <span>Retail value is required. </span>}
                      {errors.imageUrls && <span>You have not yet selected an image. </span>}
                    </div>
                  </div>
                )}
                
                <DialogFooter className="gap-4">
                  <DialogClose asChild><Button type="button" variant="ghost" className="rounded-xl h-14 px-8 font-bold uppercase text-[10px] tracking-widest">Discard</Button></DialogClose>
                  <Button type="submit" disabled={isSaving} className="rounded-xl h-14 px-12 shadow-xl shadow-primary/20 font-bold uppercase text-[10px] tracking-widest">
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    {activeDialog === 'edit' ? 'Commit Refinement' : 'Create Register'}
                  </Button>
                </DialogFooter>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      <PageHeader title="Artisan Portfolio" actions={<Button onClick={() => setIsAddDialogOpen(true)} className="rounded-xl h-11 px-6 shadow-lg shadow-primary/10"><PlusCircle className="mr-2 h-4 w-4" />New Creation</Button>} />
      
      {(!products || products.length === 0) && !loading ? (
        <div className="flex flex-col items-center justify-center h-80 border-2 border-dashed rounded-[2.5rem] bg-muted/50 border-border">
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
                    <Image src={product.imageUrls?.[0] || 'https://picsum.photos/seed/default/400/300'} alt={product.name} fill className="object-cover transition-transform duration-[2s] ease-in-out group-hover:scale-110" data-ai-hint={product.imageHint} />
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
                  {product.imageUrls?.length > 4 && (
                    <div className="bg-muted rounded-xl flex items-center justify-center text-[10px] font-black text-muted-foreground">+{product.imageUrls.length - 4}</div>
                  )}
                </div>
                
                <div className="space-y-2">
                    <div>
                        <CardTitle className="font-headline text-2xl mb-1 group-hover:text-primary transition-colors leading-tight">{product.name}</CardTitle>
                        <p className="text-[9px] text-muted-foreground uppercase tracking-[0.3em] font-black leading-none">{product.flavor}</p>
                    </div>
                    {product.productShape && (
                        <div className="flex items-center gap-1 text-[8px] font-bold uppercase tracking-widest text-muted-foreground/60">
                           <Box className="h-2.5 w-2.5" /> Shape: {product.productShape}
                        </div>
                    )}
                    {product.recipeUsed && (
                        <div className="flex items-center gap-1 text-[8px] font-bold uppercase tracking-widest text-muted-foreground/60">
                           <History className="h-2.5 w-2.5" /> Made with: {product.recipeUsed}
                        </div>
                    )}
                </div>

                <div className="flex justify-between items-end pt-2 border-t border-border/50">
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
                                    <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                                        <span className="text-stone-500">Order Ref:</span> <span className="text-stone-300">{product.originalOrderId}</span>
                                        <span className="text-stone-500">Production:</span> <span className="text-stone-300">{product.productionDate}</span>
                                        <span className="text-stone-500">Packaging:</span> <span className="text-stone-300">{product.packagingDate}</span>
                                        <span className="text-stone-500">Batch Qty:</span> <span className="text-stone-300">{product.quantityProduced} {product.unitOfMeasurement}</span>
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