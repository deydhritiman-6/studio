'use client';

import React, { useState, useMemo, useEffect } from 'react';
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
  PartyPopper, 
  PlusCircle, 
  Loader2, 
  Edit, 
  Trash2, 
  Save, 
  Calendar,
  Image as ImageIcon,
  Upload,
  RefreshCw,
  Search,
  CheckCircle2,
  X,
  ShieldCheck
} from 'lucide-react';
import Image from 'next/image';
import { useCollection, useFirestore } from '@/firebase';
import { collection, doc, setDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { OccasionMessage } from '@/lib/types';

const occasionSchema = z.object({
  title: z.string().min(1, 'Occasion title is required'),
  date: z.string().min(1, 'Date is required'),
  message: z.string().min(1, 'Message is required'),
  imageUrl: z.string().min(1, 'Image is required'),
  isActive: z.boolean().default(true),
});

type OccasionFormValues = z.infer<typeof occasionSchema>;

export default function OccasionMessagesPage() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingOccasion, setEditingOccasion] = useState<OccasionMessage | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const occasionsQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'occasions'), orderBy('date', 'desc'));
  }, [firestore]);

  const { data: occasions, loading } = useCollection<OccasionMessage>(occasionsQuery);

  const form = useForm<OccasionFormValues>({
    resolver: zodResolver(occasionSchema),
    defaultValues: {
      title: '',
      date: '',
      message: '',
      imageUrl: '',
      isActive: true,
    },
  });

  useEffect(() => {
    if (editingOccasion) {
      form.reset({
        title: editingOccasion.title,
        date: editingOccasion.date,
        message: editingOccasion.message,
        imageUrl: editingOccasion.imageUrl,
        isActive: editingOccasion.isActive,
      });
    } else {
      form.reset({
        title: '',
        date: '',
        message: '',
        imageUrl: '',
        isActive: true,
      });
    }
  }, [editingOccasion, form]);

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
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.src = dataUrl;
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const optimized = await optimizeImage(event.target?.result as string);
      form.setValue('imageUrl', optimized);
    };
    reader.readAsDataURL(file);
  };

  const onSave = async (values: OccasionFormValues) => {
    if (!firestore) return;
    setIsSaving(true);

    const id = editingOccasion?.id || `OCC-${Date.now()}`;
    const occasionRef = doc(firestore, 'occasions', id);
    const now = new Date().toISOString();
    
    const data = {
      ...values,
      id,
      updatedAt: now,
      createdAt: editingOccasion?.createdAt || now,
    };

    setDoc(occasionRef, data)
      .then(() => {
        toast({ title: editingOccasion ? 'Occasion Refined' : 'Occasion Registered' });
        setIsDialogOpen(false);
        setEditingOccasion(null);
      })
      .catch(() => toast({ variant: 'destructive', title: 'Action Failed' }))
      .finally(() => setIsSaving(false));
  };

  const handleDelete = async (id: string) => {
    if (!firestore || !window.confirm('Are you sure you want to permanently remove this occasion message?')) return;
    deleteDoc(doc(firestore, 'occasions', id))
      .then(() => toast({ title: 'Occasion Removed' }))
      .catch(() => toast({ variant: 'destructive', title: 'Action Failed' }));
  };

  const filteredOccasions = useMemo(() => {
    if (!occasions) return [];
    return occasions.filter(o => o.title.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [occasions, searchTerm]);

  return (
    <>
      <PageHeader 
        title="Occasion Messages" 
        actions={
          <Button onClick={() => { setEditingOccasion(null); setIsDialogOpen(true); }} className="rounded-xl shadow-xl shadow-primary/20">
            <PlusCircle className="mr-2 h-4 w-4" /> Schedule Occasion
          </Button>
        }
      />

      <Card className="rounded-[2rem] border-none shadow-xl overflow-hidden">
        <CardHeader className="p-10 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-muted/30">
          <div className="space-y-1">
            <CardTitle className="text-3xl font-headline flex items-center gap-3">
              <PartyPopper className="h-8 w-8 text-primary" />
              Festive Calendar
            </CardTitle>
            <CardDescription>Manage your artisanal greetings for festivals and special occasions.</CardDescription>
          </div>
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search occasions..." 
              className="pl-10 h-11 rounded-xl border-none shadow-inner" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
           {loading ? (
             <div className="p-20 text-center"><Loader2 className="animate-spin h-10 w-10 mx-auto text-primary" /></div>
           ) : filteredOccasions.length > 0 ? (
             <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/10 border-b">
                    <tr className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                      <th className="p-8 text-left">Occasion</th>
                      <th className="p-8 text-left">Scheduled Date</th>
                      <th className="p-8 text-center">Lifecycle</th>
                      <th className="p-8 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOccasions.map((o) => (
                      <tr key={o.id} className="group hover:bg-muted/5 border-b last:border-0 transition-colors">
                        <td className="p-8">
                          <div className="flex items-center gap-6">
                            <div className="h-16 w-16 relative rounded-2xl overflow-hidden shadow-md border-2 border-white">
                              <Image src={o.imageUrl} alt="" fill className="object-cover" />
                            </div>
                            <div>
                              <p className="font-bold text-lg leading-none mb-1">{o.title}</p>
                              <p className="text-xs text-muted-foreground italic line-clamp-1">"{o.message}"</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-8">
                          <div className="flex items-center gap-2 text-stone-600">
                             <Calendar className="h-4 w-4 text-primary opacity-60" />
                             <span className="font-bold text-sm">{o.date}</span>
                          </div>
                        </td>
                        <td className="p-8 text-center">
                          <Badge variant={o.isActive ? "default" : "secondary"} className={cn("rounded-full uppercase text-[8px] tracking-widest px-3", o.isActive ? "bg-green-600" : "bg-stone-200")}>
                            {o.isActive ? 'Active' : 'Offline'}
                          </Badge>
                        </td>
                        <td className="p-8 text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => { setEditingOccasion(o); setIsDialogOpen(true); }} className="rounded-xl hover:bg-primary/10 hover:text-primary"><Edit className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(o.id)} className="rounded-xl hover:bg-destructive/10 hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
             </div>
           ) : (
             <div className="py-32 text-center space-y-4">
                <PartyPopper className="h-16 w-16 mx-auto text-stone-200" />
                <p className="font-headline text-2xl italic text-stone-400">The festive calendar is empty.</p>
                <Button variant="outline" onClick={() => setIsDialogOpen(true)} className="rounded-xl">Schedule New Occasion</Button>
             </div>
           )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={(o) => { if(!o) { setIsDialogOpen(false); setEditingOccasion(null); } }}>
        <DialogContent className="sm:max-w-xl rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl flex flex-col h-[85vh] bg-background gap-0">
          <div className="bg-stone-900 text-white p-8 shrink-0 flex items-center justify-between">
            <DialogHeader className="text-left">
              <DialogTitle className="text-3xl font-headline">{editingOccasion ? 'Refine Occasion' : 'Schedule Greeting'}</DialogTitle>
              <DialogDescription className="text-[10px] uppercase tracking-[0.2em] font-black text-stone-500">Festive Artisan Configuration</DialogDescription>
            </DialogHeader>
            <DialogClose asChild>
              <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full hover:bg-white/10 text-white">
                <X className="h-5 w-5" />
              </Button>
            </DialogClose>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSave)} className="flex flex-col flex-1 overflow-hidden min-h-0">
               <ScrollArea className="flex-1 w-full">
                  <div className="px-10 py-10 space-y-10">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <FormField control={form.control} name="title" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="uppercase text-[10px] font-black tracking-widest text-muted-foreground">Event Title</FormLabel>
                            <FormControl>
                              <Input className="h-12 rounded-xl" placeholder="e.g. Diwali Greeting" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="date" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="uppercase text-[10px] font-black tracking-widest text-muted-foreground">Occasion Date</FormLabel>
                            <FormControl>
                              <Input type="date" className="h-12 rounded-xl" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                     </div>

                     <FormField control={form.control} name="message" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="uppercase text-[10px] font-black tracking-widest text-muted-foreground">Artisan Greeting Text</FormLabel>
                          <FormControl>
                            <Textarea className="rounded-xl min-h-[100px]" placeholder="Wishing our patrons a sweet celebration..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                     )} />

                     <div className="space-y-4">
                        <FormLabel className="uppercase text-[10px] font-black tracking-widest text-muted-foreground">Visual Asset</FormLabel>
                        <div 
                          className="aspect-video relative rounded-[2rem] overflow-hidden border-2 border-dashed border-stone-200 bg-muted/20 group cursor-pointer" 
                          onClick={() => document.getElementById('occ-upload')?.click()}
                        >
                           {form.watch('imageUrl') ? (
                             <Image src={form.watch('imageUrl')} alt="" fill className="object-cover" />
                           ) : (
                             <div className="h-full w-full flex flex-col items-center justify-center text-stone-400 gap-2">
                                <Upload className="h-8 w-8" />
                                <span className="text-[10px] font-bold uppercase tracking-widest">Upload Asset</span>
                             </div>
                           )}
                           <input id="occ-upload" type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                        </div>
                        {form.formState.errors.imageUrl && <p className="text-xs text-destructive font-bold">{form.formState.errors.imageUrl.message}</p>}
                     </div>

                     <FormField control={form.control} name="isActive" render={({ field }) => (
                        <FormItem className="flex items-center justify-between p-4 rounded-xl border bg-muted/20">
                          <div className="space-y-0.5">
                            <FormLabel className="text-sm font-bold uppercase">Enabled</FormLabel>
                            <FormDescription className="text-[10px]">Show this message when the date matches.</FormDescription>
                          </div>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                     )} />
                  </div>
               </ScrollArea>

               <div className="p-8 border-t bg-stone-50 shrink-0 flex items-center justify-between">
                  <div className="flex items-center gap-4 text-muted-foreground">
                    <ShieldCheck className="h-5 w-5 text-green-600" />
                    <p className="text-[10px] font-black uppercase tracking-widest">Secure Artisan Sync</p>
                  </div>
                  <div className="flex gap-4">
                    <DialogClose asChild>
                      <Button type="button" variant="ghost" className="h-12 px-8 rounded-xl font-bold uppercase text-[10px]">Discard</Button>
                    </DialogClose>
                    <Button 
                      type="submit" 
                      disabled={isSaving} 
                      className="h-12 px-12 rounded-xl font-bold uppercase text-[10px] shadow-xl shadow-primary/20"
                    >
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
