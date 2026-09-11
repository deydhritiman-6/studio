'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
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
  Eye,
  QrCode,
  Upload,
  RefreshCw,
  X,
  ExternalLink,
  PlusCircle,
  Pencil,
  Trash2,
  AlertTriangle
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

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
    udyamNumber: z.string().optional().default(''),
    regulatoryFields: z.array(z.object({
      id: z.string(),
      label: z.string().min(1, 'Label is required'),
      value: z.string().min(1, 'Value is required'),
    })).default([]),
  }),
  bank: z.object({
    accountName: z.string().optional().default(''),
    bankName: z.string().optional().default(''),
    branch: z.string().optional().default(''),
    accountNumber: z.string().optional().default(''),
    ifsc: z.string().optional().default(''),
    upiId: z.string().optional().default(''),
    qrCodeUrl: z.string().optional().default(''),
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
    showGST: z.boolean().default(true),
    showFSSAI: z.boolean().default(true),
    showBusinessHours: z.boolean().default(false),
    showMap: z.boolean().default(true),
  }),
});

type FooterFormValues = z.infer<typeof footerSchema>;

export default function FooterManagementPage() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('brand');
  const qrInputRef = useRef<HTMLInputElement>(null);

  // Field Modal State
  const [isFieldModalOpen, setIsFieldModalOpen] = useState(false);
  const [editingFieldIdx, setEditingFieldIdx] = useState<number | null>(null);
  const [fieldLabel, setFieldLabel] = useState('');
  const [fieldValue, setFieldValue] = useState('');

  // Delete Confirmation State
  const [fieldToDelete, setFieldToDelete] = useState<number | null>(null);

  const settingsRef = useMemo(() => (firestore ? doc(firestore, 'settings', 'footer') : null), [firestore]);
  const { data: existingSettings, loading } = useDoc<any>(settingsRef as any);

  const form = useForm<FooterFormValues>({
    resolver: zodResolver(footerSchema),
    defaultValues: {
      brand: { description: '', tagline: '' },
      address: { 
        businessName: 'Roseberry Chocolate LLP', 
        line1: 'Aashiyana Bhaban, 1A, Roypara-Hatiara Rd', 
        line2: '', 
        area: '', 
        city: 'Kolkata', 
        state: 'West Bengal', 
        zip: '700157', 
        country: 'India' 
      },
      contact: { 
        phone: '+91 85840 22133', 
        altPhone: '', 
        whatsapp: '+91 85858 06077', 
        email: 'roseberrychocolatellp@gmail.com', 
        supportEmail: 'customercare.roseberry@gmail.com' 
      },
      legal: { 
        gstin: '', 
        fssaiNumber: '', 
        cin: '', 
        pan: '', 
        udyamNumber: '',
        regulatoryFields: [],
      },
      bank: { accountName: '', bankName: '', branch: '', accountNumber: '', ifsc: '', upiId: '', qrCodeUrl: '' },
      maps: { locationName: '', mapUrl: '', embedUrl: '' },
      social: { instagram: '', facebook: '', youtube: '', twitter: '', linkedin: '' },
      visibility: { showBankDetails: false, showGST: true, showFSSAI: true, showBusinessHours: false, showMap: true },
    }
  });

  const { fields, append, remove, update } = useFieldArray({
    control: form.control,
    name: "legal.regulatoryFields",
  });

  useEffect(() => {
    if (existingSettings) {
      const data = existingSettings as any;
      
      // Auto-migration logic for existing static fields if dynamic array is empty
      let initialFields = data.legal?.regulatoryFields || [];
      if (initialFields.length === 0) {
        if (data.legal?.gstin) initialFields.push({ id: 'gstin', label: 'GSTIN NUMBER', value: data.legal.gstin });
        if (data.legal?.fssaiNumber) initialFields.push({ id: 'fssai', label: 'FSSAI LICENSE NO.', value: data.legal.fssaiNumber });
        if (data.legal?.udyamNumber) initialFields.push({ id: 'udyam', label: 'UDYAM REGISTRATION NO.', value: data.legal.udyamNumber });
        if (data.legal?.cin) initialFields.push({ id: 'cin', label: 'CIN NUMBER', value: data.legal.cin });
        if (data.legal?.pan) initialFields.push({ id: 'pan', label: 'PAN NUMBER', value: data.legal.pan });
      }

      form.reset({
        brand: {
          description: data.brand?.description ?? '',
          tagline: data.brand?.tagline ?? '',
        },
        address: {
          businessName: data.address?.businessName ?? '',
          line1: data.address?.line1 ?? '',
          line2: data.address?.line2 ?? '',
          area: data.address?.area ?? '',
          city: data.address?.city ?? '',
          state: data.address?.state ?? '',
          zip: data.address?.zip ?? '',
          country: data.address?.country ?? 'India',
        },
        contact: {
          phone: data.contact?.phone ?? '',
          altPhone: data.contact?.altPhone ?? '',
          whatsapp: data.contact?.whatsapp ?? '',
          email: data.contact?.email ?? '',
          supportEmail: data.contact?.supportEmail ?? '',
        },
        legal: {
          gstin: data.legal?.gstin ?? '',
          fssaiNumber: data.legal?.fssaiNumber ?? '',
          cin: data.legal?.cin ?? '',
          pan: data.legal?.pan ?? '',
          udyamNumber: data.legal?.udyamNumber ?? '',
          regulatoryFields: initialFields,
        },
        bank: {
          accountName: data.bank?.accountName ?? '',
          bankName: data.bank?.bankName ?? '',
          branch: data.bank?.branch ?? '',
          accountNumber: data.bank?.accountNumber ?? '',
          ifsc: data.bank?.ifsc ?? '',
          upiId: data.bank?.upiId ?? '',
          qrCodeUrl: data.bank?.qrCodeUrl ?? '',
        },
        maps: {
          locationName: data.maps?.locationName ?? '',
          mapUrl: data.maps?.mapUrl ?? '',
          embedUrl: data.maps?.embedUrl ?? '',
        },
        social: {
          instagram: data.social?.instagram ?? '',
          facebook: data.social?.facebook ?? '',
          youtube: data.social?.youtube ?? '',
          twitter: data.social?.twitter ?? '',
          linkedin: data.social?.linkedin ?? '',
        },
        visibility: {
          showBankDetails: data.visibility?.showBankDetails ?? false,
          showGST: data.visibility?.showGST ?? true,
          showFSSAI: data.visibility?.showFSSAI ?? true,
          showBusinessHours: data.visibility?.showBusinessHours ?? false,
          showMap: data.visibility?.showMap ?? true,
        },
      });
    }
  }, [existingSettings, form]);

  const optimizeImage = (dataUrl: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 500;
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

  const handleQrUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const optimized = await optimizeImage(event.target?.result as string);
      form.setValue('bank.qrCodeUrl', optimized, { shouldDirty: true });
      toast({ title: 'QR Code Prepared', description: 'Click Synchronize Footer to save permanently.' });
    };
    reader.readAsDataURL(file);
  };

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

  const handleOpenAddField = () => {
    setEditingFieldIdx(null);
    setFieldLabel('');
    setFieldValue('');
    setIsFieldModalOpen(true);
  };

  const handleOpenEditField = (index: number) => {
    const field = fields[index];
    setEditingFieldIdx(index);
    setFieldLabel(field.label);
    setFieldValue(field.value);
    setIsFieldModalOpen(true);
  };

  const handleSaveField = () => {
    if (!fieldLabel.trim() || !fieldValue.trim()) {
      toast({ variant: 'destructive', title: 'Data Missing', description: 'Label and Value are both required.' });
      return;
    }

    if (editingFieldIdx !== null) {
      update(editingFieldIdx, { id: fields[editingFieldIdx].id, label: fieldLabel, value: fieldValue });
    } else {
      append({ id: `field-${Date.now()}`, label: fieldLabel, value: fieldValue });
    }

    setIsFieldModalOpen(false);
    toast({ title: editingFieldIdx !== null ? 'Field Updated' : 'Field Added' });
  };

  if (loading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin h-10 w-10 text-primary" /></div>;

  return (
    <>
      <PageHeader title="Footer Architecture" actions={
        <Button 
          type="button"
          onClick={form.handleSubmit(onSubmit, (errors) => {
            console.warn('Footer Form Validation Errors:', errors);
            toast({ variant: 'destructive', title: 'Validation Error', description: 'Please check all tabs for missing or invalid information.' });
          })} 
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
          <form className="space-y-8">
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
                        <FormControl><Input className="h-12 rounded-xl" {...field} value={field.value ?? ''} /></FormControl>
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="brand.description" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="uppercase text-[10px] font-black tracking-widest text-muted-foreground">About Description</FormLabel>
                        <FormControl><Textarea className="rounded-xl min-h-[120px]" {...field} value={field.value ?? ''} /></FormControl>
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
                      <FormItem><FormLabel className="uppercase text-[10px] font-black tracking-widest text-muted-foreground">Registered Entity Name</FormLabel><FormControl><Input className="h-12 rounded-xl" {...field} value={field.value ?? ''} /></FormControl></FormItem>
                    )} />
                    <FormField control={form.control} name="address.line1" render={({ field }) => (
                      <FormItem><FormLabel className="uppercase text-[10px] font-black tracking-widest text-muted-foreground">Address Line 1</FormLabel><FormControl><Input className="h-12 rounded-xl" {...field} value={field.value ?? ''} /></FormControl></FormItem>
                    )} />
                    <div className="grid grid-cols-2 gap-4">
                      <FormField control={form.control} name="address.city" render={({ field }) => (
                        <FormItem><FormLabel className="uppercase text-[10px] font-black tracking-widest text-muted-foreground">City</FormLabel><FormControl><Input className="h-12 rounded-xl" {...field} value={field.value ?? ''} /></FormControl></FormItem>
                      )} />
                      <FormField control={form.control} name="address.zip" render={({ field }) => (
                        <FormItem><FormLabel className="uppercase text-[10px] font-black tracking-widest text-muted-foreground">Pincode</FormLabel><FormControl><Input className="h-12 rounded-xl" {...field} value={field.value ?? ''} /></FormControl></FormItem>
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
                      <FormItem><FormLabel className="uppercase text-[10px] font-black tracking-widest text-muted-foreground">Primary Hotline</FormLabel><FormControl><Input className="h-12 rounded-xl" {...field} value={field.value ?? ''} /></FormControl></FormItem>
                    )} />
                    <FormField control={form.control} name="contact.whatsapp" render={({ field }) => (
                      <FormItem><FormLabel className="uppercase text-[10px] font-black tracking-widest text-muted-foreground">WhatsApp Business</FormLabel><FormControl><Input className="h-12 rounded-xl" {...field} value={field.value ?? ''} /></FormControl></FormItem>
                    )} />
                    <FormField control={form.control} name="contact.email" render={({ field }) => (
                      <FormItem><FormLabel className="uppercase text-[10px] font-black tracking-widest text-muted-foreground">Official Email</FormLabel><FormControl><Input className="h-12 rounded-xl" {...field} value={field.value ?? ''} /></FormControl></FormItem>
                    )} />
                    <FormField control={form.control} name="contact.supportEmail" render={({ field }) => (
                      <FormItem><FormLabel className="uppercase text-[10px] font-black tracking-widest text-muted-foreground">Customer Care Email</FormLabel><FormControl><Input className="h-12 rounded-xl" {...field} value={field.value ?? ''} /></FormControl></FormItem>
                    )} />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="legal" className="space-y-8 mt-0">
                <Card className="rounded-[2rem] border-none shadow-xl">
                  <CardHeader className="p-10 border-b bg-muted/30 flex items-center justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-2xl font-headline flex items-center gap-3">
                        <ShieldCheck className="h-6 w-6 text-primary" /> Regulatory Matrix
                      </CardTitle>
                      <CardDescription>Manage all dynamic legal information and registrations.</CardDescription>
                    </div>
                    <Button type="button" onClick={handleOpenAddField} className="rounded-xl shadow-lg">
                      <PlusCircle className="mr-2 h-4 w-4" /> Add Legal Field
                    </Button>
                  </CardHeader>
                  <CardContent className="p-10">
                    <div className="space-y-4">
                      {fields.length === 0 ? (
                        <div className="py-12 text-center bg-stone-50 rounded-2xl border-2 border-dashed">
                          <p className="text-stone-400 italic text-sm">No legal fields registered. Add one to begin.</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {fields.map((field, index) => (
                            <div key={field.id} className="flex items-center justify-between p-4 bg-muted/20 rounded-2xl border border-muted group hover:border-primary/30 transition-all">
                              <div className="flex items-center gap-4">
                                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                  <ShieldCheck className="h-5 w-5" />
                                </div>
                                <div>
                                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground leading-none mb-1">{field.label}</p>
                                  <p className="text-sm font-extrabold text-foreground line-clamp-1">{field.value}</p>
                                </div>
                              </div>
                              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button type="button" variant="ghost" size="icon" onClick={() => handleOpenEditField(index)} className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary">
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                                <Button type="button" variant="ghost" size="icon" onClick={() => setFieldToDelete(index)} className="h-8 w-8 rounded-lg hover:bg-destructive/10 hover:text-destructive">
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="bank" className="space-y-8 mt-0">
                <Card className="rounded-[2.5rem] border-none shadow-2xl bg-primary/5 border border-primary/20 overflow-hidden mb-10 transition-all hover:shadow-primary/5">
                   <CardContent className="p-10 flex flex-col sm:flex-row items-center justify-between gap-10">
                      <div className="space-y-2 text-center sm:text-left">
                         <h3 className="text-2xl font-headline font-bold flex items-center gap-3 text-primary justify-center sm:justify-start">
                            <Eye className="h-7 w-7" /> Financial Visibility Policy
                         </h3>
                         <p className="text-sm text-stone-600 font-medium">When enabled, the configured bank details will be visible on the public website footer.</p>
                      </div>
                      <FormField control={form.control} name="visibility.showBankDetails" render={({ field }) => (
                         <FormItem 
                           className="flex items-center gap-8 bg-white p-6 rounded-[2rem] border-2 border-primary/20 shadow-2xl hover:scale-[1.02] transition-transform duration-300 cursor-pointer"
                           onClick={() => field.onChange(!field.value)}
                         >
                            <FormLabel className="text-sm font-black uppercase tracking-[0.2em] m-0 leading-none text-primary cursor-pointer select-none">
                              Show Bank Details
                            </FormLabel>
                            <FormControl>
                               <div onClick={(e) => e.stopPropagation()}>
                                 <Switch 
                                   checked={field.value} 
                                   onCheckedChange={field.onChange} 
                                   className="w-[56px] h-[30px] data-[state=checked]:bg-primary data-[state=unchecked]:bg-input border-none hover:shadow-md transition-all shadow-inner"
                                 />
                               </div>
                            </FormControl>
                         </FormItem>
                      )} />
                   </CardContent>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  <div className="lg:col-span-8">
                    <Card className="rounded-[2rem] border-none shadow-xl">
                      <CardHeader className="p-10 border-b bg-muted/30">
                        <CardTitle className="text-2xl font-headline flex items-center gap-3">
                          <CreditCard className="h-6 w-6 text-primary" /> Financial Facilitation
                        </CardTitle>
                        <CardDescription>Bank account details for direct transactions.</CardDescription>
                      </CardHeader>
                      <CardContent className="p-10 space-y-10">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                           <FormField control={form.control} name="bank.accountName" render={({ field }) => (
                            <FormItem><FormLabel className="uppercase text-[10px] font-black tracking-widest text-muted-foreground">Beneficiary Name</FormLabel><FormControl><Input className="h-12 rounded-xl" {...field} value={field.value ?? ''} /></FormControl></FormItem>
                          )} />
                          <FormField control={form.control} name="bank.bankName" render={({ field }) => (
                            <FormItem><FormLabel className="uppercase text-[10px] font-black tracking-widest text-muted-foreground">Bank Name</FormLabel><FormControl><Input className="h-12 rounded-xl" {...field} value={field.value ?? ''} /></FormControl></FormItem>
                          )} />
                          <FormField control={form.control} name="bank.branch" render={({ field }) => (
                            <FormItem><FormLabel className="uppercase text-[10px] font-black tracking-widest text-muted-foreground">Bank Branch</FormLabel><FormControl><Input className="h-12 rounded-xl" {...field} value={field.value ?? ''} /></FormControl></FormItem>
                          )} />
                          <FormField control={form.control} name="bank.accountNumber" render={({ field }) => (
                            <FormItem><FormLabel className="uppercase text-[10px] font-black tracking-widest text-muted-foreground">Account Number</FormLabel><FormControl><Input className="h-12 rounded-xl" {...field} value={field.value ?? ''} /></FormControl></FormItem>
                          )} />
                          <FormField control={form.control} name="bank.ifsc" render={({ field }) => (
                            <FormItem><FormLabel className="uppercase text-[10px] font-black tracking-widest text-muted-foreground">IFSC Code</FormLabel><FormControl><Input className="h-12 rounded-xl" {...field} value={field.value ?? ''} /></FormControl></FormItem>
                          )} />
                          <FormField control={form.control} name="bank.upiId" render={({ field }) => (
                            <FormItem><FormLabel className="uppercase text-[10px] font-black tracking-widest text-muted-foreground">UPI ID</FormLabel><FormControl><Input className="h-12 rounded-xl" {...field} value={field.value ?? ''} /></FormControl></FormItem>
                          )} />
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="lg:col-span-4">
                    <Card className="rounded-[2rem] border-none shadow-xl overflow-hidden h-full">
                      <CardHeader className="p-10 border-b bg-stone-900 text-white">
                        <CardTitle className="text-xl font-headline flex items-center gap-3">
                          <QrCode className="h-6 w-6 text-primary" /> Payment QR
                        </CardTitle>
                        <CardDescription className="text-stone-400">Scan to Pay acquisition.</CardDescription>
                      </CardHeader>
                      <CardContent className="p-10 space-y-6">
                        <div className="space-y-4">
                           <div 
                             onClick={() => qrInputRef.current?.click()}
                             className={cn(
                               "aspect-square rounded-[2rem] border-4 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all duration-500 relative overflow-hidden group",
                               form.watch('bank.qrCodeUrl') ? "border-primary/20 bg-stone-50" : "border-stone-100 hover:border-primary/30"
                             )}
                           >
                              {form.watch('bank.qrCodeUrl') ? (
                                <>
                                  <Image src={form.watch('bank.qrCodeUrl')!} alt="QR Preview" fill className="object-contain p-6" />
                                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                                     <Button type="button" variant="secondary" size="sm" className="rounded-xl"><RefreshCw className="h-3 w-3 mr-2" /> Replace</Button>
                                     <Button type="button" variant="destructive" size="sm" className="rounded-xl" onClick={(e) => { e.stopPropagation(); form.setValue('bank.qrCodeUrl', '', { shouldDirty: true }); }}><X className="h-3 w-3 mr-2" /> Remove</Button>
                                  </div>
                                </>
                              ) : (
                                <div className="flex flex-col items-center gap-3 text-stone-300 group-hover:text-primary">
                                   <Upload className="h-8 w-8" />
                                   <span className="text-[10px] font-black uppercase tracking-widest">Upload Payment QR</span>
                                </div>
                              )}
                              <input ref={qrInputRef} type="file" className="hidden" accept="image/*" onChange={handleQrUpload} />
                           </div>
                           <p className="text-[9px] text-center text-stone-400 font-bold uppercase tracking-widest">Supports UPI / BharatQR</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="social" className="space-y-8 mt-0">
                <Card className="rounded-[2rem] border-none shadow-xl">
                  <CardHeader className="p-10 border-b bg-muted/30">
                    <CardTitle className="text-2xl font-headline flex items-center gap-3">
                      <Instagram className="h-6 w-6 text-primary" /> Social Presence
                    </CardTitle>
                    <CardDescription>Official brand profiles.</CardDescription>
                  </CardHeader>
                  <CardContent className="p-10 grid grid-cols-1 md:grid-cols-2 gap-10">
                    <FormField control={form.control} name="social.instagram" render={({ field }) => (
                      <FormItem><FormLabel className="uppercase text-[10px] font-black tracking-widest text-muted-foreground">Instagram URL</FormLabel><FormControl><Input className="h-12 rounded-xl" {...field} value={field.value ?? ''} /></FormControl></FormItem>
                    )} />
                    <FormField control={form.control} name="social.facebook" render={({ field }) => (
                      <FormItem><FormLabel className="uppercase text-[10px] font-black tracking-widest text-muted-foreground">Facebook URL</FormLabel><FormControl><Input className="h-12 rounded-xl" {...field} value={field.value ?? ''} /></FormControl></FormItem>
                    )} />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="maps" className="space-y-8 mt-0">
                <Card className="rounded-[2.5rem] border-none shadow-2xl bg-primary/5 border border-primary/20 overflow-hidden mb-10 transition-all hover:shadow-primary/5">
                   <CardContent className="p-10 flex flex-col sm:flex-row items-center justify-between gap-10">
                      <div className="space-y-2 text-center sm:text-left">
                         <h3 className="text-2xl font-headline font-bold flex items-center gap-3 text-primary justify-center sm:justify-start">
                            <MapPin className="h-7 w-7" /> Map Visibility Policy
                         </h3>
                         <p className="text-sm text-stone-600 font-medium">Toggle the public display of the Location Matrix in the footer.</p>
                      </div>
                      <FormField control={form.control} name="visibility.showMap" render={({ field }) => (
                         <FormItem 
                            className="flex items-center gap-8 bg-white p-6 rounded-[2rem] border-2 border-primary/20 shadow-2xl hover:scale-[1.02] transition-transform duration-300 cursor-pointer"
                            onClick={() => field.onChange(!field.value)}
                         >
                            <FormLabel className="text-sm font-black uppercase tracking-[0.2em] m-0 leading-none text-primary cursor-pointer select-none">
                              ENABLE COMPONENT
                            </FormLabel>
                            <FormControl>
                               <div onClick={(e) => e.stopPropagation()}>
                                 <Switch 
                                   checked={field.value} 
                                   onCheckedChange={field.onChange} 
                                   className="w-[56px] h-[30px] data-[state=checked]:bg-primary data-[state=unchecked]:bg-stone-200 border-none hover:shadow-md transition-all shadow-inner"
                                 />
                               </div>
                            </FormControl>
                         </FormItem>
                      )} />
                   </CardContent>
                </Card>

                <Card className="rounded-[2rem] border-none shadow-xl">
                  <CardHeader className="p-10 border-b bg-muted/30">
                    <CardTitle className="text-2xl font-headline flex items-center gap-3">
                      <Globe className="h-6 w-6 text-primary" /> Location Matrix
                    </CardTitle>
                    <CardDescription>Configure interactive map and navigation endpoints.</CardDescription>
                  </CardHeader>
                  <CardContent className="p-10 space-y-10">
                    <FormField control={form.control} name="maps.mapUrl" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="uppercase text-[10px] font-black tracking-widest text-muted-foreground flex items-center gap-2">
                           <ExternalLink className="h-3 w-3" /> Google Maps Place URL
                        </FormLabel>
                        <FormControl><Input className="h-12 rounded-xl border-stone-200 focus:ring-primary/20" placeholder="https://www.google.com/maps/place/..." {...field} value={field.value ?? ''} /></FormControl>
                        <FormDescription className="text-[9px] font-medium text-stone-400">Used for the "VIEW ON GOOGLE MAPS" navigation button.</FormDescription>
                      </FormItem>
                    )} />
                    
                    <FormField control={form.control} name="maps.embedUrl" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="uppercase text-[10px] font-black tracking-widest text-primary flex items-center gap-2">
                           <Sparkles className="h-3 w-3" /> Google Maps Embed URL
                        </FormLabel>
                        <FormControl><Input className="h-12 rounded-xl border-primary/20 focus:ring-primary/20" placeholder="https://www.google.com/maps/embed?pb=..." {...field} value={field.value ?? ''} /></FormControl>
                        <FormDescription className="text-[9px] font-medium text-stone-400">Required for the interactive map display.</FormDescription>
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
                    <CardDescription className="text-stone-400">Master controls for public-facing modules.</CardDescription>
                  </CardHeader>
                  <CardContent className="p-10 space-y-4">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                          { key: 'showGST', label: 'DISPLAY GSTIN INFORMATION' },
                          { key: 'showFSSAI', label: 'DISPLAY FSSAI LICENSE' },
                          { key: 'showBankDetails', label: 'DISPLAY FINANCIAL PANEL' },
                          { key: 'showMap', label: 'DISPLAY LOCATION MATRIX' },
                        ].map((policy) => (
                          <FormField key={policy.key} control={form.control} name={`visibility.${policy.key}` as any} render={({ field }) => (
                            <FormItem 
                               className="flex items-center justify-between p-6 rounded-2xl border bg-muted/10 cursor-pointer hover:bg-muted/20 transition-colors"
                               onClick={() => field.onChange(!field.value)}
                            >
                              <FormLabel className="text-sm font-bold uppercase tracking-tight cursor-pointer">{policy.label}</FormLabel>
                              <FormControl>
                                <div onClick={(e) => e.stopPropagation()}>
                                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                                </div>
                              </FormControl>
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

      {/* Add/Edit Field Modal */}
      <Dialog open={isFieldModalOpen} onOpenChange={setIsFieldModalOpen}>
        <DialogContent className="sm:max-w-md rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl">
          <div className="bg-stone-900 text-white p-8 border-b">
            <DialogHeader>
              <DialogTitle className="text-2xl font-headline flex items-center gap-3">
                {editingFieldIdx !== null ? <Pencil className="h-6 w-6 text-primary" /> : <PlusCircle className="h-6 w-6 text-primary" />}
                {editingFieldIdx !== null ? 'Edit Legal Field' : 'Add Legal Field'}
              </DialogTitle>
              <DialogDescription className="text-stone-400">Configure label and registration value.</DialogDescription>
            </DialogHeader>
          </div>
          <div className="p-10 space-y-8">
            <div className="space-y-2">
              <Label className="uppercase text-[10px] font-black tracking-[0.2em] text-stone-400">Field Label / Name</Label>
              <Input 
                placeholder="e.g. TRADE LICENSE NO." 
                value={fieldLabel}
                onChange={(e) => setFieldLabel(e.target.value)}
                className="h-12 rounded-xl border-2"
              />
            </div>
            <div className="space-y-2">
              <Label className="uppercase text-[10px] font-black tracking-[0.2em] text-stone-400">Field Value / Number</Label>
              <Input 
                placeholder="XXXXXXXXXXXX" 
                value={fieldValue}
                onChange={(e) => setFieldValue(e.target.value)}
                className="h-12 rounded-xl border-2"
              />
            </div>
            <div className="flex gap-4 pt-4">
              <Button variant="ghost" onClick={() => setIsFieldModalOpen(false)} className="flex-1 h-12 rounded-xl">Cancel</Button>
              <Button onClick={handleSaveField} className="flex-1 h-12 rounded-xl shadow-lg shadow-primary/20">
                {editingFieldIdx !== null ? 'Save Changes' : 'Add Field'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={fieldToDelete !== null} onOpenChange={(o) => !o && setFieldToDelete(null)}>
        <DialogContent className="sm:max-w-md rounded-[2.5rem] border-none shadow-2xl overflow-hidden p-0">
          <div className="bg-destructive/10 p-8 border-b border-destructive/20">
            <DialogHeader>
              <DialogTitle className="text-2xl font-headline flex items-center gap-3 text-destructive">
                <AlertTriangle className="h-8 w-8" />
                Confirm Deletion
              </DialogTitle>
              <DialogDescription className="text-stone-600">
                Are you sure you want to delete this legal field? This action will immediately impact the public footer.
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="p-10 flex gap-4">
            <Button variant="ghost" onClick={() => setFieldToDelete(null)} className="flex-1 h-12 rounded-xl font-bold">Abort</Button>
            <Button 
              variant="destructive" 
              className="flex-1 h-12 rounded-xl font-bold shadow-xl shadow-destructive/20" 
              onClick={() => {
                if (fieldToDelete !== null) {
                  remove(fieldToDelete);
                  setFieldToDelete(null);
                  toast({ title: 'Field Removed' });
                }
              }}
            >
              Final Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
