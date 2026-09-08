
'use client';

import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Star, 
  ArrowLeft, 
  Camera, 
  Upload, 
  Loader2, 
  CheckCircle2, 
  Sparkles,
  Heart,
  X,
  Languages,
  MapPin,
  Calendar,
  Package
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Logo } from '@/components/logo';
import { useFirestore, useCollection } from '@/firebase';
import { collection, doc, setDoc } from 'firebase/firestore';
import type { Product } from '@/lib/types';
import { cn } from '@/lib/utils';

const testimonialFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  city: z.string().min(2, 'City is required'),
  country: z.string().min(2, 'Country is required'),
  language: z.enum(['en', 'bn', 'hi']).default('en'),
  rating: z.number().min(1).max(5),
  testimonial: z.string().min(10, 'Story must be at least 10 characters').max(500, 'Story too long (max 500 chars)'),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  occasion: z.string().optional(),
  productId: z.string().optional(),
  photoUrl: z.string().optional(),
});

type TestimonialFormValues = z.infer<typeof testimonialFormSchema>;

export default function ShareExperiencePage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [photoPreview, setPhotoUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { toast } = useToast();
  const firestore = useFirestore();
  const productsQuery = React.useMemo(() => (firestore ? collection(firestore, 'products') : null), [firestore]);
  const { data: products } = useCollection<Product>(productsQuery);

  const form = useForm<TestimonialFormValues>({
    resolver: zodResolver(testimonialFormSchema),
    defaultValues: {
      language: 'en',
      rating: 5,
      name: '',
      city: '',
      country: 'India',
      testimonial: '',
      photoUrl: '',
    }
  });

  const watchRating = form.watch('rating');

  const optimizeImage = (dataUrl: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 400;
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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast({ variant: 'destructive', title: 'File too large', description: 'Maximum photo size is 2MB.' });
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const optimized = await optimizeImage(event.target?.result as string);
      setPhotoUrl(optimized);
      form.setValue('photoUrl', optimized);
    };
    reader.readAsDataURL(file);
  };

  const onSubmit = async (values: TestimonialFormValues) => {
    if (!firestore) return;
    setIsSubmitting(true);

    const id = `TEST-${Date.now()}`;
    const product = products?.find(p => p.id === values.productId);
    
    const data = {
      ...values,
      id,
      productName: product?.name || '',
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await setDoc(doc(firestore, 'testimonials', id), data);
      setIsSuccess(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e) {
      toast({ variant: 'destructive', title: 'Submission Failed', description: 'Could not save your experience. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-6 text-center space-y-8 animate-in fade-in duration-1000">
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", damping: 12 }}
          className="h-32 w-32 bg-green-100 rounded-full flex items-center justify-center shadow-inner"
        >
          <CheckCircle2 className="h-16 w-16 text-green-600" />
        </motion.div>
        <div className="space-y-4 max-w-md">
          <h1 className="text-4xl font-bold font-headline text-stone-900">Thank you for sharing the sweetness!</h1>
          <p className="text-stone-500 text-lg leading-relaxed">
            Your Roseberry moment has been received. Our artisans are reviewing it now to join our gallery of patron stories.
          </p>
        </div>
        <Button asChild size="lg" className="h-14 px-12 rounded-full shadow-xl shadow-primary/20">
          <Link href="/">Return to Boutique</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 font-body relative overflow-x-hidden">
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-0 bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')]"></div>
      
      <header className="sticky top-0 z-50 w-full border-b bg-white/70 backdrop-blur-xl px-6 h-20 flex items-center justify-between shadow-sm">
        <Link href="/" className="flex items-center gap-3 group">
          <ArrowLeft className="h-5 w-5 text-stone-400 group-hover:text-primary transition-colors" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400">Back</span>
        </Link>
        <Logo className="h-10 w-auto" />
        <div className="w-10" /> {/* Spacer */}
      </header>

      <main className="max-w-4xl mx-auto py-20 px-6 relative z-10">
        <div className="text-center space-y-6 mb-16">
          <Badge className="bg-primary/10 text-primary border-none px-6 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.4em] shadow-sm">
            <Sparkles className="h-3.5 w-3.5 mr-2 inline" /> Share Your Sweet Experience
          </Badge>
          <h1 className="text-5xl md:text-7xl font-bold font-headline text-stone-900 tracking-tight leading-tight">
            Tell us about your <br /> Roseberry Moment
          </h1>
          <p className="text-stone-500 text-lg md:text-xl font-light max-w-2xl mx-auto italic">
            Every creation is handmade with love. We'd be honored to hear your story.
          </p>
        </div>

        <Card className="rounded-[3rem] border-none shadow-2xl overflow-hidden bg-white">
          <CardContent className="p-10 md:p-16">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-12">
                
                {/* Language Selection */}
                <div className="flex flex-col md:flex-row gap-8 items-center justify-between border-b pb-12 border-dashed">
                    <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                           <Languages className="h-3 w-3" /> Dialect Preference
                        </p>
                        <p className="text-xs text-stone-400 italic">Choose your preferred writing script.</p>
                    </div>
                    <FormField control={form.control} name="language" render={({ field }) => (
                      <div className="flex bg-stone-50 p-1.5 rounded-2xl border">
                        {[
                          { val: 'en', label: 'English' },
                          { val: 'bn', label: 'বাংলা' },
                          { val: 'hi', label: 'हिन्दी' }
                        ].map(lang => (
                          <button
                            key={lang.val}
                            type="button"
                            onClick={() => field.onChange(lang.val)}
                            className={cn(
                              "px-6 py-2.5 rounded-xl text-xs font-bold transition-all",
                              field.value === lang.val ? "bg-white text-primary shadow-sm ring-1 ring-stone-200" : "text-stone-400 hover:text-stone-600"
                            )}
                          >
                            {lang.label}
                          </button>
                        ))}
                      </div>
                    )} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                   <div className="space-y-10">
                      <FormField control={form.control} name="name" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="uppercase text-[10px] font-black tracking-widest text-muted-foreground">Legal Name</FormLabel>
                          <FormControl><Input className="h-14 rounded-2xl border-stone-200" placeholder="Artisan patron name" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />

                      <div className="grid grid-cols-2 gap-6">
                        <FormField control={form.control} name="city" render={({ field }) => (
                            <FormItem>
                            <FormLabel className="uppercase text-[10px] font-black tracking-widest text-muted-foreground flex items-center gap-1.5"><MapPin className="h-2.5 w-2.5" /> City</FormLabel>
                            <FormControl><Input className="h-14 rounded-2xl border-stone-200" placeholder="Kolkata" {...field} /></FormControl>
                            <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="country" render={({ field }) => (
                            <FormItem>
                            <FormLabel className="uppercase text-[10px] font-black tracking-widest text-muted-foreground">Country</FormLabel>
                            <FormControl><Input className="h-14 rounded-2xl border-stone-200" {...field} /></FormControl>
                            <FormMessage />
                            </FormItem>
                        )} />
                      </div>

                      <div className="space-y-4">
                        <FormLabel className="uppercase text-[10px] font-black tracking-widest text-primary flex items-center gap-2">
                           <Star className="h-3 w-3 fill-current" /> Star Rating
                        </FormLabel>
                        <FormField control={form.control} name="rating" render={({ field }) => (
                          <div className="flex gap-4">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                type="button"
                                onClick={() => field.onChange(star)}
                                className="group relative"
                              >
                                <Star className={cn(
                                  "h-10 w-10 transition-all duration-300",
                                  field.value >= star ? "fill-amber-500 text-amber-500 scale-110 drop-shadow-xl" : "text-stone-200 hover:text-amber-200"
                                )} />
                              </button>
                            ))}
                          </div>
                        )} />
                      </div>
                   </div>

                   <div className="space-y-8 flex flex-col justify-between">
                      <div className="space-y-4">
                        <FormLabel className="uppercase text-[10px] font-black tracking-widest text-muted-foreground flex justify-between">
                           Patron Portrait
                           {photoPreview && <button onClick={() => { setPhotoUrl(null); form.setValue('photoUrl', ''); }} className="text-rose-500 hover:text-rose-700 flex items-center gap-1"><X className="h-3 w-3" /> Remove</button>}
                        </FormLabel>
                        <div 
                           onClick={() => fileInputRef.current?.click()}
                           className={cn(
                              "aspect-video rounded-[2rem] border-4 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all duration-500 relative overflow-hidden group",
                              photoPreview ? "border-stone-100 bg-stone-50" : "border-stone-100 hover:border-primary/30 hover:bg-stone-50"
                           )}
                        >
                           {photoPreview ? (
                              <Image src={photoPreview} alt="Preview" fill className="object-cover" />
                           ) : (
                              <div className="flex flex-col items-center gap-3 text-stone-400 group-hover:text-primary">
                                 <Camera className="h-8 w-8" />
                                 <span className="text-[10px] font-bold uppercase tracking-widest">Select Photo</span>
                              </div>
                           )}
                           <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-6">
                        <FormField control={form.control} name="occasion" render={({ field }) => (
                            <FormItem>
                                <FormLabel className="uppercase text-[10px] font-black tracking-widest text-muted-foreground flex items-center gap-1.5"><Calendar className="h-2.5 w-2.5" /> Occasion</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl><SelectTrigger className="h-14 rounded-2xl"><SelectValue placeholder="Select context" /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        {['Birthday', 'Anniversary', 'Wedding', 'Festival', 'Corporate Gifting', 'Gift', 'Personal Treat', 'Other'].map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="productId" render={({ field }) => (
                            <FormItem>
                                <FormLabel className="uppercase text-[10px] font-black tracking-widest text-muted-foreground flex items-center gap-1.5"><Package className="h-2.5 w-2.5" /> Selection</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl><SelectTrigger className="h-14 rounded-2xl"><SelectValue placeholder="Artisan Collection" /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        {products?.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </FormItem>
                        )} />
                      </div>
                   </div>
                </div>

                <FormField control={form.control} name="testimonial" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="uppercase text-[10px] font-black tracking-widest text-primary flex items-center gap-2">
                       <Heart className="h-3 w-3 text-rose-500" /> Your Artisan Story
                    </FormLabel>
                    <FormControl><Textarea className={cn("rounded-[2rem] min-h-[200px] text-lg p-8 border-stone-200 resize-none", field.value.length > 0 && "bg-stone-50/50")} placeholder="Tell us about the texture, the snap, and the joy..." {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <div className="pt-10 flex flex-col items-center space-y-8">
                   <Button 
                      type="submit" 
                      disabled={isSubmitting} 
                      className="w-full md:w-auto h-20 px-16 text-xl font-bold rounded-3xl shadow-2xl shadow-primary/30 transition-all hover:scale-105 active:scale-95 group"
                   >
                      {isSubmitting ? (
                        <Loader2 className="mr-4 h-6 w-6 animate-spin" />
                      ) : (
                        <Sparkles className="mr-4 h-6 w-6" />
                      )}
                      SHARE MY EXPERIENCE
                   </Button>
                   <p className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-300">Certified Artisan Engagement</p>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </main>

      <footer className="py-20 text-center space-y-8 border-t">
        <Logo className="h-10 w-auto mx-auto opacity-30 grayscale" />
        <p className="text-stone-400 text-xs font-bold uppercase tracking-widest">Handmade with love in Kolkata • &copy; {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}
