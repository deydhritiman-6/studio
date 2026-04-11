'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { products as initialProducts } from '@/lib/data';
import type { Product } from '@/lib/types';
import { Camera, PlusCircle } from 'lucide-react';
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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';


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
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
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
        price: undefined,
        wholesalePrice: undefined,
        availabilityStatus: 'In Stock',
        imageUrls: [],
        imageHint: '',
      });
    }
  }, [editingProduct, form]);

  function onAddSubmit(values: ProductFormValues) {
    const newProduct: Product = {
      id: `P${String(products.length + 10).padStart(3, '0')}`,
      name: values.name,
      flavor: values.flavor,
      price: values.price,
      wholesalePrice: values.wholesalePrice,
      availabilityStatus: values.availabilityStatus,
      imageUrls: values.imageUrls,
      imageHint: values.imageHint,
    };
    setProducts([newProduct, ...products]);
    setIsAddDialogOpen(false);
    toast({
      title: 'Product Added',
      description: `${newProduct.name} has been successfully added.`,
    });
  }

  function onEditSubmit(values: ProductFormValues) {
    if (!editingProduct) return;

    const updatedProduct: Product = {
        ...editingProduct,
        name: values.name,
        flavor: values.flavor,
        price: values.price,
        wholesalePrice: values.wholesalePrice,
        availabilityStatus: values.availabilityStatus,
        imageUrls: values.imageUrls,
        imageHint: values.imageHint,
    };

    setProducts(
      products.map((p) =>
        p.id === editingProduct.id ? updatedProduct : p
      )
    );
    setEditingProduct(null);
    toast({
      title: 'Product Updated',
      description: `The details for ${values.name} have been updated.`,
    });
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
        const dataUrl = canvas.toDataURL('image/jpeg');
        form.setValue('imageUrls', [dataUrl, dataUrl, dataUrl, dataUrl], { shouldValidate: true });
        form.setValue('imageHint', 'custom photo');
        stopCamera();
      }
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) {
      return;
    }

    let fileArray = Array.from(files);

    if (fileArray.length > 4) {
      toast({
        title: "Maximum 4 images",
        description: "Only the first 4 images have been selected.",
      });
      fileArray = fileArray.slice(0, 4);
    }
    
    if (fileArray.some(file => !file.type.startsWith('image/'))) {
        toast({ variant: 'destructive', title: 'Invalid File Type', description: 'Please select only image files.' });
        return;
    }
    
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
    }).catch(err => {
      console.error(err);
      toast({ variant: "destructive", title: "Error uploading files", description: "There was an error processing your images." });
    });
  };


  const activeDialog = editingProduct ? 'edit' : (isAddDialogOpen ? 'add' : null);
  const onDialogSubmit = editingProduct ? form.handleSubmit(onEditSubmit) : form.handleSubmit(onAddSubmit);
  const imageUrls = form.watch('imageUrls');

  const hasCustomImages = useMemo(() => {
    if (!imageUrls || imageUrls.length === 0) return false;
    return !PlaceHolderImages.some(p => p.imageUrl === imageUrls[0]);
  }, [imageUrls]);

  return (
    <>
      <Dialog open={!!viewingProduct} onOpenChange={(open) => !open && setViewingProduct(null)}>
        <DialogContent className="sm:max-w-4xl p-0 border-0 bg-transparent shadow-none">
          <DialogHeader className="sr-only">
            <DialogTitle>{viewingProduct ? `${viewingProduct.productName} Image Gallery` : 'Image Gallery'}</DialogTitle>
            <DialogDescription>
              {viewingProduct ? `Use the arrow buttons to navigate through images of ${viewingProduct.productName}.` : 'Navigate through product images.'}
            </DialogDescription>
          </DialogHeader>
          {viewingProduct && (
            <Carousel
              opts={{
                startIndex: viewingProduct.startIndex,
                loop: true,
              }}
              className="w-full"
            >
              <CarouselContent>
                {viewingProduct.images.map((url, index) => (
                  <CarouselItem key={index}>
                    <div className="aspect-video relative">
                      <Image src={url} alt={`Enlarged product image ${index + 1}`} fill className="object-contain" />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="absolute left-2 top-1/2 -translate-y-1/2 text-white bg-black/50 hover:bg-black/80" />
              <CarouselNext className="absolute right-2 top-1/2 -translate-y-1/2 text-white bg-black/50 hover:bg-black/80" />
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
            <DialogDescription>
              {activeDialog === 'edit' ? 'Update the details for this product.' : 'Fill in the details for the new product.'}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={onDialogSubmit}>
              <ScrollArea className="h-[60vh] pr-6">
                <div className="space-y-4">
                  <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product Name</FormLabel>
                      <FormControl><Input placeholder="e.g., Velvet Noir 85%" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="flavor" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Flavor Profile</FormLabel>
                      <FormControl><Input placeholder="e.g., Dark Chocolate" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="price" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Retail Price (₹)</FormLabel>
                        <FormControl><Input type="number" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="wholesalePrice" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Wholesale Price (₹)</FormLabel>
                        <FormControl><Input type="number" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                  <FormField
                    control={form.control}
                    name="availabilityStatus"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Availability</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select availability" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="In Stock">In Stock</SelectItem>
                            <SelectItem value="Out of Stock">Out of Stock</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="imageUrls"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Product Images</FormLabel>
                         <div className="p-2 border rounded-md">
                            <Label className="text-xs text-muted-foreground">
                            {imageUrls && imageUrls.length > 0 ? "Click a thumbnail to set it as the primary image." : "Images will appear here once selected."}
                            </Label>
                            {imageUrls && imageUrls.length > 0 ? (
                            <div className="grid grid-cols-3 gap-2 mt-2">
                                <div className="col-span-3 aspect-video relative rounded-md overflow-hidden bg-muted">
                                <Image src={imageUrls[0]} alt="Primary product image" fill className="object-cover" />
                                </div>
                                {imageUrls.slice(1).map((url, index) => (
                                <button
                                    type="button"
                                    key={index}
                                    onClick={() => {
                                        const newImageUrls = [...imageUrls];
                                        [newImageUrls[0], newImageUrls[index + 1]] = [newImageUrls[index + 1], newImageUrls[0]];
                                        form.setValue('imageUrls', newImageUrls, { shouldValidate: true });
                                    }}
                                    className="aspect-video relative rounded-md overflow-hidden"
                                >
                                    <Image src={url} alt={`Thumbnail ${index + 1}`} fill className="object-cover" />
                                </button>
                                ))}
                            </div>
                            ) : (
                            <div className="aspect-video bg-muted rounded-md flex items-center justify-center mt-2">
                                <Camera className="h-10 w-10 text-muted-foreground" />
                            </div>
                            )}
                        </div>
                        
                        <Tabs defaultValue="gallery" className="w-full" onValueChange={(tab) => { if (tab !== 'camera') stopCamera(); }}>
                            <TabsList className="grid w-full grid-cols-4">
                                <TabsTrigger value="gallery">Gallery</TabsTrigger>
                                <TabsTrigger value="camera">Camera</TabsTrigger>
                                <TabsTrigger value="url">URL</TabsTrigger>
                                <TabsTrigger value="upload">Upload</TabsTrigger>
                            </TabsList>
                            <TabsContent value="gallery">
                                <FormControl>
                                  <RadioGroup
                                      onValueChange={(value) => {
                                        const selectedImage = PlaceHolderImages.find(img => img.imageUrl === value);
                                        if (selectedImage) {
                                            const seed = selectedImage.imageUrl.split('/seed/')[1].split('/')[0];
                                            const newImageUrls = [
                                                selectedImage.imageUrl,
                                                `https://picsum.photos/seed/${seed}_a/400/300`,
                                                `https://picsum.photos/seed/${seed}_b/400/300`,
                                                `https://picsum.photos/seed/${seed}_c/400/300`,
                                            ];
                                            field.onChange(newImageUrls);
                                            form.setValue('imageHint', selectedImage.imageHint, { shouldValidate: true });
                                        }
                                      }}
                                      value={hasCustomImages ? undefined : field.value?.[0]}
                                      className="grid grid-cols-3 gap-4 pt-4"
                                  >
                                      {PlaceHolderImages.map((image) => (
                                      <FormItem key={image.id}>
                                          <RadioGroupItem value={image.imageUrl} id={image.id} className="peer sr-only" />
                                          <Label
                                          htmlFor={image.id}
                                          className="block cursor-pointer rounded-md border-2 border-muted bg-popover hover:border-accent peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                                          >
                                          <Image
                                              src={image.imageUrl}
                                              alt={image.description}
                                              width={200}
                                              height={150}
                                              className="rounded-md object-cover aspect-[4/3] w-full"
                                          />
                                          </Label>
                                      </FormItem>
                                      ))}
                                  </RadioGroup>
                                </FormControl>
                            </TabsContent>
                            <TabsContent value="camera">
                                <div className="space-y-4 pt-4">
                                    <div className="w-full aspect-video bg-muted rounded-md flex items-center justify-center overflow-hidden">
                                        <video ref={videoRef} className={cn("w-full h-full object-cover", hasCameraPermission === true ? 'block' : 'hidden')} autoPlay muted playsInline />
                                        {hasCameraPermission !== true && <Camera className="h-16 w-16 text-muted-foreground" />}
                                    </div>
                                    
                                    {hasCameraPermission === false && (
                                        <Alert variant="destructive">
                                            <AlertTitle>Camera Access Required</AlertTitle>
                                            <AlertDescription>
                                                Please allow camera access in your browser settings to use this feature.
                                            </AlertDescription>
                                        </Alert>
                                    )}
                                    
                                    <div className="flex gap-2">
                                        {hasCameraPermission !== true ? (
                                             <Button type="button" onClick={enableCamera}>Enable Camera</Button>
                                        ) : (
                                             <Button type="button" onClick={capturePhoto}>Capture Photo</Button>
                                        )}
                                    </div>
                                </div>
                            </TabsContent>
                             <TabsContent value="url">
                                <div className="space-y-2 pt-4">
                                    <Label htmlFor="url-input">Image URL</Label>
                                    <Input
                                        id="url-input"
                                        placeholder="https://example.com/image.png"
                                        value={field.value?.[0]?.startsWith('http') ? field.value[0] : ''}
                                        onChange={(e) => {
                                            const url = e.target.value;
                                            const newUrls = url ? [url, url, url, url] : [];
                                            field.onChange(newUrls);
                                            if (url) {
                                                form.setValue('imageHint', 'from url');
                                            }
                                        }}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Paste a link to an image from the web.
                                    </p>
                                </div>
                            </TabsContent>
                            <TabsContent value="upload">
                                <div className="space-y-2 pt-4">
                                    <Label htmlFor="file-upload">Upload from device (up to 4 images)</Label>
                                    <Input
                                        id="file-upload"
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        onChange={handleFileChange}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Select one or more image files from your device.
                                    </p>
                                </div>
                            </TabsContent>
                        </Tabs>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <canvas ref={canvasRef} className="hidden" />
                </div>
              </ScrollArea>
              <DialogFooter className="mt-6 pt-4 border-t">
                <DialogClose asChild>
                    <Button type="button" variant="secondary">Cancel</Button>
                </DialogClose>
                <Button type="submit">Save Changes</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      <PageHeader title="Products" actions={
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Product
        </Button>
      } />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {products.map((product) => (
          <Card key={product.id} className="flex flex-col">
            <CardHeader className="p-0 relative">
               <button
                  type="button"
                  className="block w-full aspect-[4/3] relative rounded-t-lg overflow-hidden"
                  onClick={() => setViewingProduct({ images: product.imageUrls, startIndex: 0, productName: product.name })}
                >
                  <Image
                    src={product.imageUrls[0]}
                    alt={product.name}
                    fill
                    className="object-cover"
                    data-ai-hint={product.imageHint}
                  />
                </button>
            </CardHeader>
            <CardContent className="p-4 flex-grow">
              <div className="grid grid-cols-3 gap-2 mb-4">
                {product.imageUrls.slice(1, 4).map((url, index) => (
                   <button
                    key={index}
                    type="button"
                    className="block w-full aspect-[4/3] relative rounded-md overflow-hidden"
                    onClick={() => setViewingProduct({ images: product.imageUrls, startIndex: index + 1, productName: product.name })}
                  >
                    <Image
                      src={url}
                      alt={`${product.name} thumbnail ${index + 1}`}
                      fill
                      className="object-cover"
                      data-ai-hint={product.imageHint}
                    />
                  </button>
                ))}
              </div>
              <CardTitle className="font-headline text-lg mb-1">{product.name}</CardTitle>
              <p className="text-sm text-muted-foreground">{product.flavor}</p>
              <div className="flex justify-between items-center mt-4">
                <p className="text-lg font-semibold">₹{product.price}</p>
                 <Badge variant={product.availabilityStatus === 'In Stock' ? 'default' : 'destructive'} className={product.availabilityStatus === 'In Stock' ? 'bg-green-700 hover:bg-green-800' : ''}>
                    {product.availabilityStatus}
                </Badge>
              </div>
            </CardContent>
            <CardFooter className="p-4 pt-0">
              <Button variant="outline" className="w-full" onClick={() => setEditingProduct(product)}>
                Edit Product
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </>
  );
}
