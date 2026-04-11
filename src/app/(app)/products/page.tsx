'use client';

import { useState, useEffect, useRef } from 'react';
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


const productFormSchema = z.object({
  name: z.string().min(1, 'Product name is required.'),
  flavor: z.string().min(1, 'Flavor profile is required.'),
  price: z.coerce.number().positive('Price must be a positive number.'),
  wholesalePrice: z.coerce.number().positive('Wholesale price must be a positive number.'),
  availabilityStatus: z.enum(['In Stock', 'Out of Stock']),
  imageUrl: z.string().url('Please select an image.'),
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


  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: '',
      flavor: '',
      availabilityStatus: 'In Stock',
      imageUrl: '',
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
        imageUrl: editingProduct.imageUrl,
        imageHint: editingProduct.imageHint,
      });
    } else {
      form.reset({
        name: '',
        flavor: '',
        price: undefined,
        wholesalePrice: undefined,
        availabilityStatus: 'In Stock',
        imageUrl: '',
        imageHint: '',
      });
    }
  }, [editingProduct, form]);

  function onAddSubmit(values: ProductFormValues) {
    const newProduct: Product = {
      id: `P${String(products.length + 10).padStart(3, '0')}`,
      ...values,
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

    setProducts(
      products.map((p) =>
        p.id === editingProduct.id ? { ...p, ...values } : p
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
        form.setValue('imageUrl', dataUrl, { shouldValidate: true });
        form.setValue('imageHint', 'custom photo');
        stopCamera();
      }
    }
  };


  const activeDialog = editingProduct ? 'edit' : (isAddDialogOpen ? 'add' : null);
  const onDialogSubmit = editingProduct ? form.handleSubmit(onEditSubmit) : form.handleSubmit(onAddSubmit);
  const imageUrl = form.watch('imageUrl');

  return (
    <>
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
                    name="imageUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Product Image</FormLabel>
                        {imageUrl && (
                          <div className="w-full rounded-md border p-2">
                             <Label className="text-xs text-muted-foreground">Image Preview</Label>
                             <div className="mt-2 aspect-video w-full relative">
                                <Image src={imageUrl} alt="Product image preview" fill className="rounded-md object-cover" />
                             </div>
                          </div>
                        )}
                        <Tabs defaultValue="gallery" className="w-full" onValueChange={(tab) => { if (tab !== 'camera') stopCamera(); }}>
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="gallery">Gallery</TabsTrigger>
                                <TabsTrigger value="camera">Camera</TabsTrigger>
                            </TabsList>
                            <TabsContent value="gallery">
                                <FormControl>
                                <RadioGroup
                                    onValueChange={(value) => {
                                    const selectedImage = PlaceHolderImages.find(img => img.imageUrl === value);
                                    if (selectedImage) {
                                        field.onChange(selectedImage.imageUrl);
                                        form.setValue('imageHint', selectedImage.imageHint, { shouldValidate: true });
                                    }
                                    }}
                                    value={field.value}
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
              <Image
                src={product.imageUrl}
                alt={product.name}
                width={400}
                height={300}
                className="object-cover rounded-t-lg aspect-[4/3]"
                data-ai-hint={product.imageHint}
              />
            </CardHeader>
            <CardContent className="p-4 flex-grow">
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
