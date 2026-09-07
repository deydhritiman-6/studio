
'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { 
  Building, 
  PlusCircle, 
  Loader2, 
  Edit, 
  Trash2, 
  Save, 
  Settings, 
  Image as ImageIcon, 
  Upload, 
  RefreshCw,
  Eye,
  ArrowRight,
  ShieldCheck,
  Search,
  CheckCircle2,
  X
} from 'lucide-react';
import Image from 'next/image';
import { useCollection, useDoc, useFirestore } from '@/firebase';
import { collection, doc, setDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import type { Facility, FacilitiesPageSettings } from '@/lib/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

const facilitySchema = z.object({
  title: z.string().min(1, 'Title is required'),
  caption: z.string().min(1, 'Caption is required'),
  description: z.string().min(1, 'Description is required'),
  imageUrl: z.string().min(1, 'Image is required'),
  order: z.coerce.number().min(0),
  isActive: z.boolean().default(true),
  showOnHomepage: z.boolean().default(true),
});

const settingsSchema = z.object({
  eyebrowText: z.string().min(1),
  title: z.string().min(1),
  subtitle: z.string().min(1),
  description: z.string().min(1),
  heroImageUrl: z.string().min(1),
  homepageTitle: z.string().min(1),
  homepageSubtitle: z.string().min(1),
  homepageDescription: z.string().min(1),
  homepageButtonText: z.string().min(1),
  homepageButtonEnabled: z.boolean().default(true),
  bottomStatement: z.string().min(1),
  bottomDescription: z.string().min(1),
  logoUrl: z.string().optional(),
});

type FacilityFormValues = z.infer<typeof facilitySchema>;
type SettingsFormValues = z.infer<typeof settingsSchema>;

export default function FacilitiesManagerPage() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingFacility, setEditingFacility] = useState<Facility | null>(null);
  const [activeTab, setActiveTab] = useState('list');
  const [searchTerm, setSearchTerm] = useState('');

  const facilitiesQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'facilities'), orderBy('order', 'asc'));
  }, [firestore]);

  const settingsRef = useMemo(() => {
    if (!firestore) return null;
    return doc(firestore, 'settings', 'facilities');
  }, [firestore]);

  const { data: facilities, loading: facilitiesLoading } = useCollection<Facility>(facilitiesQuery);
  const { data: facilitiesSettings, loading: settingsLoading } = useDoc<FacilitiesPageSettings>(settingsRef as any);

  const facilityForm = useForm<FacilityFormValues>({
    resolver: zodResolver(facilitySchema),
    defaultValues: {
      title: '',
      caption: '',
      description: '',
      imageUrl: '',
      order: 0,
      isActive: true,
      showOnHomepage: true,
    },
  });

  const settingsForm = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      eyebrowText: 'INSIDE',
      title: 'Inside Roseberry Chocolate',
      subtitle: 'A Journey of Care, Craft and Commitment',
      description: 'From the finest ingredients to the final delivery, every step at Roseberry Chocolate is handled with passion, precision and care.',
      heroImageUrl: 'https://picsum.photos/seed/hero/1200/800',
      homepageTitle: 'Inside Roseberry Chocolate',
      homepageSubtitle: 'A Journey of Care, Craft and Commitment',
      homepageDescription: 'From the finest ingredients to the final delivery, every step at Roseberry Chocolate is handled with passion, precision and care.',
      homepageButtonText: 'Explore Our Facilities',
      homepageButtonEnabled: true,
      bottomStatement: 'Crafted with Passion. Handled with Care. Delivered with Love.',
      bottomDescription: 'Every piece tells a story of artisanal excellence and dedication to quality.',
    },
  });

  useEffect(() => {
    if (facilitiesSettings) {
      settingsForm.reset(facilitiesSettings as any);
    }
  }, [facilitiesSettings, settingsForm]);

  useEffect(() => {
    if (editingFacility) {
      facilityForm.reset({
        title: editingFacility.title,
        caption: editingFacility.caption,
        description: editingFacility.description,
        imageUrl: editingFacility.imageUrl,
        order: editingFacility.order,
        isActive: editingFacility.isActive,
        showOnHomepage: editingFacility.showOnHomepage,
      });
    } else {
      facilityForm.reset({
        title: '',
        caption: '',
        description: '',
        imageUrl: '',
        order: (facilities?.length || 0) + 1,
        isActive: true,
        showOnHomepage: true,
      });
    }
  }, [editingFacility, facilityForm, facilities]);

  const optimizeImage = (dataUrl: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1200;
        const scale = MAX_WIDTH / img.width;
        canvas.width = MAX_WIDTH;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.src = dataUrl;
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, formType: 'facility' | 'settings' | 'logo') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const optimized = await optimizeImage(event.target?.result as string);
      if (formType === 'facility') {
        facilityForm.setValue('imageUrl', optimized);
      } else if (formType === 'settings') {
        settingsForm.setValue('heroImageUrl', optimized);
      } else {
        settingsForm.setValue('logoUrl', optimized);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFacilitySubmit = async (values: FacilityFormValues) => {
    if (!firestore) return;
    setIsSaving(true);

    const id = editingFacility?.id || `FAC-${Date.now()}`;
    const facilityRef = doc(firestore, 'facilities', id);
    const data = {
      ...values,
      id,
      updatedAt: new Date().toISOString(),
      createdAt: editingFacility?.createdAt || new Date().toISOString(),
    };

    setDoc(facilityRef, data)
      .then(() => {
        toast({ title: editingFacility ? 'Facility Refined' : 'Facility Registered' });
        setIsAddOpen(false);
        setEditingFacility(null);
      })
      .catch(() => toast({ variant: 'destructive', title: 'Action Failed' }))
      .finally(() => setIsSaving(false));
  };

  const handleSettingsSubmit = async (values: SettingsFormValues) => {
    if (!firestore || !settingsRef) return;
    setIsSaving(true);

    setDoc(settingsRef, { ...values, updatedAt: new Date().toISOString() })
      .then(() => toast({ title: 'Showcase Matrix Updated' }))
      .catch(() => toast({ variant: 'destructive', title: 'Action Failed' }))
      .finally(() => setIsSaving(false));
  };

  const handleDeleteFacility = async (id: string) => {
    if (!firestore || !window.confirm('Are you sure you want to permanently remove this facility profile?')) return;
    deleteDoc(doc(firestore, 'facilities', id))
      .then(() => toast({ title: 'Profile Removed' }))
      .catch(() => toast({ variant: 'destructive', title: 'Action Failed' }));
  };

  const filteredFacilities = useMemo(() => {
    if (!facilities) return [];
    return facilities.filter(f => f.title.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [facilities, searchTerm]);

  return (
    <>
      <PageHeader 
        title="Artisan Facilities Manager" 
        actions={
          <Button onClick={() => { setEditingFacility(null); setIsAddOpen(true); }} className="rounded-xl shadow-xl shadow-primary/20">
            <PlusCircle className="mr-2 h-4 w-4" /> Register Facility
          </Button>
        }
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md mb-8 h-12 rounded-2xl bg-muted/50 p-1">
          <TabsTrigger value="list" className="rounded-xl">Facility Directory</TabsTrigger>
          <TabsTrigger value="settings" className="rounded-xl">Showcase Logic</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-6">
          <Card className="rounded-[2rem] border-none shadow-xl overflow-hidden">
            <CardHeader className="p-10 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-muted/30">
              <div className="space-y-1">
                <CardTitle className="text-3xl font-headline flex items-center gap-3">
                  <Building className="h-8 w-8 text-primary" />
                  Facility Asset Log
                </CardTitle>
                <CardDescription>Visual and narrative specs for internal Roseberry infrastructure.</CardDescription>
              </div>
              <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search infrastructure..." 
                  className="pl-10 h-11 rounded-xl border-none shadow-inner" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
               {facilitiesLoading ? (
                 <div className="p-20 text-center"><Loader2 className="animate-spin h-10 w-10 mx-auto text-primary" /></div>
               ) : filteredFacilities.length > 0 ? (
                 <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-muted/10 border-b">
                        <tr className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                          <th className="p-8 text-left">Identity</th>
                          <th className="p-8 text-left">Classification</th>
                          <th className="p-8 text-center">Order</th>
                          <th className="p-8 text-center">Lifecycle</th>
                          <th className="p-8 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredFacilities.map((f) => (
                          <tr key={f.id} className="group hover:bg-muted/5 border-b last:border-0 transition-colors">
                            <td className="p-8">
                              <div className="flex items-center gap-6">
                                <div className="h-16 w-24 relative rounded-2xl overflow-hidden shadow-md border-2 border-white">
                                  <Image src={f.imageUrl || 'https://picsum.photos/seed/f/100/100'} alt="" fill className="object-cover" />
                                </div>
                                <div>
                                  <p className="font-bold text-lg leading-none mb-1">{f.title}</p>
                                  <p className="text-[10px] uppercase font-black tracking-widest text-primary opacity-60">{f.caption}</p>
                                </div>
                              </div>
                            </td>
                            <td className="p-8 max-w-xs">
                              <p className="text-xs text-muted-foreground line-clamp-2 italic leading-relaxed">"{f.description}"</p>
                            </td>
                            <td className="p-8 text-center">
                              <Badge variant="outline" className="rounded-lg h-10 w-10 flex items-center justify-center font-mono font-bold text-base bg-white shadow-sm">{f.order}</Badge>
                            </td>
                            <td className="p-8 text-center">
                              <div className="flex flex-col items-center gap-2">
                                <Badge variant={f.isActive ? "default" : "secondary"} className={cn("rounded-full uppercase text-[8px] tracking-widest px-3", f.isActive ? "bg-green-600" : "bg-stone-200")}>
                                  {f.isActive ? 'Active' : 'Offline'}
                                </Badge>
                                {f.showOnHomepage && <Badge className="bg-primary/10 text-primary border-none text-[7px] uppercase tracking-tighter">Live on Home</Badge>}
                              </div>
                            </td>
                            <td className="p-8 text-right">
                              <div className="flex justify-end gap-2">
                                <Button variant="ghost" size="icon" onClick={() => { setEditingFacility(f); setIsAddOpen(true); }} className="rounded-xl hover:bg-primary/10 hover:text-primary transition-colors"><Edit className="h-4 w-4" /></Button>
                                <Button variant="ghost" size="icon" onClick={() => handleDeleteFacility(f.id)} className="rounded-xl hover:bg-destructive/10 hover:text-destructive transition-colors"><Trash2 className="h-4 w-4" /></Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                 </div>
               ) : (
                 <div className="py-32 text-center space-y-4">
                    <Building className="h-16 w-16 mx-auto text-stone-200" />
                    <p className="font-headline text-2xl italic text-stone-400">The facility registry is empty.</p>
                    <Button variant="outline" onClick={() => setIsAddOpen(true)} className="rounded-xl">Define Infrastructure</Button>
                 </div>
               )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Form {...settingsForm}>
            <form onSubmit={settingsForm.handleSubmit(handleSettingsSubmit)} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-8 space-y-8">
                <Card className="rounded-[2.5rem] border-none shadow-xl">
                  <CardHeader className="p-10 border-b">
                    <CardTitle className="text-2xl font-headline">Hero Specifications</CardTitle>
                    <CardDescription>Define the public entry point for the showcase.</CardDescription>
                  </CardHeader>
                  <CardContent className="p-10 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <FormField control={settingsForm.control} name="eyebrowText" render={({ field }) => (
                        <FormItem><FormLabel className="uppercase text-[10px] font-black tracking-widest text-muted-foreground">Showcase Eyebrow</FormLabel><FormControl><Input className="rounded-xl h-12" {...field} /></FormControl></FormItem>
                      )} />
                      <FormField control={settingsForm.control} name="title" render={({ field }) => (
                        <FormItem><FormLabel className="uppercase text-[10px] font-black tracking-widest text-muted-foreground">Showcase Title</FormLabel><FormControl><Input className="rounded-xl h-12" {...field} /></FormControl></FormItem>
                      )} />
                    </div>
                    <FormField control={settingsForm.control} name="subtitle" render={({ field }) => (
                      <FormItem><FormLabel className="uppercase text-[10px] font-black tracking-widest text-muted-foreground">Showcase Subtitle</FormLabel><FormControl><Input className="rounded-xl h-12" {...field} /></FormControl></FormItem>
                    )} />
                    <FormField control={settingsForm.control} name="description" render={({ field }) => (
                      <FormItem><FormLabel className="uppercase text-[10px] font-black tracking-widest text-muted-foreground">Showcase Narrative</FormLabel><FormControl><Textarea className="rounded-xl min-h-[100px]" {...field} /></FormControl></FormItem>
                    )} />

                    <div className="space-y-4">
                      <FormLabel className="uppercase text-[10px] font-black tracking-widest text-muted-foreground">Showcase Hero Imagery</FormLabel>
                      <div className="aspect-video relative rounded-3xl overflow-hidden border-2 border-dashed border-stone-200 bg-muted/20 group">
                        <Image src={settingsForm.watch('heroImageUrl')} alt="" fill className="object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <Button type="button" variant="secondary" onClick={() => document.getElementById('hero-upload')?.click()} className="rounded-xl"><RefreshCw className="h-4 w-4 mr-2" /> Replace Asset</Button>
                        </div>
                        <input id="hero-upload" type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'settings')} />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-[2.5rem] border-none shadow-xl">
                  <CardHeader className="p-10 border-b">
                    <CardTitle className="text-2xl font-headline">Landing Preview Logic</CardTitle>
                    <CardDescription>Control the preview component on the main homepage.</CardDescription>
                  </CardHeader>
                  <CardContent className="p-10 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <FormField control={settingsForm.control} name="homepageTitle" render={({ field }) => (
                        <FormItem><FormLabel className="uppercase text-[10px] font-black tracking-widest text-muted-foreground">Preview Title</FormLabel><FormControl><Input className="rounded-xl h-12" {...field} /></FormControl></FormItem>
                      )} />
                      <FormField control={settingsForm.control} name="homepageSubtitle" render={({ field }) => (
                        <FormItem><FormLabel className="uppercase text-[10px] font-black tracking-widest text-muted-foreground">Preview Subtitle</FormLabel><FormControl><Input className="rounded-xl h-12" {...field} /></FormControl></FormItem>
                      )} />
                    </div>
                    <FormField control={settingsForm.control} name="homepageDescription" render={({ field }) => (
                      <FormItem><FormLabel className="uppercase text-[10px] font-black tracking-widest text-muted-foreground">Preview Narrative</FormLabel><FormControl><Textarea className="rounded-xl min-h-[80px]" {...field} /></FormControl></FormItem>
                    )} />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <FormField control={settingsForm.control} name="homepageButtonText" render={({ field }) => (
                        <FormItem><FormLabel className="uppercase text-[10px] font-black tracking-widest text-muted-foreground">CTA Label</FormLabel><FormControl><Input className="rounded-xl h-12" {...field} /></FormControl></FormItem>
                      )} />
                      <FormField control={settingsForm.control} name="homepageButtonEnabled" render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-xl border p-4 bg-muted/20">
                          <div className="space-y-0.5"><FormLabel className="text-sm font-bold uppercase tracking-tight">Enable CTA Button</FormLabel><FormDescription className="text-[10px]">Allow users to navigate from preview.</FormDescription></div>
                          <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                        </FormItem>
                      )} />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="lg:col-span-4 space-y-8">
                <Card className="rounded-[2.5rem] border-none shadow-2xl bg-stone-900 text-white overflow-hidden sticky top-28">
                   <div className="p-10 space-y-10">
                      <div className="space-y-4">
                        <FormLabel className="uppercase text-[10px] font-black tracking-widest text-primary flex items-center gap-2"><Building className="h-3 w-3" /> Showcase Identity</FormLabel>
                        <div className="aspect-square relative rounded-[2rem] overflow-hidden bg-white/5 border border-white/10 group">
                           {settingsForm.watch('logoUrl') ? (
                             <>
                               <Image src={settingsForm.watch('logoUrl')!} alt="Showcase Logo" fill className="object-contain p-8" />
                               <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                  <Button type="button" size="sm" variant="outline" onClick={() => settingsForm.setValue('logoUrl', undefined)} className="rounded-lg text-rose-500 border-rose-500/20">Remove</Button>
                               </div>
                             </>
                           ) : (
                             <div className="h-full w-full flex flex-col items-center justify-center text-stone-500 gap-4">
                                <Building className="h-10 w-10 opacity-20" />
                                <Button type="button" variant="outline" size="sm" onClick={() => document.getElementById('logo-upload')?.click()} className="rounded-xl border-white/10 text-white">Upload Brand Mark</Button>
                                <input id="logo-upload" type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'logo')} />
                             </div>
                           )}
                        </div>
                        <p className="text-[9px] text-center text-stone-500 italic">This logo applies ONLY to the Inside Roseberry showcase.</p>
                      </div>

                      <Separator className="bg-white/5" />

                      <div className="space-y-6">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Artisan Closure</h4>
                        <FormField control={settingsForm.control} name="bottomStatement" render={({ field }) => (
                          <FormItem><FormLabel className="uppercase text-[8px] font-black text-stone-500">Main Statement</FormLabel><FormControl><Input className="bg-white/5 border-none rounded-xl" {...field} /></FormControl></FormItem>
                        )} />
                        <FormField control={settingsForm.control} name="bottomDescription" render={({ field }) => (
                          <FormItem><FormLabel className="uppercase text-[8px] font-black text-stone-500">Narrative Closure</FormLabel><FormControl><Textarea className="bg-white/5 border-none rounded-xl" {...field} /></FormControl></FormItem>
                        )} />
                      </div>

                      <Button type="submit" disabled={isSaving} className="w-full h-16 text-lg font-bold rounded-2xl shadow-2xl shadow-primary/40 transition-all hover:scale-[1.02] active:scale-[0.98]">
                         {isSaving ? <Loader2 className="animate-spin h-6 w-6 mr-2" /> : <Save className="h-6 w-6 mr-2" />}
                         Synchronize Showcase
                      </Button>
                   </div>
                </Card>
              </div>
            </form>
          </Form>
        </TabsContent>
      </Tabs>

      <Dialog open={isAddOpen} onOpenChange={(o) => { if(!o) { setIsAddOpen(false); setEditingFacility(null); } }}>
        <DialogContent className="sm:max-w-3xl rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl flex flex-col h-[85vh] bg-background">
          <div className="bg-stone-900 text-white p-8 shrink-0 flex items-center justify-between">
            <DialogHeader className="text-left">
              <DialogTitle className="text-3xl font-headline">{editingFacility ? 'Refine Asset profile' : 'Register Infrastructure'}</DialogTitle>
              <DialogDescription className="text-[10px] uppercase tracking-[0.2em] font-black text-stone-500">Artisan Facility Specification</DialogDescription>
            </DialogHeader>
          </div>

          <Form {...facilityForm}>
            <form onSubmit={facilityForm.handleSubmit(handleFacilitySubmit)} className="flex flex-col flex-1 overflow-hidden">
               <ScrollArea className="flex-1 px-10 py-10">
                  <div className="space-y-12">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="space-y-8">
                           <FormField control={facilityForm.control} name="title" render={({ field }) => (
                             <FormItem><FormLabel className="uppercase text-[10px] font-black tracking-widest text-muted-foreground">Operational Title</FormLabel><FormControl><Input className="h-12 rounded-xl" placeholder="e.g. Production Unit A" {...field} /></FormControl><FormMessage /></FormItem>
                           )} />
                           <FormField control={facilityForm.control} name="caption" render={({ field }) => (
                             <FormItem><FormLabel className="uppercase text-[10px] font-black tracking-widest text-muted-foreground">Showcase Caption</FormLabel><FormControl><Input className="h-12 rounded-xl" placeholder="e.g. Where the snap happens" {...field} /></FormControl><FormMessage /></FormItem>
                           )} />
                           <FormField control={facilityForm.control} name="description" render={({ field }) => (
                             <FormItem><FormLabel className="uppercase text-[10px] font-black tracking-widest text-muted-foreground">Technical Narrative</FormLabel><FormControl><Textarea className="rounded-xl min-h-[120px]" placeholder="Detailed description of processes and standards..." {...field} /></FormControl><FormMessage /></FormItem>
                           )} />
                        </div>

                        <div className="space-y-8">
                           <div className="space-y-4">
                              <FormLabel className="uppercase text-[10px] font-black tracking-widest text-muted-foreground">Photographic asset</FormLabel>
                              <div className="aspect-[4/3] relative rounded-[2rem] overflow-hidden border-2 border-dashed border-stone-200 bg-muted/20 group cursor-pointer" onClick={() => document.getElementById('fac-upload')?.click()}>
                                 {facilityForm.watch('imageUrl') ? (
                                   <Image src={facilityForm.watch('imageUrl')} alt="" fill className="object-cover" />
                                 ) : (
                                   <div className="h-full w-full flex flex-col items-center justify-center text-stone-400 gap-2">
                                      <Upload className="h-8 w-8" />
                                      <span className="text-[10px] font-bold uppercase">Upload Asset</span>
                                   </div>
                                 )}
                                 <input id="fac-upload" type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'facility')} />
                              </div>
                              {facilityForm.formState.errors.imageUrl && <p className="text-xs text-destructive font-bold">{facilityForm.formState.errors.imageUrl.message}</p>}
                           </div>

                           <div className="grid grid-cols-2 gap-6">
                              <FormField control={facilityForm.control} name="order" render={({ field }) => (
                                <FormItem><FormLabel className="uppercase text-[10px] font-black tracking-widest text-muted-foreground">Visual Order</FormLabel><FormControl><Input type="number" className="h-12 rounded-xl" {...field} /></FormControl></FormItem>
                              )} />
                              <div className="flex flex-col gap-4">
                                 <FormField control={facilityForm.control} name="isActive" render={({ field }) => (
                                   <FormItem className="flex items-center justify-between p-3 rounded-xl border bg-muted/20">
                                      <FormLabel className="text-[10px] font-bold uppercase">Active Status</FormLabel>
                                      <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                   </FormItem>
                                 )} />
                                 <FormField control={facilityForm.control} name="showOnHomepage" render={({ field }) => (
                                   <FormItem className="flex items-center justify-between p-3 rounded-xl border bg-muted/20">
                                      <FormLabel className="text-[10px] font-bold uppercase">Show on Home</FormLabel>
                                      <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                   </FormItem>
                                 )} />
                              </div>
                           </div>
                        </div>
                     </div>
                  </div>
               </ScrollArea>

               <div className="p-8 border-t bg-stone-50 shrink-0 flex items-center justify-between">
                  <div className="flex items-center gap-4 text-muted-foreground">
                    <ShieldCheck className="h-5 w-5 text-green-600" />
                    <p className="text-[10px] font-black uppercase tracking-widest">Secure Artisan Profile Sync</p>
                  </div>
                  <div className="flex gap-4">
                    <DialogClose asChild><Button type="button" variant="ghost" className="h-12 px-8 rounded-xl font-bold uppercase text-[10px]">Discard</Button></DialogClose>
                    <Button type="submit" disabled={isSaving} className="h-12 px-12 rounded-xl font-bold uppercase text-[10px] shadow-xl shadow-primary/20">
                       {isSaving ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                       Commit Spec
                    </Button>
                  </div>
               </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}
