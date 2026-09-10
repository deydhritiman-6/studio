
'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
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
import { useDoc, useFirestore } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { 
  Save, 
  Loader2, 
  User, 
  Image as ImageIcon, 
  Upload, 
  RefreshCw, 
  X, 
  CheckCircle,
  Quote,
  Sparkles
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import Image from 'next/image';

const chocolatierSchema = z.object({
  isVisible: z.boolean().default(false),
  name: z.string().min(1, 'Chocolatier name is required'),
  designation: z.string().min(1, 'Designation is required'),
  description: z.string().min(1, 'Biography is required'),
  imageUrl: z.string().min(1, 'Chocolatier photo is required'),
  quote: z.string().optional().default(''),
});

type ChocolatierFormValues = z.infer<typeof chocolatierSchema>;

export default function ChocolatierManagementPage() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const [isSaving, setIsSaving] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const contentRef = useMemo(() => (firestore ? doc(firestore, 'siteContent', 'chocolatier') : null), [firestore]);
  const { data: existingProfile, loading } = useDoc<any>(contentRef as any);

  const form = useForm<ChocolatierFormValues>({
    resolver: zodResolver(chocolatierSchema),
    defaultValues: {
      isVisible: false,
      name: '',
      designation: 'Master Chocolatier, Roseberry Chocolate',
      description: '',
      imageUrl: '',
      quote: '',
    }
  });

  useEffect(() => {
    if (existingProfile) {
      form.reset(existingProfile as any);
    }
  }, [existingProfile, form]);

  const optimizeImage = (dataUrl: string, maxWidth = 800): Promise<string> => {
    return new Promise((resolve) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const scale = maxWidth / img.width;
        canvas.width = maxWidth;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.src = dataUrl;
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const optimized = await optimizeImage(event.target?.result as string);
      form.setValue('imageUrl', optimized, { shouldDirty: true, shouldValidate: true });
      toast({ title: 'Visual Asset Prepared', description: 'Click Save to synchronize the profile.' });
    };
    reader.readAsDataURL(file);
  };

  const onSubmit = async (values: ChocolatierFormValues) => {
    if (!firestore || !contentRef) return;
    setIsSaving(true);

    const finalData = {
      ...values,
      updatedAt: new Date().toISOString(),
    };

    setDoc(contentRef, finalData, { merge: true })
      .then(() => {
        toast({ title: 'Artisan Matrix Synchronized', description: 'Chocolatier profile has been updated.' });
      })
      .catch(() => {
        toast({ variant: 'destructive', title: 'Action Failed', description: 'Failed to update profile data.' });
      })
      .finally(() => setIsSaving(false));
  };

  if (loading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin h-10 w-10 text-primary" /></div>;

  return (
    <>
      <PageHeader title="Chocolatier Management" actions={
        <Button 
          type="button"
          onClick={form.handleSubmit(onSubmit)} 
          disabled={isSaving} 
          className="h-12 px-8 rounded-xl shadow-xl shadow-primary/20"
        >
          {isSaving ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />}
          Commit Artisan Profile
        </Button>
      } />

      <Form {...form}>
        <form className="space-y-8">
          <ScrollArea className="h-[calc(100vh-200px)] pr-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              <div className="lg:col-span-8 space-y-8">
                <Card className="rounded-[2.5rem] border-none shadow-xl bg-accent/5 border border-accent/20 overflow-hidden">
                  <CardContent className="p-10 flex flex-col sm:flex-row items-center justify-between gap-10">
                    <div className="space-y-2 text-center sm:text-left">
                      <h3 className="text-2xl font-headline font-bold flex items-center gap-3 text-accent justify-center sm:justify-start">
                        <Sparkles className="h-7 w-7" /> Showcase Visibility
                      </h3>
                      <p className="text-sm text-stone-600 font-medium">Control the display of the Chocolatier section on the public website.</p>
                    </div>
                    <FormField control={form.control} name="isVisible" render={({ field }) => (
                      <FormItem className="flex items-center gap-8 bg-white p-6 rounded-[2rem] border-2 border-accent/20 shadow-2xl hover:scale-[1.02] transition-transform duration-300">
                        <FormLabel className="text-sm font-black uppercase tracking-[0.2em] m-0 leading-none text-accent cursor-pointer select-none">
                          SHOW ON WEBSITE
                        </FormLabel>
                        <FormControl>
                          <Switch 
                            checked={field.value} 
                            onCheckedChange={field.onChange} 
                            className="w-[56px] h-[30px] data-[state=checked]:bg-accent data-[state=unchecked]:bg-stone-200"
                          />
                        </FormControl>
                      </FormItem>
                    )} />
                  </CardContent>
                </Card>

                <Card className="rounded-[2.5rem] border-none shadow-xl">
                  <CardHeader className="p-10 border-b bg-muted/30">
                    <CardTitle className="text-2xl font-headline flex items-center gap-3">
                      <User className="h-6 w-6 text-primary" /> Artisan Identity
                    </CardTitle>
                    <CardDescription>Configure the professional profile of the Master Chocolatier.</CardDescription>
                  </CardHeader>
                  <CardContent className="p-10 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <FormField control={form.control} name="name" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="uppercase text-[10px] font-black tracking-widest text-muted-foreground">Full Name</FormLabel>
                          <FormControl><Input className="h-12 rounded-xl" placeholder="Chocolatier Name" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="designation" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="uppercase text-[10px] font-black tracking-widest text-muted-foreground">Designation</FormLabel>
                          <FormControl><Input className="h-12 rounded-xl" placeholder="e.g. Master Chocolatier" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>
                    <FormField control={form.control} name="description" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="uppercase text-[10px] font-black tracking-widest text-muted-foreground">Biography / Description</FormLabel>
                        <FormControl><Textarea className="rounded-xl min-h-[160px]" placeholder="Tell the story of the artisan's journey and craft..." {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="quote" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="uppercase text-[10px] font-black tracking-widest text-muted-foreground flex items-center gap-2"><Quote className="h-3 w-3" /> Optional Personal Quote</FormLabel>
                        <FormControl><Input className="h-12 rounded-xl italic" placeholder="e.g. Chocolate is a language of love..." {...field} /></FormControl>
                      </FormItem>
                    )} />
                  </CardContent>
                </Card>
              </div>

              <div className="lg:col-span-4 space-y-8">
                <Card className="rounded-[2.5rem] border-none shadow-xl overflow-hidden">
                  <CardHeader className="p-10 border-b bg-stone-900 text-white">
                    <CardTitle className="text-xl font-headline flex items-center gap-3">
                      <ImageIcon className="h-6 w-6 text-primary" /> Profile Portrait
                    </CardTitle>
                    <CardDescription className="text-stone-400">Professional artisan imagery.</CardDescription>
                  </CardHeader>
                  <CardContent className="p-10 space-y-6">
                    <div 
                      onClick={() => photoInputRef.current?.click()}
                      className={cn(
                        "aspect-[4/5] rounded-[2rem] border-4 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all duration-500 relative overflow-hidden group",
                        form.watch('imageUrl') ? "border-accent/20 bg-stone-50" : "border-stone-100 hover:border-accent/30"
                      )}
                    >
                      {form.watch('imageUrl') ? (
                        <>
                          <Image src={form.watch('imageUrl')} alt="Portrait Preview" fill className="object-cover" />
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                            <Button type="button" variant="secondary" size="sm" className="rounded-xl"><RefreshCw className="h-3 w-3 mr-2" /> Replace</Button>
                            <Button type="button" variant="destructive" size="sm" className="rounded-xl" onClick={(e) => { e.stopPropagation(); form.setValue('imageUrl', ''); }}><X className="h-3 w-3 mr-2" /> Remove</Button>
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center gap-3 text-stone-300 group-hover:text-accent text-center px-6">
                          <Upload className="h-8 w-8" />
                          <span className="text-[10px] font-black uppercase tracking-widest leading-relaxed">Upload Artisan Photo</span>
                        </div>
                      )}
                      <input ref={photoInputRef} type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                    </div>
                    {form.formState.errors.imageUrl && <p className="text-xs text-destructive text-center font-bold">{form.formState.errors.imageUrl.message}</p>}
                    <p className="text-[9px] text-center text-stone-400 font-bold uppercase tracking-widest italic">Supports JPEG/PNG/WebP. Max 2MB recommended.</p>
                  </CardContent>
                </Card>

                <div className="bg-muted/50 rounded-[2rem] p-8 border-2 border-dashed border-stone-200">
                  <h4 className="text-sm font-headline font-bold mb-2 flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /> Management Tips</h4>
                  <p className="text-[11px] text-stone-500 leading-relaxed">
                    Ensure the biography captures the artisanal nature of Roseberry Chocolate. High-quality, warm portraits perform best for this section.
                  </p>
                </div>
              </div>

            </div>
          </ScrollArea>
        </form>
      </Form>
    </>
  );
}
