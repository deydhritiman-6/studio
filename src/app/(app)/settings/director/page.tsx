
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
  Signature
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import Image from 'next/image';

const directorSchema = z.object({
  enabled: z.boolean().default(false),
  name: z.string().min(1, 'Director name is required'),
  designation: z.string().optional().default('Director, Roseberry Chocolate'),
  message: z.string().min(1, 'Message is required'),
  photoUrl: z.string().min(1, 'Director photo is required'),
  signatureUrl: z.string().optional(),
});

type DirectorFormValues = z.infer<typeof directorSchema>;

export default function DirectorSettingsPage() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const [isSaving, setIsSaving] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const signatureInputRef = useRef<HTMLInputElement>(null);

  const settingsRef = useMemo(() => (firestore ? doc(firestore, 'settings', 'director') : null), [firestore]);
  const { data: existingSettings, loading } = useDoc<any>(settingsRef as any);

  const form = useForm<DirectorFormValues>({
    resolver: zodResolver(directorSchema),
    defaultValues: {
      enabled: false,
      name: '',
      designation: 'Director, Roseberry Chocolate',
      message: '',
      photoUrl: '',
      signatureUrl: '',
    }
  });

  useEffect(() => {
    if (existingSettings) {
      form.reset(existingSettings as any);
    }
  }, [existingSettings, form]);

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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'photoUrl' | 'signatureUrl') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const optimized = await optimizeImage(event.target?.result as string, field === 'photoUrl' ? 800 : 400);
      form.setValue(field, optimized, { shouldDirty: true });
      toast({ title: 'Visual Prepared', description: 'Click Synchronize to save permanently.' });
    };
    reader.readAsDataURL(file);
  };

  const onSubmit = async (values: DirectorFormValues) => {
    if (!firestore || !settingsRef) return;
    setIsSaving(true);

    const finalData = {
      ...values,
      updatedAt: new Date().toISOString(),
    };

    setDoc(settingsRef, finalData, { merge: true })
      .then(() => {
        toast({ title: 'Intelligence Synchronized', description: 'Public message has been updated.' });
      })
      .catch(() => {
        toast({ variant: 'destructive', title: 'Update Failed' });
      })
      .finally(() => setIsSaving(false));
  };

  if (loading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin h-10 w-10 text-primary" /></div>;

  return (
    <>
      <PageHeader title="Director Identity Console" actions={
        <Button 
          type="button"
          onClick={form.handleSubmit(onSubmit)} 
          disabled={isSaving} 
          className="h-12 px-8 rounded-xl shadow-xl shadow-primary/20"
        >
          {isSaving ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />}
          Synchronize Intelligence
        </Button>
      } />

      <Form {...form}>
        <form className="space-y-8">
          <ScrollArea className="h-[calc(100vh-200px)] pr-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              <div className="lg:col-span-8 space-y-8">
                <Card className="rounded-[2.5rem] border-none shadow-xl bg-primary/5 border border-primary/20 overflow-hidden">
                  <CardContent className="p-10 flex flex-col sm:flex-row items-center justify-between gap-10">
                    <div className="space-y-2 text-center sm:text-left">
                      <h3 className="text-2xl font-headline font-bold flex items-center gap-3 text-primary justify-center sm:justify-start">
                        <CheckCircle className="h-7 w-7" /> Section Activation
                      </h3>
                      <p className="text-sm text-stone-600 font-medium">Enable or disable the Director's Message section on the public homepage.</p>
                    </div>
                    <FormField control={form.control} name="enabled" render={({ field }) => (
                      <FormItem className="flex items-center gap-8 bg-white p-6 rounded-[2rem] border-2 border-primary/20 shadow-2xl hover:scale-[1.02] transition-transform duration-300">
                        <FormLabel className="text-sm font-black uppercase tracking-[0.2em] m-0 leading-none text-primary cursor-pointer select-none">
                          ENABLE SECTION
                        </FormLabel>
                        <FormControl>
                          <Switch 
                            checked={field.value} 
                            onCheckedChange={field.onChange} 
                            className="w-[56px] h-[30px] data-[state=checked]:bg-primary data-[state=unchecked]:bg-stone-200"
                          />
                        </FormControl>
                      </FormItem>
                    )} />
                  </CardContent>
                </Card>

                <Card className="rounded-[2.5rem] border-none shadow-xl">
                  <CardHeader className="p-10 border-b bg-muted/30">
                    <CardTitle className="text-2xl font-headline flex items-center gap-3">
                      <User className="h-6 w-6 text-primary" /> Personal Intelligence
                    </CardTitle>
                    <CardDescription>Define the core identity details of the Director.</CardDescription>
                  </CardHeader>
                  <CardContent className="p-10 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <FormField control={form.control} name="name" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="uppercase text-[10px] font-black tracking-widest text-muted-foreground">Full Legal Name</FormLabel>
                          <FormControl><Input className="h-12 rounded-xl" placeholder="Director Name" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="designation" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="uppercase text-[10px] font-black tracking-widest text-muted-foreground">Professional Designation</FormLabel>
                          <FormControl><Input className="h-12 rounded-xl" {...field} /></FormControl>
                        </FormItem>
                      )} />
                    </div>
                    <FormField control={form.control} name="message" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="uppercase text-[10px] font-black tracking-widest text-muted-foreground">Director's Narrative</FormLabel>
                        <FormControl><Textarea className="rounded-xl min-h-[200px]" placeholder="Share the artisan philosophy and commitment..." {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </CardContent>
                </Card>
              </div>

              <div className="lg:col-span-4 space-y-8">
                <Card className="rounded-[2.5rem] border-none shadow-xl overflow-hidden">
                  <CardHeader className="p-10 border-b bg-stone-900 text-white">
                    <CardTitle className="text-xl font-headline flex items-center gap-3">
                      <ImageIcon className="h-6 w-6 text-primary" /> Portrait Matrix
                    </CardTitle>
                    <CardDescription className="text-stone-400">Artisan identity visual.</CardDescription>
                  </CardHeader>
                  <CardContent className="p-10 space-y-6">
                    <div 
                      onClick={() => photoInputRef.current?.click()}
                      className={cn(
                        "aspect-[3/4] rounded-[2rem] border-4 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all duration-500 relative overflow-hidden group",
                        form.watch('photoUrl') ? "border-primary/20 bg-stone-50" : "border-stone-100 hover:border-primary/30"
                      )}
                    >
                      {form.watch('photoUrl') ? (
                        <>
                          <Image src={form.watch('photoUrl')} alt="Director Portrait" fill className="object-cover" />
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                            <Button type="button" variant="secondary" size="sm" className="rounded-xl"><RefreshCw className="h-3 w-3 mr-2" /> Replace</Button>
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center gap-3 text-stone-300 group-hover:text-primary text-center px-6">
                          <Upload className="h-8 w-8" />
                          <span className="text-[10px] font-black uppercase tracking-widest leading-relaxed">Upload Director Portrait</span>
                        </div>
                      )}
                      <input ref={photoInputRef} type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'photoUrl')} />
                    </div>
                    {form.formState.errors.photoUrl && <p className="text-xs text-destructive text-center font-bold">{form.formState.errors.photoUrl.message}</p>}
                  </CardContent>
                </Card>

                <Card className="rounded-[2.5rem] border-none shadow-xl overflow-hidden">
                  <CardHeader className="p-8 border-b bg-stone-100">
                    <CardTitle className="text-lg font-headline flex items-center gap-3 text-stone-600">
                      <Signature className="h-5 w-5" /> Artisan Signature
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-8 space-y-6">
                    <div 
                      onClick={() => signatureInputRef.current?.click()}
                      className={cn(
                        "h-24 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all duration-300 relative overflow-hidden group",
                        form.watch('signatureUrl') ? "border-primary/10 bg-white" : "border-stone-100 hover:border-primary/20"
                      )}
                    >
                      {form.watch('signatureUrl') ? (
                        <>
                          <Image src={form.watch('signatureUrl')!} alt="Signature" fill className="object-contain p-4" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <X className="h-5 w-5 text-white" onClick={(e) => { e.stopPropagation(); form.setValue('signatureUrl', ''); }} />
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center gap-2 text-stone-300 group-hover:text-primary">
                          <Upload className="h-4 w-4" />
                          <span className="text-[8px] font-black uppercase tracking-widest">Optional Signature</span>
                        </div>
                      )}
                      <input ref={signatureInputRef} type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'signatureUrl')} />
                    </div>
                  </CardContent>
                </Card>
              </div>

            </div>
          </ScrollArea>
        </form>
      </Form>
    </>
  );
}
