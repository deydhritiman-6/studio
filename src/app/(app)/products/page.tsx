'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import type { Product } from '@/lib/types';
import { Camera, PlusCircle, Loader2, Link as LinkIcon, Upload, Image as ImageIcon, PackageSearch, Trash2, Edit } from 'lucide-react';
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

const productFormSchema = z.object({
  name: z.string().min(1, 'Product name is required.'),
  flavor: z.string().min(1, 'Flavor profile is required.'),
  price: z.coerce.number().positive('Price must be a positive number.'),
  wholesalePrice: z.coerce.number().positive('Wholesale price must be a positive number.'),
  availabilityStatus: z.enum(['In Stock', 'Out of Stock']),
  imageUrls: z.array(z.string()).min(1, "Please select at least one image.").max(4, "You can upload a maximum of 4 images."),
  imageHint: z.string().min(1, 'Image hint is required.'),
});

type ProductFormValues = z.infer<typeof productFormSchema>;

export default function ProductsPage() {
  const firestore = useFirestore();
  const productsQuery = useMemo(() => firestore ? collection(firestore, 'products') : null, [firestore]);
  const { data: products, loading } = useCollection<Product>(productsQuery);
  
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [viewingProduct, setViewingProduct] = useState<{images: string[], startIndex: number, productName: string} | null>(null);

  const [remoteUrl, setRemoteUrl] = useState('');

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: '',
      flavor: '',
      price: '' as unknown as number,
      wholesalePrice: '' as unknown as number,
      availabilityStatus: 'In Stock',
      imageUrls: [],
      imageHint: '',
    }
  });

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
        price: editingProduct.price,
        wholesalePrice: editingProduct.wholesalePrice,
        availabilityStatus: editingProduct.availabilityStatus,
        imageUrls: editingProduct.imageUrls,
        imageHint: editingProduct.imageHint,
      });
    } else {
      form.reset({
        name: '',
        flavor: '',
        price: '' as unknown as number,
        wholesalePrice: '' as unknown as number,
        availabilityStatus: 'In Stock',
        imageUrls: [],
        imageHint: '',
      });
    }
  }, [editingProduct, form, isAddDialogOpen]);

  const saveProduct = (values: ProductFormValues, id?: string) => {
    if (!firestore) return;
    
    setIsSaving(true);
    const productId = id || `P${Date.now()}`;
    const productRef = doc(firestore, 'products', productId);
    const productData = { ...values, id: productId };

    setDoc(productRef, productData, { merge: true })
      .then(() => {
        setIsAddDialogOpen(false);
        setEditingProduct(null);
        setIsSaving(false);
        toast({ title: id ? 'Creation Refined' : 'Creation Added', description: `${values.name} has been synchronized with the collection.` });
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

  function onAddSubmit(values: ProductFormValues) {
    saveProduct(values);
  }

  function onEditSubmit(values: ProductFormValues) {
    if (!editingProduct) return;
    saveProduct(values, editingProduct.id);
  }
  
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
  
  const capturePhoto = () => {
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
        const dataUrl = canvas.toDataURL('image/jpeg', 0.6); 
        form.setValue('imageUrls', [dataUrl], { shouldValidate: true });
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
        reader.onload = e => {
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
          img.src = e.target!.result as string;
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

  if (loading) {
    return (
      <>
        <PageHeader title="Artisan Portfolio" />
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="animate-pulse rounded-[2rem] overflow-hidden border-none shadow-sm">
               <div className="aspect-[4/3] bg-muted" />
               <CardContent className="p-6 space-y-4">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-3 w-1/4" />
                  <div className="flex justify-between items-end pt-4">
                     <div className="space-y-2">
                        <Skeleton className="h-8 w-24" />
                        <Skeleton className="h-3 w-16" />
                     </div>
                     <Skeleton className="h-6 w-20 rounded-full" />
                  </div>
               </CardContent>
            </Card>
          ))}
        </div>
      </>
    );
  }

  const activeDialog = editingProduct ? 'edit' : (isAddDialogOpen ? 'add' : null);

  return (
    <>
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
                      <Image src={url} alt={`Product perspective ${index + 1}`} fill className="object-contain" />
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
        <DialogContent className="sm:max-w-2xl rounded-[2rem] border-stone-100 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-3xl font-headline">{activeDialog === 'edit' ? 'Refine Creation' : 'Register New Creation'}</DialogTitle>
            <DialogDescription className="text-stone-400">Add the intricate details of your latest artisan chocolate masterpiece.</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(activeDialog === 'edit' ? onEditSubmit : onAddSubmit)}>
              <ScrollArea className="h-[60vh] pr-6">
                <div className="space-y-8 py-4">
                  <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem><FormLabel className="uppercase text-[10px] font-black tracking-widest text-stone-400">Name of Indulgence</FormLabel><FormControl><Input placeholder="e.g., Velvet Noir 85%" className="bg-stone-50 border-stone-100 h-12 rounded-xl" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="flavor" render={({ field }) => (
                    <FormItem><FormLabel className="uppercase text-[10px] font-black tracking-widest text-stone-400">Flavor Profile</FormLabel><FormControl><Input placeholder="e.g., Single-Origin Dark Cocoa" className="bg-stone-50 border-stone-100 h-12 rounded-xl" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <div className="grid grid-cols-2 gap-6">
                    <FormField control={form.control} name="price" render={({ field }) => (
                      <FormItem><FormLabel className="uppercase text-[10px] font-black tracking-widest text-stone-400">Retail Value (₹)</FormLabel><FormControl><Input type="number" className="bg-stone-50 border-stone-100 h-12 rounded-xl" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="wholesalePrice" render={({ field }) => (
                      <FormItem><FormLabel className="uppercase text-[10px] font-black tracking-widest text-stone-400">Wholesale Value (₹)</FormLabel><FormControl><Input type="number" className="bg-stone-50 border-stone-100 h-12 rounded-xl" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                  </div>
                  <FormField control={form.control} name="availabilityStatus" render={({ field }) => (
                    <FormItem><FormLabel className="uppercase text-[10px] font-black tracking-widest text-stone-400">Availability Status</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger className="bg-stone-50 border-stone-100 h-12 rounded-xl"><SelectValue placeholder="Select status" /></SelectTrigger></FormControl><SelectContent><SelectItem value="In Stock">Available for Reserve</SelectItem><SelectItem value="Out of Stock">Currently Maturing</SelectItem></SelectContent></Select><FormMessage /></FormItem>
                  )} />
                  
                  <div className="space-y-4">
                    <FormLabel className="uppercase text-[10px] font-black tracking-widest text-stone-400">Artisan Photography</FormLabel>
                    <Tabs defaultValue="gallery" className="w-full" onValueChange={(tab) => { if (tab !== 'camera') stopCamera(); }}>
                      <TabsList className="grid w-full grid-cols-4 bg-stone-100 rounded-xl p-1 h-12">
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
                                <Image src={image.imageUrl} alt={image.description} fill className="object-cover" />
                              </Label>
                            </div>
                          ))}
                        </RadioGroup>
                      </TabsContent>
                      
                      <TabsContent value="camera" className="pt-4 space-y-4">
                        <div className="w-full aspect-[4/3] bg-stone-100 rounded-2xl flex items-center justify-center overflow-hidden border-2 border-dashed border-stone-200">
                          <video ref={videoRef} className={cn("w-full h-full object-cover", hasCameraPermission === true ? 'block' : 'hidden')} autoPlay muted playsInline />
                          {hasCameraPermission !== true && <Camera className="h-16 w-16 text-stone-300 opacity-20" />}
                        </div>
                        <div className="flex justify-center gap-2">
                          {hasCameraPermission !== true ? (
                            <Button type="button" onClick={enableCamera} variant="outline" className="rounded-xl border-stone-200">Initialize Camera</Button>
                          ) : (
                            <Button type="button" onClick={capturePhoto} className="rounded-xl px-10">Capture Creation</Button>
                          )}
                        </div>
                      </TabsContent>

                      <TabsContent value="url" className="pt-4 space-y-4">
                        <div className="flex gap-2">
                          <Input placeholder="Enter high-end photography URL..." value={remoteUrl} onChange={(e) => setRemoteUrl(e.target.value)} className="bg-stone-50 border-stone-100 h-12 rounded-xl" />
                          <Button type="button" onClick={handleAddRemoteUrl} className="h-12 rounded-xl px-6">Apply</Button>
                        </div>
                        <FormDescription className="text-[10px] uppercase tracking-tighter">Link to professional assets hosted on a premium CDN.</FormDescription>
                      </TabsContent>

                      <TabsContent value="upload" className="pt-4 space-y-4">
                        <div className="grid w-full items-center gap-1.5">
                          <Label htmlFor="picture" className="sr-only">Select Asset</Label>
                          <Input id="picture" type="file" multiple accept="image/*" onChange={handleFileChange} className="cursor-pointer bg-stone-50 border-stone-100 rounded-xl py-3 h-auto" />
                        </div>
                        <FormDescription className="text-[10px] uppercase tracking-tighter">Upload up to 4 high-fidelity files. They will be optimized for storage.</FormDescription>
                      </TabsContent>
                    </Tabs>
                    
                    {form.watch('imageUrls')?.length > 0 && (
                      <div className="mt-6 space-y-3">
                        <Label className="text-[9px] text-stone-400 uppercase tracking-[0.3em] font-black">Selection Portfolio ({form.watch('imageUrls').length}/4)</Label>
                        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin">
                          {form.watch('imageUrls').map((url, i) => (
                            <div key={i} className="relative h-20 w-24 shrink-0 rounded-2xl overflow-hidden border-2 border-stone-50 shadow-md group">
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
              <DialogFooter className="mt-8 pt-6 border-t border-stone-100">
                <DialogClose asChild><Button type="button" variant="secondary" className="rounded-xl h-12 px-8">Discard</Button></DialogClose>
                <Button type="submit" disabled={isSaving} className="rounded-xl h-12 px-10 shadow-xl shadow-primary/20">
                  {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {activeDialog === 'edit' ? 'Commit Refinement' : 'Register Creation'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      <PageHeader title="Artisan Portfolio" actions={<Button onClick={() => setIsAddDialogOpen(true)} className="rounded-xl h-11 px-6 shadow-lg shadow-primary/10"><PlusCircle className="mr-2 h-4 w-4" />New Creation</Button>} />
      
      {(!products || products.length === 0) && !loading ? (
        <div className="flex flex-col items-center justify-center h-80 border-2 border-dashed rounded-[2.5rem] bg-stone-50/50 border-stone-200">
           <PackageSearch className="h-16 w-16 text-stone-200 mb-6" />
           <p className="text-stone-400 font-headline text-2xl italic">The collection is currently awaiting its first creation.</p>
           <Button variant="link" className="text-primary mt-2" onClick={() => setIsAddDialogOpen(true)}>Begin your first artisanal entry</Button>
        </div>
      ) : (
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products?.map((product) => (
            <Card key={product.id} className="flex flex-col group overflow-hidden border-none shadow-sm hover:shadow-[0_20px_50px_-20px_rgba(0,0,0,0.1)] transition-all duration-700 rounded-[2rem] bg-white">
              <CardHeader className="p-0 relative">
                 <button type="button" className="block w-full aspect-[4/3] relative overflow-hidden" onClick={() => setViewingProduct({ images: product.imageUrls, startIndex: 0, productName: product.name })}>
                    <Image src={product.imageUrls?.[0] || 'https://picsum.photos/seed/default/400/300'} alt={product.name} fill className="object-cover transition-transform duration-[2s] ease-in-out group-hover:scale-110" data-ai-hint={product.imageHint} />
                    <div className="absolute inset-0 bg-stone-900/0 group-hover:bg-stone-900/20 transition-all duration-700 flex items-center justify-center">
                        <ImageIcon className="text-white opacity-0 scale-50 group-hover:opacity-100 group-hover:scale-100 transition-all duration-500 h-10 w-10 drop-shadow-2xl" />
                    </div>
                  </button>
              </CardHeader>
              <CardContent className="p-6 flex-grow space-y-6">
                <div className="grid grid-cols-4 gap-2">
                  {product.imageUrls?.slice(1, 4).map((url, index) => (
                     <button key={index} type="button" className="block w-full aspect-square relative rounded-xl overflow-hidden border-2 border-stone-50 hover:border-primary/30 transition-all shadow-sm" onClick={() => setViewingProduct({ images: product.imageUrls, startIndex: index + 1, productName: product.name })}><Image src={url} alt="" fill className="object-cover" /></button>
                  ))}
                  {product.imageUrls?.length > 4 && (
                    <div className="bg-stone-50 rounded-xl flex items-center justify-center text-[10px] font-black text-stone-400">+{product.imageUrls.length - 4}</div>
                  )}
                </div>
                <div>
                    <CardTitle className="font-headline text-2xl mb-1 group-hover:text-primary transition-colors leading-tight">{product.name}</CardTitle>
                    <p className="text-[9px] text-stone-400 uppercase tracking-[0.3em] font-black leading-none">{product.flavor}</p>
                </div>
                <div className="flex justify-between items-end">
                  <div className="space-y-0.5">
                    <p className="text-2xl font-bold text-stone-900 tracking-tighter">₹{product.price.toLocaleString()}</p>
                    <p className="text-[9px] text-stone-400 uppercase tracking-widest font-bold">W: ₹{product.wholesalePrice.toLocaleString()}</p>
                  </div>
                   <Badge variant={product.availabilityStatus === 'In Stock' ? 'default' : 'destructive'} className={cn(product.availabilityStatus === 'In Stock' ? 'bg-green-700 hover:bg-green-800' : '', "rounded-full uppercase tracking-widest text-[8px] py-1 px-3 shadow-lg")}>{product.availabilityStatus}</Badge>
                </div>
              </CardContent>
              <CardFooter className="p-6 pt-0"><Button variant="outline" className="w-full rounded-2xl border-stone-100 h-12 hover:bg-stone-50 text-stone-600 font-bold uppercase text-[10px] tracking-widest" onClick={() => setEditingProduct(product)}><Edit className="h-3.5 w-3.5 mr-2" /> Modify Portfolio</Button></CardFooter>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
