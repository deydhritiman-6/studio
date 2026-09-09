'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { 
  Save, 
  Loader2, 
  Building, 
  Mail, 
  Phone, 
  MapPin, 
  ShieldCheck, 
  Globe, 
  CreditCard,
  Instagram,
  Facebook,
  Youtube,
  Twitter,
  Linkedin,
  AlertCircle
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

/**
 * Enhanced Footer Schema with Conditional Validation.
 */
const footerSchema = z.object({
  brand: z.object({
    description: z.string().optional().default(''),
    tagline: z.string().optional().default(''),
  }),
  address: z.object({
    businessName: z.string().min(1, 'Business name is required'),
    line1: z.string().min(1, 'Address line 1 is required'),
    line2: z.string().optional().default(''),
    area: z.string().optional().default(''),
    city: z.string().min(1, 'City is required'),
    state: z.string().min(1, 'State is required'),
    zip: z.string().min(6, 'Pincode must be at least 6 digits').max(10),
    country: z.string().default('India'),
  }),
  contact: z.object({
    phone: z.string().optional().default(''),
    altPhone: z.string().optional().default(''),
    whatsapp: z.string().optional().default(''),
    email: z.string().email('Invalid email format').optional().or(z.literal('')).default(''),
    supportEmail: z.string().email('Invalid support email format').optional().or(z.literal('')).default(''),
  }),
  legal: z.object({
    gstin: z.string().optional().default(''),
    fssaiNumber: z.string().optional().default(''),
    cin: z.string().optional().default(''),
    pan: z.string().optional().default(''),
  }),
  bank: z.object({
    enabled: z.boolean().default(false),
    masked: z.boolean().default(true),
    accountName: z.string().optional().default(''),
    bankName: z.string().optional().default(''),
    accountNumber: z.string().optional().default(''),
    ifsc: z.string().optional().default(''),
    upiId: z.string().optional().default(''),
  }),
  maps: z.object({
    locationName: z.string().optional().default(''),
    mapUrl: z.string().optional().default(''),
    embedUrl: z.string().optional().default(''),
  }),
  social: z.object({
    instagram: z.string().url('Invalid URL').optional().or(z.literal('')).default(''),
    facebook: z.string().url('Invalid URL').optional().or(z.literal('')).default(''),
    youtube: z.string().url('Invalid URL').optional().or(z.literal('')).default(''),
    twitter: z.string().url('Invalid URL').optional().or(z.literal('')).default(''),
    linkedin: z.string().url('Invalid URL').optional().or(z.literal('')).default(''),
  }),
  visibility: z.object({
    showBankDetails: z.boolean().default(false),
    showGST: z.boolean().default(false),
    showFSSAI: z.boolean().default(false),
    showBusinessHours: z.boolean().default(false),
    showMap: z.boolean().default(true),
  }),
}).superRefine((data, ctx) => {
  // If Bank Details are enabled, make primary fields mandatory
  if (data.bank.enabled) {
    if (!data.bank.accountName) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Account name is required when enabled", path: ['bank', 'accountName'] });
    }
    if (!data.bank.bankName) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Bank name is required when enabled", path: ['bank', 'bankName'] });
    }
    if (!data.bank.accountNumber) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Account number is required when enabled", path: ['bank', 'accountNumber'] });
    }
    if (!data.bank.ifsc) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "IFSC code is required when enabled", path: ['bank', 'ifsc'] });
    }
  }

  // If Map Visibility is ON, make embed URL mandatory
  if (data.visibility.showMap) {
    if (!data.maps.embedUrl) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Embed URL is required to display map", path: ['maps', 'embedUrl'] });
    }
  }
});

type FooterFormValues = z.infer<typeof footerSchema>;

// Helper to map fields to tabs for auto-switching
const FIELD_TO_TAB: Record<string, string> = {
  'brand': 'brand',
  'address': 'brand',
  'contact': 'contact',
  'legal': 'legal',
  'bank': 'bank',
  'social': 'social',
  'maps': 'maps',
  'visibility': 'visibility',
};

const FIELD_LABELS: Record<string, string> = {
  'brand.description': 'Brand Description',
  'address.businessName': 'Business Name',
  'address.line1': 'Address Line 1',
  'address.city': 'City',
  'address.state': 'State',
  'address.zip': 'Pincode',
  'contact.email': 'Official Email',
  'contact.supportEmail': 'Support Email',
  'bank.accountName': 'Beneficiary Name',
  'bank.bankName': 'Bank Name',
  'bank.accountNumber': 'Account Number',
  'bank.ifsc': 'IFSC Code',
  'maps.embedUrl': 'Google Maps Embed URL',
  'social.instagram': 'Instagram URL',
  'social.facebook': 'Facebook URL',
  'social.youtube': 'Youtube URL',
  'social.twitter': 'Twitter URL',
  'social.linkedin': 'Linkedin URL',
};

export default function FooterManagementPage() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('brand');

  const settingsRef = useMemo(() => (firestore ? doc(firestore, 'settings', 'footer') : null), [firestore]);
  const { data: existingSettings, loading } = useDoc<any>(settingsRef as any);

  const form = useForm<FooterFormValues>({
    resolver: zodResolver(footerSchema),
    defaultValues: {
      brand: { description: '', tagline: '' },
      address: { businessName: 'Roseberry Chocolate', line1: '', line2: '', area: '', city: 'Kolkata', state: 'West Bengal', zip: '', country: 'India' },
      contact: { phone: '', altPhone: '', whatsapp: '', email: '', supportEmail: '' },
      legal: { gstin: '', fssaiNumber: '', cin: '', pan: '' },
      bank: { enabled: false, masked: true, accountName: '', bankName: '', accountNumber: '', ifsc: '', upiId: '' },
      maps: { locationName: '', mapUrl: '', embedUrl: '' },
      social: { instagram: '', facebook: '', youtube: '', twitter: '', linkedin: '' },
      visibility: { showBankDetails: false, showGST: false, showFSSAI: false, showBusinessHours: false, showMap: true },
    }
  });

  useEffect(() => {
    if (existingSettings) {
      form.reset(existingSettings as any);
    }
  }, [existingSettings, form]);

  const onSubmit = async (values: FooterFormValues) => {
    if (!firestore || !settingsRef) return;
    setIsSaving(true);

    const finalData = {
      ...values,
      updatedAt: new Date().toISOString(),
    };

    setDoc(settingsRef, finalData, { merge: true })
      .then(() => {
        toast({ title: 'Configuration Synchronized', description: 'Public footer has been updated in real-time.' });
      })
      .catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
          path: settingsRef.path,
          operation: 'write',
          requestResourceData: finalData,
        });
        errorEmitter.emit('permission-error', permissionError);
      })
      .finally(() => setIsSaving(false));
  };

  const onInvalid = (errors: any) => {
    const errorPaths = Object.keys(errors);
    if (errorPaths.length === 0) return;

    console.warn('Form Validation Errors:', errors);

    // Get the first error and switch to its tab
    const firstErrorPath = errorPaths[0];
    const topLevelKey = firstErrorPath.split('.')[0];
    const targetTab = FIELD_TO_TAB[topLevelKey] || 'brand';
    setActiveTab(targetTab);

    // List errors in toast
    const errorList = errorPaths.map(path => {
        const label = FIELD_LABELS[path] || path;
        return `• ${label}`;
    }).join('\n');

    toast({ 
      variant: 'destructive', 
      title: 'Validation Error', 
      description: (
        <div className="space-y-2">
            <p>Please fix the following fields in the <strong>{targetTab.toUpperCase()}</strong> section:</p>
            <pre className="text-[10px] font-bold leading-tight">{errorList}</pre>
        </div>
      )
    });
  };

  if (loading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin h-10 w-10 text-primary" /></div>;

  return (
    <>
      <PageHeader title="Footer Architecture" actions={
        <Button 
          type="button"
          onClick={form.handleSubmit(onSubmit, onInvalid)} 
          disabled={isSaving} 
          className="h-12 px-8 rounded-xl shadow-xl shadow-primary/20"
        >
          {isSaving ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />}
          Synchronize Footer
        </Button>
      } />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-7 mb-8 h-12 rounded-2xl bg-muted/50 p-1">
          <TabsTrigger value="brand" className="rounded-xl text-[10px] font-bold uppercase">Identity</TabsTrigger>
          <TabsTrigger value="contact" className="rounded-xl text-[10px] font-bold uppercase">Contact</TabsTrigger>
          <TabsTrigger value="legal" className="rounded-xl text-[10px] font-bold uppercase">Legal</TabsTrigger>
          <TabsTrigger value="bank" className="rounded-xl text-[10px] font-bold uppercase">Financial</TabsTrigger>
          <TabsTrigger value="social" className="rounded-xl text-[10px] font-bold uppercase">Social</TabsTrigger>
          <TabsTrigger value="maps" className="rounded-xl text-[10px] font-bold uppercase">Location</TabsTrigger>
          <TabsTrigger value="visibility" className="rounded-xl text-[10px] font-bold uppercase text-primary">Policy</TabsTrigger>
        </TabsList>

        <Form {...form}>
          <form className="space-y-8" onSubmit={(e) => e.preventDefault()}>
            <ScrollArea className="h-[calc(100vh-250px)] pr-6">
              
              <TabsContent value="brand" className="space-y-8 mt-0">
                <Card className="rounded-[2rem] border-none shadow-xl">
                  <CardHeader className="p-10 border-b bg-muted/30">
                    <CardTitle className="text-2xl font-headline flex items-center gap-3">
                      <Building className="h-6 w-6 text-primary" /> Brand Identity
                    </CardTitle>
                    <CardDescription>Visual and narrative representation in the footer.</CardDescription>
                  </CardHeader>
                  <CardContent className="p-10 space-y-8">
                    <FormField control={form.control} name="brand.tagline" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="uppercase text-[10px] font-black tracking-widest text-muted-foreground">Footer Tagline</FormLabel>
                        <FormControl><Input className="h-12 rounded-xl" placeholder="e.g. Handmade with Love in Kolkata" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="brand.description" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="uppercase text-[10px] font-black tracking-widest text-muted-foreground">About Description</FormLabel>
                        <FormControl><Textarea className="rounded-xl min-h-[120px]" placeholder="Brief narrative about Roseberry Chocolate..." {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </CardContent>
                </Card>

                <Card className="rounded-[2rem] border-none shadow-xl">
                  <CardHeader className="p-10 border-b">
                    <CardTitle className="text-xl font-headline">Operational Headquarters</CardTitle>
                  </CardHeader>
                  <CardContent className="p-10 grid grid-cols-1 md:grid-cols-2 gap-8">
                    <FormField control={form.control} name="address.businessName" render={({ field }) => (
                      <FormItem><FormLabel className="uppercase text-[10px] font-black tracking-widest text-muted-foreground">Registered Entity Name</FormLabel><FormControl><Input className="h-12 rounded-xl" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="address.line1" render={({ field }) => (
                      <FormItem><FormLabel className="uppercase text-[10px] font-black tracking-widest text-muted-foreground">Address Line 1</FormLabel><FormControl><Input className="h-12 rounded-xl" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="address.line2" render={({ field }) => (
                      <FormItem><FormLabel className="uppercase text-[10px] font-black tracking-widest text-muted-foreground">Address Line 2 (Optional)</FormLabel><FormControl><Input className="h-12 rounded-xl" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <div className="grid grid-cols-2 gap-4">
                      <FormField control={form.control} name="address.city" render={({ field }) => (
                        <FormItem><FormLabel className="uppercase text-[10px] font-black tracking-widest text-muted-foreground">City</FormLabel><FormControl><Input className="h-12 rounded-xl" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={form.control} name="address.zip" render={({ field }) => (
                        <FormItem><FormLabel className="uppercase text-[10px] font-black tracking-widest text-muted-foreground">Pincode</FormLabel><FormControl><Input className="h-12 rounded-xl" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="contact" className="space-y-8 mt-0">
                <Card className="rounded-[2rem] border-none shadow-xl">
                  <CardHeader className="p-10 border-b bg-muted/30">
                    <CardTitle className="text-2xl font-headline flex items-center gap-3">
                      <Mail className="h-6 w-6 text-primary" /> Reachability
                    </CardTitle>
                    <CardDescription>Direct communication channels for patrons.</CardDescription>
                  </CardHeader>
                  <CardContent className="p-10 grid grid-cols-1 md:grid-cols-2 gap-10">
                    <FormField control={form.control} name="contact.phone" render={({ field }) => (
                      <FormItem><FormLabel className="uppercase text-[10px] font-black tracking-widest text-muted-foreground">Primary Hotline</FormLabel><FormControl><Input className="h-12 rounded-xl" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="contact.whatsapp" render={({ field }) => (
                      <FormItem><FormLabel className="uppercase text-[10px] font-black tracking-widest text-muted-foreground">WhatsApp Business</FormLabel><FormControl><Input className="h-12 rounded-xl" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="contact.email" render={({ field }) => (
                      <FormItem><FormLabel className="uppercase text-[10px] font-black tracking-widest text-muted-foreground">Official Email</FormLabel><FormControl><Input className="h-12 rounded-xl" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="contact.supportEmail" render={({ field }) => (
                      <FormItem><FormLabel className="uppercase text-[10px] font-black tracking-widest text-muted-foreground">Customer Care Email</FormLabel><FormControl><Input className="h-12 rounded-xl" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="legal" className="space-y-8 mt-0">
                <Card className="rounded-[2rem] border-none shadow-xl">
                  <CardHeader className="p-10 border-b bg-muted/30">
                    <CardTitle className="text-2xl font-headline flex items-center gap-3">
                      <ShieldCheck className="h-6 w-6 text-primary" /> Regulatory Matrix
                    </CardTitle>
                    <CardDescription>Legal registration and certification numbers.</CardDescription>
                  </CardHeader>
                  <CardContent className="p-10 grid grid-cols-1 md:grid-cols-2 gap-10">
                    <FormField control={form.control} name="legal.gstin" render={({ field }) => (
                      <FormItem><FormLabel className="uppercase text-[10px] font-black tracking-widest text-muted-foreground">GSTIN Number (Optional)</FormLabel><FormControl><Input className="h-12 rounded-xl" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="legal.fssaiNumber" render={({ field }) => (
                      <FormItem><FormLabel className="uppercase text-[10px] font-black tracking-widest text-muted-foreground">FSSAI License No. (Optional)</FormLabel><FormControl><Input className="h-12 rounded-xl" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="bank" className="space-y-8 mt-0">
                <Card className="rounded-[2rem] border-none shadow-xl">
                  <CardHeader className="p-10 border-b bg-muted/30">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-2xl font-headline flex items-center gap-3">
                          <CreditCard className="h-6 w-6 text-primary" /> Financial Facilitation
                        </CardTitle>
                        <CardDescription>Bank account details for direct transactions.</CardDescription>
                      </div>
                      <FormField control={form.control} name="bank.enabled" render={({ field }) => (
                        <FormItem className="flex items-center gap-3 space-y-0 p-4 rounded-xl border bg-background shadow-sm">
                           <FormLabel className="text-[10px] font-black uppercase">Enable Component</FormLabel>
                           <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                        </FormItem>
                      )} />
                    </div>
                  </CardHeader>
                  <CardContent className="p-10 space-y-10">
                    {!form.watch('bank.enabled') && (
                        <div className="bg-muted/30 p-6 rounded-2xl border border-dashed flex items-center gap-4 text-muted-foreground">
                            <AlertCircle className="h-5 w-5" />
                            <p className="text-xs font-medium">Bank details are currently disabled and will not be displayed or required.</p>
                        </div>
                    )}
                    <div className={cn("grid grid-cols-1 md:grid-cols-2 gap-8 transition-opacity duration-300", !form.watch('bank.enabled') && "opacity-50 grayscale pointer-events-none")}>
                       <FormField control={form.control} name="bank.accountName" render={({ field }) => (
                        <FormItem><FormLabel className="uppercase text-[10px] font-black tracking-widest text-muted-foreground">Beneficiary Name</FormLabel><FormControl><Input className="h-12 rounded-xl" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={form.control} name="bank.bankName" render={({ field }) => (
                        <FormItem><FormLabel className="uppercase text-[10px] font-black tracking-widest text-muted-foreground">Bank Name</FormLabel><FormControl><Input className="h-12 rounded-xl" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={form.control} name="bank.accountNumber" render={({ field }) => (
                        <FormItem><FormLabel className="uppercase text-[10px] font-black tracking-widest text-muted-foreground">Account Number</FormLabel><FormControl><Input className="h-12 rounded-xl" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={form.control} name="bank.ifsc" render={({ field }) => (
                        <FormItem><FormLabel className="uppercase text-[10px] font-black tracking-widest text-muted-foreground">IFSC Code</FormLabel><FormControl><Input className="h-12 rounded-xl" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="social" className="space-y-8 mt-0">
                <Card className="rounded-[2rem] border-none shadow-xl">
                  <CardHeader className="p-10 border-b bg-muted/30">
                    <CardTitle className="text-2xl font-headline flex items-center gap-3">
                      <Instagram className="h-6 w-6 text-primary" /> Social Presence
                    </CardTitle>
                    <CardDescription>Links to your boutique's official social channels (Optional).</CardDescription>
                  </CardHeader>
                  <CardContent className="p-10 grid grid-cols-1 md:grid-cols-2 gap-10">
                    <FormField control={form.control} name="social.instagram" render={({ field }) => (
                      <FormItem><FormLabel className="uppercase text-[10px] font-black tracking-widest text-muted-foreground">Instagram URL</FormLabel><FormControl><Input className="h-12 rounded-xl" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="social.facebook" render={({ field }) => (
                      <FormItem><FormLabel className="uppercase text-[10px] font-black tracking-widest text-muted-foreground">Facebook URL</FormLabel><FormControl><Input className="h-12 rounded-xl" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="social.linkedin" render={({ field }) => (
                      <FormItem><FormLabel className="uppercase text-[10px] font-black tracking-widest text-muted-foreground">Linkedin URL</FormLabel><FormControl><Input className="h-12 rounded-xl" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="maps" className="space-y-8 mt-0">
                <Card className="rounded-[2rem] border-none shadow-xl">
                  <CardHeader className="p-10 border-b bg-muted/30">
                    <CardTitle className="text-2xl font-headline flex items-center gap-3">
                      <MapPin className="h-6 w-6 text-primary" /> Geospatial Intelligence
                    </CardTitle>
                    <CardDescription>Enable patrons to locate the studio via Google Maps.</CardDescription>
                  </CardHeader>
                  <CardContent className="p-10 space-y-10">
                    {!form.watch('visibility.showMap') && (
                        <div className="bg-muted/30 p-6 rounded-2xl border border-dashed flex items-center gap-4 text-muted-foreground">
                            <AlertCircle className="h-5 w-5" />
                            <p className="text-xs font-medium">Map preview is currently disabled in the Policy tab.</p>
                        </div>
                    )}
                    <FormField control={form.control} name="maps.embedUrl" render={({ field }) => (
                      <FormItem className={cn("transition-opacity duration-300", !form.watch('visibility.showMap') && "opacity-50 pointer-events-none")}>
                        <FormLabel className="uppercase text-[10px] font-black tracking-widest text-muted-foreground">Google Maps Embed URL (Iframe src)</FormLabel>
                        <FormControl><Input className="h-12 rounded-xl" placeholder="https://www.google.com/maps/embed?..." {...field} /></FormControl>
                        <FormDescription className="text-[9px]">Get this from Share &gt; Embed a map on Google Maps.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="visibility" className="space-y-8 mt-0">
                <Card className="rounded-[2rem] border-none shadow-xl overflow-hidden">
                  <CardHeader className="p-10 border-b bg-stone-900 text-white">
                    <CardTitle className="text-2xl font-headline flex items-center gap-3">
                      <Globe className="h-6 w-6 text-primary" /> Global Visibility Policy
                    </CardTitle>
                    <CardDescription className="text-stone-400">Control which dynamic components are exposed to public patrons.</CardDescription>
                  </CardHeader>
                  <CardContent className="p-10 space-y-4">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                          { key: 'showGST', label: 'Display GST Information' },
                          { key: 'showFSSAI', label: 'Display FSSAI License' },
                          { key: 'showBankDetails', label: 'Display Payment Info (Bank/UPI)' },
                          { key: 'showMap', label: 'Display Google Map Preview' },
                        ].map((policy) => (
                          <FormField key={policy.key} control={form.control} name={`visibility.${policy.key}` as any} render={({ field }) => (
                            <FormItem className="flex items-center justify-between p-6 rounded-2xl border bg-muted/10 hover:bg-muted/20 transition-colors">
                              <FormLabel className="text-sm font-bold uppercase tracking-tight cursor-pointer">{policy.label}</FormLabel>
                              <FormControl><Switch checked={field.value} onCheckedChange={(val) => {
                                  field.onChange(val);
                                  // Keep bank enabled in sync with visibility for validation logic
                                  if (policy.key === 'showBankDetails') form.setValue('bank.enabled', val);
                              }} /></FormControl>
                            </FormItem>
                          )} />
                        ))}
                     </div>
                  </CardContent>
                </Card>
              </TabsContent>

            </ScrollArea>
          </form>
        </Form>
      </Tabs>
    </>
  );
}
