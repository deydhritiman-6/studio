'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import type { Product } from '@/lib/types';
import { Camera, PlusCircle, Loader2, AlertCircle } from 'lucide-react';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
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
  }, [editingProduct, form]);

  const saveProduct = (values: ProductFormValues, id?: string) => {
    if (!firestore) return;
    setIsSaving(true);
    const productId = id || `P${Date.now()}`;
    const productRef = doc(firestore, 'products', productId);
    const productData = { ...values, id: productId };

    setDoc(productRef, productData)
      .then(() => {
        setIsAddDialogOpen(false);
        setEditingProduct(null);
        setIsSaving(false);
        toast({ title: id ? 'Product Updated' : 'Product Added', description: `${values.name} has been successfully saved.` });
      })
      .catch(async (error) => {
        setIsSaving(false);
        toast({
          variant: 'destructive',
          title: 'Save Failed',
          description: 'Could not save the product. The data size (including high-res photos) might exceed the database limit.',
        });
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
      console.error('Error accessing camera:', error);
      setHasCameraPermission(false);
      toast({
        variant: 'destructive',
        title: 'Camera Access Denied',
        description: 'Please enable camera permissions in your browser settings.',
      });
    }
  };
  
  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7); // Compress slightly to stay within Firestore limits
        form.setValue('imageUrls', [dataUrl, dataUrl, dataUrl, dataUrl], { shouldValidate: true });
        form.setValue('imageHint', 'custom photo');
        stopCamera();
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
        reader.onload = e => resolve(e.target!.result as string);
        reader.onerror = e => reject(e);
        reader.readAsDataURL(file);
      });
    });

    Promise.all(fileToUrlPromises).then(urls => {
        const finalUrls = [...urls];
        while (finalUrls.length > 0 && finalUrls.length < 4) {
            finalUrls.push(finalUrls[finalUrls.length - 1]);
        }
        form.setValue('imageUrls', finalUrls, { shouldValidate: true });
        form.setValue('imageHint', 'uploaded image');
    });
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin" /></div>;
  }

  const activeDialog = editingProduct ? 'edit' : (isAddDialogOpen ? 'add' : null);
  const onDialogSubmit = editingProduct ? form.handleSubmit(onEditSubmit) : form.handleSubmit(onAddSubmit);

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
                      <Image src={url} alt={`Product ${index + 1}`} fill className="object-contain" />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="absolute left-4 top-1/2 -translate-y-1/2 text-accent bg-black/60 hover:bg-black/80 h-10 w-10" />
              <CarouselNext className="absolute right-4 top-1/2 -translate-y-1/2 text-accent bg-black/60 hover:bg-black/80 h-10 w-10" />
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
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{activeDialog === 'edit' ? 'Edit Product' : 'Add New Product'}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={onDialogSubmit}>
              <ScrollArea className="h-[60vh] pr-6">
                <div className="space-y-4">
                  <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem><FormLabel>Product Name</FormLabel><FormControl><Input placeholder="e.g., Velvet Noir 85%" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="flavor" render={({ field }) => (
                    <FormItem><FormLabel>Flavor Profile</FormLabel><FormControl><Input placeholder="e.g., Dark Chocolate" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="price" render={({ field }) => (
                      <FormItem><FormLabel>Retail Price (₹)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="wholesalePrice" render={({ field }) => (
                      <FormItem><FormLabel>Wholesale Price (₹)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                  </div>
                  <FormField control={form.control} name="availabilityStatus" render={({ field }) => (
                    <FormItem><FormLabel>Availability</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select availability" /></SelectTrigger></FormControl><SelectContent><SelectItem value="In Stock">In Stock</SelectItem><SelectItem value="Out of Stock">Out of Stock</SelectItem></SelectContent></Select><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="imageUrls" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product Images</FormLabel>
                      <Tabs defaultValue="gallery" className="w-full" onValueChange={(tab) => { if (tab !== 'camera') stopCamera(); }}>
                        <TabsList className="grid w-full grid-cols-4"><TabsTrigger value="gallery">Gallery</TabsTrigger><TabsTrigger value="camera">Camera</TabsTrigger><TabsTrigger value="url">URL</TabsTrigger><TabsTrigger value="upload">Upload</TabsTrigger></TabsList>
                        <TabsContent value="gallery">
                          <div className="pt-4">
                            <RadioGroup onValueChange={(value) => {
                              const selectedImage = PlaceHolderImages.find(img => img.imageUrl === value);
                              if (selectedImage) {
                                const seed = selectedImage.imageUrl.split('/seed/')[1].split('/')[0];
                                field.onChange([selectedImage.imageUrl, `https://picsum.photos/seed/${seed}_a/400/300`, `https://picsum.photos/seed/${seed}_b/400/300`, `https://picsum.photos/seed/${seed}_c/400/300`]);
                                form.setValue('imageHint', selectedImage.imageHint, { shouldValidate: true });
                              }
                            }} value={field.value?.[0]} className="grid grid-cols-3 gap-4">
                              {PlaceHolderImages.map((image) => (
                                <FormItem key={image.id}><RadioGroupItem value={image.imageUrl} id={image.id} className="peer sr-only" /><Label htmlFor={image.id} className="block cursor-pointer rounded-md border-2 border-muted bg-popover hover:border-accent peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"><Image src={image.imageUrl} alt={image.description} width={200} height={150} className="rounded-md object-cover aspect-[4/3] w-full" /></Label></FormItem>
                              ))}
                            </RadioGroup>
                          </div>
                        </TabsContent>
                        <TabsContent value="camera">
                          <div className="space-y-4 pt-4"><div className="w-full aspect-video bg-muted rounded-md flex items-center justify-center overflow-hidden"><video ref={videoRef} className={cn("w-full h-full object-cover", hasCameraPermission === true ? 'block' : 'hidden')} autoPlay muted playsInline />{hasCameraPermission !== true && <Camera className="h-16 w-16 text-muted-foreground" />}</div><div className="flex gap-2">{hasCameraPermission !== true ? <Button type="button" onClick={enableCamera}>Enable Camera</Button> : <Button type="button" onClick={capturePhoto}>Capture Photo</Button>}</div></div>
                        </TabsContent>
                      </Tabs>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <canvas ref={canvasRef} className="hidden" />
                </div>
              </ScrollArea>
              <DialogFooter className="mt-6 pt-4 border-t">
                <DialogClose asChild><Button type="button" variant="secondary">Cancel</Button></DialogClose>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Save Changes
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      <PageHeader title="Products" actions={<Button onClick={() => setIsAddDialogOpen(true)}><PlusCircle className="mr-2 h-4 w-4" />Add Product</Button>} />
      
      {products?.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-lg">
           <PackageSearch className="h-12 w-12 text-muted-foreground mb-4" />
           <p className="text-muted-foreground">No products found. Start by adding your first creation.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products?.map((product) => (
            <Card key={product.id} className="flex flex-col">
              <CardHeader className="p-0 relative">
                 <button type="button" className="block w-full aspect-[4/3] relative rounded-t-lg overflow-hidden" onClick={() => setViewingProduct({ images: product.imageUrls, startIndex: 0, productName: product.name })}>
                    <Image src={product.imageUrls?.[0] || 'https://picsum.photos/seed/default/400/300'} alt={product.name} fill className="object-cover" data-ai-hint={product.imageHint} />
                  </button>
              </CardHeader>
              <CardContent className="p-4 flex-grow">
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {product.imageUrls?.slice(1, 4).map((url, index) => (
                     <button key={index} type="button" className="block w-full aspect-[4/3] relative rounded-md overflow-hidden" onClick={() => setViewingProduct({ images: product.imageUrls, startIndex: index + 1, productName: product.name })}><Image src={url} alt={`Thumbnail ${index + 1}`} fill className="object-cover" data-ai-hint={product.imageHint} /></button>
                  ))}
                </div>
                <CardTitle className="font-headline text-lg mb-1">{product.name}</CardTitle>
                <p className="text-sm text-muted-foreground">{product.flavor}</p>
                <div className="flex justify-between items-center mt-4">
                  <p className="text-lg font-semibold">₹{product.price}</p>
                   <Badge variant={product.availabilityStatus === 'In Stock' ? 'default' : 'destructive'} className={product.availabilityStatus === 'In Stock' ? 'bg-green-700 hover:bg-green-800' : ''}>{product.availabilityStatus}</Badge>
                </div>
              </CardContent>
              <CardFooter className="p-4 pt-0"><Button variant="outline" className="w-full" onClick={() => setEditingProduct(product)}>Edit Product</Button></CardFooter>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}

function PackageSearch({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M21 10V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l2-1.14" />
      <path d="M16.5 9.4 7.55 4.24" />
      <polyline points="3.29 7 12 12 20.71 7" />
      <line x1="12" y1="22" x2="12" y2="12" />
      <circle cx="18.5" cy="15.5" r="2.5" />
      <path d="M20.27 17.27 22 19" />
    </svg>
  );
}