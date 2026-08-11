'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { 
  Images, 
  PlusCircle, 
  Loader2, 
  Trash2, 
  Camera, 
  Upload, 
  RefreshCw, 
  Eye, 
  Calendar, 
  Package, 
  Search,
  X,
  Sparkles,
  ShieldAlert
} from 'lucide-react';
import Image from 'next/image';
import { useCollection, useFirestore } from '@/firebase';
import { collection, doc, setDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import type { Product, ProductGallery } from '@/lib/types';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const galleryFormSchema = z.object({
  productId: z.string().optional(),
  productName: z.string().min(1, 'Product Name is required.'),
  mainImage: z.string().min(1, 'Main Photo is required.'),
  subPhoto1: z.string().optional(),
  subPhoto2: z.string().optional(),
  subPhoto3: z.string().optional(),
});

type GalleryFormValues = z.infer<typeof galleryFormSchema>;

export default function PhotoGalleryManagementPage() {
  const firestore = useFirestore();
  const productsQuery = useMemo(() => (firestore ? collection(firestore, 'products') : null), [firestore]);
  const galleriesQuery = useMemo(() => (firestore ? query(collection(firestore, 'product-galleries'), orderBy('createdAt', 'desc')) : null), [firestore]);
  
  const { data: products } = useCollection<Product>(productsQuery);
  const { data: galleries, loading: galleriesLoading } = useCollection<ProductGallery>(galleriesQuery);

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingGallery, setEditingGallery] = useState<ProductGallery | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewingImage, setViewingImage] = useState<string | null>(null);
  const [identityMode, setIdentityMode] = useState<'existing' | 'new'>('existing');

  const [itemToDelete, setItemToDelete] = useState<ProductGallery | null>(null);
  const [deleteInput, setDeleteInput] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const { toast } = useToast();

  const portfolioProducts = useMemo(() => {
    return products?.filter(p => p.productionStatus === 'Product Ready' && !p.isArchived) || [];
  }, [products]);

  const galleryIdentities = useMemo(() => {
    const productNames = portfolioProducts.map(p => p.name);
    return Array.from(new Set(productNames)).sort();
  }, [portfolioProducts]);

  const combinedGalleries = useMemo(() => {
    if (galleriesLoading) return [];
    
    const list = [...(galleries || [])];
    
    portfolioProducts.forEach(p => {
      const hasGallery = list.some(g => g.productId === p.id || g.productName === p.name);
      if (!hasGallery) {
        list.push({
          id: `VIRTUAL-${p.id}`, 
          productId: p.id,
          productName: p.name,
          mainImage: p.imageUrls?.[0] || 'https://picsum.photos/seed/default/400/300',
          subImages: p.imageUrls?.slice(1, 4) || [],
          createdAt: p.productionDate || new Date().toISOString(),
        } as any);
      }
    });

    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [galleries, portfolioProducts, galleriesLoading]);

  const filteredGalleries = useMemo(() => {
    return combinedGalleries.filter(g => 
      g.productName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [combinedGalleries, searchTerm]);

  const form = useForm<GalleryFormValues>({
    resolver: zodResolver(galleryFormSchema),
    defaultValues: {
      productId: '',
      productName: '',
      mainImage: '',
      subPhoto1: '',
      subPhoto2: '',
      subPhoto3: '',
    }
  });

  useEffect(() => {
    if (editingGallery) {
      form.reset({
        productId: editingGallery.productId || '',
        productName: editingGallery.productName,
        mainImage: editingGallery.mainImage,
        subPhoto1: editingGallery.subImages?.[0] || '',
        subPhoto2: editingGallery.subImages?.[1] || '',
        subPhoto3: editingGallery.subImages?.[2] || '',
      });
      setIdentityMode('existing');
    } else if (isAddDialogOpen) {
      form.reset({
        productId: '',
        productName: '',
        mainImage: '',
        subPhoto1: '',
        subPhoto2: '',
        subPhoto3: '',
      });
      setIdentityMode('new');
    }
  }, [editingGallery, isAddDialogOpen, form]);

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
        resolve(canvas.toDataURL('image/jpeg', 0.7)); 
      };
      img.src = dataUrl;
    });
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>, fieldName: keyof GalleryFormValues) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const optimized = await optimizeImage(event.target?.result as string);
      form.setValue(fieldName, optimized, { shouldValidate: true });
    };
    reader.readAsDataURL(file);
  };

  const handleSaveGallery = (values: GalleryFormValues) => {
    if (!firestore) return;

    setIsSaving(true);
    const isVirtual = editingGallery?.id?.startsWith('VIRTUAL-');
    const galleryId = (editingGallery && !isVirtual) ? editingGallery.id : `GAL-${Date.now()}`;
    const galleryRef = doc(firestore, 'product-galleries', galleryId);
    
    const subImages = [values.subPhoto1, values.subPhoto2, values.subPhoto3].filter(Boolean) as string[];

    const galleryData: ProductGallery = {
      id: galleryId,
      productId: values.productId || '',
      productName: values.productName,
      mainImage: values.mainImage,
      subImages: subImages,
      createdAt: (editingGallery && !isVirtual) ? editingGallery.createdAt : new Date().toISOString(),
    };

    setDoc(galleryRef, galleryData, { merge: true })
      .then(() => {
        setIsAddDialogOpen(false);
        setEditingGallery(null);
        toast({ title: 'Gallery Synchronized', description: `Photography for ${galleryData.productName} has been saved.` });
      })
      .catch(async (error) => {
        const permissionError = new FirestorePermissionError({
          path: galleryRef.path,
          operation: 'write',
          requestResourceData: galleryData,
        });
        errorEmitter.emit('permission-error', permissionError);
      })
      .finally(() => setIsSaving(false));
  };

  const confirmDelete = async () => {
    if (!firestore || !itemToDelete) return;
    setIsDeleting(true);

    const galleryRef = doc(firestore, 'product-galleries', itemToDelete.id);
    deleteDoc(galleryRef)
      .then(() => {
        toast({ title: 'Set Removed' });
        setItemToDelete(null);
        setDeleteInput('');
      })
      .catch(async (error) => {
        const permissionError = new FirestorePermissionError({
          path: galleryRef.path,
          operation: 'delete',
        });
        errorEmitter.emit('permission-error', permissionError);
      })
      .finally(() => setIsDeleting(false));
  };

  const PhotoSlot = ({ fieldName, label, required = false }: { fieldName: keyof GalleryFormValues, label: string, required?: boolean }) => {
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

  return (
    <>
      <PageHeader 
        title="Photography Asset Control" 
        actions={
          <Button onClick={() => setIsAddDialogOpen(true)} className="rounded-xl h-11 px-6 shadow-lg shadow-primary/10">
            <PlusCircle className="mr-2 h-4 w-4" /> New Asset Set
          </Button>
        } 
      />

      <div className="grid grid-cols-1 gap-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
           <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search visual archive..." 
                className="pl-10 h-11 rounded-xl bg-card border-none shadow-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
           </div>
           <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
             <Images className="h-4 w-4" /> {filteredGalleries.length} Product Sets
           </div>
        </div>

        {galleriesLoading ? (
            <div className="flex justify-center py-20"><Loader2 className="animate-spin h-10 w-10 text-primary" /></div>
        ) : filteredGalleries.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredGalleries.map((gallery) => (
              <Card key={gallery.id} className="rounded-[2.5rem] border-none shadow-sm hover:shadow-2xl transition-all duration-500 bg-card overflow-hidden group">
                <div className="aspect-video relative overflow-hidden bg-stone-900">
                    <Image src={gallery.mainImage} alt={gallery.productName} fill className="object-cover transition-transform duration-[2s] group-hover:scale-110 opacity-90 group-hover:opacity-100" />
                    <div className="absolute inset-0 bg-gradient-to-t from-stone-900 via-transparent to-transparent opacity-60"></div>
                    <div className="absolute bottom-4 left-6">
                        {gallery.id.startsWith('VIRTUAL-') && <Badge className="bg-amber-500 text-stone-950 border-none font-black uppercase text-[7px] tracking-[0.2em] mb-1">Portfolio Sync</Badge>}
                        <h3 className="text-xl font-headline text-white mt-0.5">{gallery.productName}</h3>
                    </div>
                    <button 
                      onClick={() => setViewingImage(gallery.mainImage)}
                      className="absolute top-4 right-4 h-10 w-10 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white hover:text-stone-900"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                </div>
                <CardContent className="p-6">
                   <div className="grid grid-cols-3 gap-4 mb-6">
                      {[0, 1, 2].map((i) => (
                        <div key={i} className="aspect-square relative rounded-2xl overflow-hidden bg-muted border border-border/50 group/sub shadow-inner">
                           {gallery.subImages[i] ? (
                             <>
                                <Image src={gallery.subImages[i]} alt="" fill className="object-cover" />
                                <button 
                                  onClick={() => setViewingImage(gallery.subImages[i])}
                                  className="absolute inset-0 bg-black/40 opacity-0 group-hover/sub:opacity-100 transition-opacity flex items-center justify-center text-white"
                                >
                                  <Eye className="h-4 w-4" />
                                </button>
                             </>
                           ) : (
                             <div className="h-full w-full flex items-center justify-center text-muted-foreground/20">
                               <Package className="h-4 w-4 opacity-50" />
                             </div>
                           )}
                        </div>
                      ))}
                   </div>
                   <div className="flex items-center justify-between pt-4 border-t border-border/50">
                      <div className="flex items-center gap-2 text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                        <Calendar className="h-3 w-3" /> {format(new Date(gallery.createdAt), 'MMM d, yyyy')}
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-primary/10 hover:text-primary" onClick={() => setEditingGallery(gallery)}>
                            <RefreshCw className="h-4 w-4" />
                        </Button>
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-9 w-9 rounded-xl hover:bg-destructive/10 hover:text-destructive" 
                            onClick={() => setItemToDelete(gallery)}
                            disabled={gallery.id.startsWith('VIRTUAL-')}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                   </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-80 border-2 border-dashed rounded-[2.5rem] bg-muted/30 border-border text-center px-4">
             <Images className="h-16 w-16 text-muted-foreground opacity-20 mb-6" />
             <p className="text-muted-foreground font-headline text-2xl italic">The visual archive is currently quiet.</p>
             <p className="text-xs uppercase tracking-widest text-muted-foreground mt-2">Initialize your first photographic set to begin asset management.</p>
             <Button variant="link" className="text-primary mt-4" onClick={() => setIsAddDialogOpen(true)}>Define First Set</Button>
          </div>
        )}
      </div>

      <Dialog open={isAddDialogOpen || !!editingGallery} onOpenChange={(o) => { if(!o) { setIsAddDialogOpen(false); setEditingGallery(null); } }}>
        <DialogContent className="sm:max-w-4xl rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden flex flex-col h-[85vh] bg-background">
          <div className="px-10 py-4 border-b shrink-0">
             <DialogHeader className="text-left">
                <DialogTitle className="text-2xl font-headline">{editingGallery ? 'Refine Photographic Set' : 'Register New Visual Asset'}</DialogTitle>
                <DialogDescription className="text-[10px] uppercase tracking-[0.2em] font-black text-muted-foreground/60">Multi-Perspective Product Archiving</DialogDescription>
             </DialogHeader>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSaveGallery)} className="flex flex-col flex-1 overflow-hidden">
               <ScrollArea className="flex-1 px-10 custom-scrollbar">
                  <div className="space-y-10 py-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       <FormField control={form.control} name="productName" render={({ field }) => (
                         <FormItem>
                            <FormLabel className="uppercase text-[10px] font-black tracking-widest text-muted-foreground">Target Identity</FormLabel>
                            <Tabs value={identityMode} onValueChange={(v: any) => setIdentityMode(v)} className="w-full">
                               <TabsList className="grid w-full grid-cols-2 bg-muted/30 h-9 rounded-xl p-1 mb-2">
                                  <TabsTrigger value="existing" className="rounded-lg text-[9px] uppercase font-bold">From Portfolio</TabsTrigger>
                                  <TabsTrigger value="new" className="rounded-lg text-[9px] uppercase font-bold">Manual Entry</TabsTrigger>
                               </TabsList>
                               <TabsContent value="existing" className="mt-0">
                                  <Select 
                                    onValueChange={(val) => {
                                      const prod = portfolioProducts.find(p => p.name === val);
                                      field.onChange(val);
                                      if (prod) {
                                          form.setValue('productId', prod.id);
                                          if (!form.getValues('mainImage')) form.setValue('mainImage', prod.imageUrls?.[0] || '');
                                      }
                                    }} 
                                    defaultValue={field.value} 
                                    value={field.value}
                                  >
                                     <FormControl>
                                        <SelectTrigger className="h-12 rounded-xl border-stone-200">
                                           <SelectValue placeholder="Select existing product..." />
                                        </SelectTrigger>
                                     </FormControl>
                                     <SelectContent>
                                        {galleryIdentities.map(name => <SelectItem key={name} value={name}>{name}</SelectItem>)}
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
                    </div>

                    <div className="space-y-6">
                        <h3 className="uppercase text-[10px] font-black tracking-widest text-primary flex items-center gap-2">
                           <Sparkles className="h-3 w-3" /> Artisan Perspectives
                        </h3>
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
                        <p className="text-[9px] text-stone-500 font-medium italic border-l-2 border-primary/20 pl-4">
                           Capture the detail, tempering, and snap of your creation. High-fidelity WebP/JPEG supported.
                        </p>
                    </div>
                  </div>
               </ScrollArea>

               <div className="px-10 py-6 border-t shrink-0 flex items-center justify-end gap-6 bg-background">
                  <DialogClose asChild>
                    <Button type="button" variant="secondary" className="h-12 px-8 rounded-xl font-bold uppercase text-[10px] tracking-widest">Discard</Button>
                  </DialogClose>
                  <Button type="submit" disabled={isSaving} className="h-12 px-12 rounded-xl shadow-2xl shadow-primary/20 font-bold uppercase text-[10px] tracking-widest min-w-[220px]">
                    {isSaving ? <Loader2 className="mr-3 h-4 w-4 animate-spin" /> : null}
                    Commit photographic set
                  </Button>
               </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewingImage} onOpenChange={() => setViewingImage(null)}>
        <DialogContent className="sm:max-w-4xl p-0 border-none bg-black overflow-hidden rounded-[2.5rem]">
           <DialogHeader className="sr-only"><DialogTitle>Image Preview</DialogTitle></DialogHeader>
           {viewingImage && (
             <div className="relative aspect-video w-full">
                <Image src={viewingImage} alt="High resolution preview" fill className="object-contain" />
                <button 
                  onClick={() => setViewingImage(null)}
                  className="absolute top-6 right-6 h-12 w-12 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md flex items-center justify-center text-white"
                >
                  <X className="h-6 w-6" />
                </button>
             </div>
           )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!itemToDelete} onOpenChange={(o) => { if(!o) { setItemToDelete(null); setDeleteInput(''); } }}>
        <DialogContent className="sm:max-w-md rounded-[2.5rem] border-none shadow-2xl overflow-hidden p-0">
          <div className="bg-destructive/10 p-8 border-b border-destructive/20">
            <DialogHeader>
              <DialogTitle className="text-2xl font-headline flex items-center gap-3 text-destructive">
                <ShieldAlert className="h-8 w-8" />
                Confirm Deletion
              </DialogTitle>
              <DialogDescription className="text-stone-600 font-medium">
                Are you sure you want to permanently remove visual set for <strong className="text-stone-900">{itemToDelete?.productName}</strong>?
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="p-10 space-y-6">
            <div className="space-y-4">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400">Security Verification</Label>
              <p className="text-xs text-stone-500 italic">Type the word <span className="font-bold text-destructive underline">delete</span> manually to authorize removal.</p>
              <Input 
                placeholder="Type here..." 
                value={deleteInput}
                onChange={(e) => setDeleteInput(e.target.value)}
                className="h-14 rounded-2xl border-2 border-stone-200 focus:border-destructive/40 focus:ring-destructive/10 text-center text-lg font-bold tracking-widest"
              />
            </div>
            <div className="flex gap-4">
               <Button variant="ghost" onClick={() => setItemToDelete(null)} className="flex-1 h-12 rounded-xl font-bold uppercase text-[10px] tracking-widest" disabled={isDeleting}>Abort</Button>
               <Button 
                variant="destructive" 
                className="flex-2 px-10 h-12 rounded-xl font-bold uppercase text-[10px] tracking-widest shadow-xl shadow-destructive/20" 
                disabled={deleteInput.toLowerCase() !== 'delete' || isDeleting}
                onClick={confirmDelete}
               >
                 {isDeleting ? <Loader2 className="animate-spin h-4 w-4" /> : 'Final Destroy'}
               </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}