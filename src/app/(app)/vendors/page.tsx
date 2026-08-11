'use client';

import { useState, useMemo, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { Vendor } from '@/lib/types';
import { MoreHorizontal, PlusCircle, Loader2, Search, Edit, Trash2, Store, Phone, Mail, MapPin, ShieldAlert } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useCollection, useFirestore } from '@/firebase';
import { collection, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';

const vendorFormSchema = z.object({
  name: z.string().min(1, 'Vendor Name is required'),
  contactPerson: z.string().min(1, 'Contact Person is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  address: z.string().min(1, 'Address is required'),
  status: z.enum(['Active', 'Inactive']),
});

type VendorFormValues = z.infer<typeof vendorFormSchema>;

export default function VendorsPage() {
  const firestore = useFirestore();
  const vendorsQuery = useMemo(() => (firestore ? collection(firestore, 'vendors') : null), [firestore]);
  const { data: vendors, loading } = useCollection<Vendor>(vendorsQuery);

  const [searchTerm, setSearchTerm] = useState('');
  const [isAddOrEditDialogOpen, setIsAddOrEditDialogOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const [itemToDelete, setItemToDelete] = useState<Vendor | null>(null);
  const [deleteInput, setDeleteInput] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const { toast } = useToast();

  const form = useForm<VendorFormValues>({
    resolver: zodResolver(vendorFormSchema),
    defaultValues: {
      name: '',
      contactPerson: '',
      email: '',
      phone: '',
      address: '',
      status: 'Active',
    }
  });

  useEffect(() => {
    if (editingVendor) {
      form.reset({
        name: editingVendor.name,
        contactPerson: editingVendor.contactPerson,
        email: editingVendor.email,
        phone: editingVendor.phone,
        address: editingVendor.address,
        status: editingVendor.status,
      });
    } else {
      form.reset({
        name: '',
        contactPerson: '',
        email: '',
        phone: '',
        address: '',
        status: 'Active',
      });
    }
  }, [editingVendor, form]);

  const onSubmit = (values: VendorFormValues) => {
    if (!firestore) return;
    setIsSaving(true);

    const id = editingVendor?.id || `VND-${Date.now()}`;
    const vendorRef = doc(firestore, 'vendors', id);
    const vendorData = {
      ...values,
      id,
      updatedAt: new Date().toISOString(),
      createdAt: editingVendor?.createdAt || new Date().toISOString(),
    };

    setDoc(vendorRef, vendorData)
      .then(() => {
        setIsAddOrEditDialogOpen(false);
        setEditingVendor(null);
        toast({ title: editingVendor ? 'Vendor Updated' : 'Vendor Registered' });
      })
      .catch((err) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: vendorRef.path,
          operation: editingVendor ? 'update' : 'create',
          requestResourceData: vendorData
        }));
      })
      .finally(() => setIsSaving(false));
  };

  const confirmDelete = async () => {
    if (!firestore || !itemToDelete) return;
    setIsDeleting(true);
    deleteDoc(doc(firestore, 'vendors', itemToDelete.id))
      .then(() => {
        toast({ title: 'Vendor Removed' });
        setItemToDelete(null);
        setDeleteInput('');
      })
      .finally(() => setIsDeleting(false));
  };

  const filteredVendors = useMemo(() => {
    if (!vendors) return [];
    return vendors
      .filter(v => v.name.toLowerCase().includes(searchTerm.toLowerCase()) || v.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [vendors, searchTerm]);

  if (loading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin h-10 w-10 text-primary" /></div>;

  return (
    <>
      <PageHeader 
        title="Artisan Vendors" 
        actions={
          <Button onClick={() => { setEditingVendor(null); setIsAddOrEditDialogOpen(true); }} className="rounded-xl shadow-lg shadow-primary/20">
            <PlusCircle className="mr-2 h-4 w-4" /> Register Vendor
          </Button>
        } 
      />

      <div className="grid grid-cols-1 gap-8">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search suppliers..." 
            className="pl-10 h-11 rounded-xl bg-card border-none shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <Card className="rounded-[2rem] overflow-hidden border-none shadow-xl">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/10">
                  <TableHead className="p-6 uppercase text-[10px] font-black tracking-widest">Vendor Identity</TableHead>
                  <TableHead className="p-6 uppercase text-[10px] font-black tracking-widest">Contact Details</TableHead>
                  <TableHead className="p-6 uppercase text-[10px] font-black tracking-widest text-center">Status</TableHead>
                  <TableHead className="p-6 uppercase text-[10px] font-black tracking-widest text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVendors.map((vendor) => (
                  <TableRow key={vendor.id} className="group hover:bg-muted/5 transition-colors">
                    <TableCell className="p-6">
                      <div className="space-y-1">
                        <p className="font-bold text-lg">{vendor.name}</p>
                        <p className="text-[10px] uppercase font-black tracking-widest text-stone-400 flex items-center gap-1">
                          <Store className="h-3 w-3" /> {vendor.id}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="p-6">
                      <div className="space-y-1">
                        <p className="text-sm font-medium">{vendor.contactPerson}</p>
                        <div className="flex flex-col gap-1 text-[10px] text-stone-400 font-bold">
                           <span className="flex items-center gap-2"><Phone className="h-2.5 w-2.5" /> {vendor.phone}</span>
                           <span className="flex items-center gap-2"><Mail className="h-2.5 w-2.5" /> {vendor.email}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="p-6 text-center">
                      <Badge variant="outline" className={cn(
                        "rounded-full px-4 py-1 text-[10px] font-black uppercase tracking-widest border-2",
                        vendor.status === 'Active' ? 'bg-green-500/10 text-green-600 border-green-500/20' : 'bg-stone-500/10 text-stone-500 border-stone-500/20'
                      )}>
                        {vendor.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="p-6 text-right">
                       <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="rounded-xl"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48 rounded-xl">
                            <DropdownMenuItem onClick={() => { setEditingVendor(vendor); setIsAddOrEditDialogOpen(true); }}><Edit className="h-4 w-4 mr-2" /> Edit Profile</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setItemToDelete(vendor)} className="text-destructive"><Trash2 className="h-4 w-4 mr-2" /> De-Register</DropdownMenuItem>
                          </DropdownMenuContent>
                       </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredVendors.length === 0 && (
                  <TableRow><TableCell colSpan={4} className="p-20 text-center text-stone-400 italic font-headline text-xl">No suppliers found in the artisan network.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isAddOrEditDialogOpen} onOpenChange={setIsAddOrEditDialogOpen}>
        <DialogContent className="sm:max-w-xl rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl flex flex-col h-[85vh] bg-background">
          <div className="bg-muted/30 p-8 border-b shrink-0">
             <DialogHeader>
                <DialogTitle className="text-3xl font-headline">{editingVendor ? 'Refine Vendor' : 'Register New Vendor'}</DialogTitle>
                <DialogDescription className="text-[10px] uppercase tracking-[0.2em] font-black text-muted-foreground/60">Supplier Logistics & Identity Matrix</DialogDescription>
             </DialogHeader>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
               <ScrollArea className="flex-1 px-8 py-10" dual>
                  <div className="space-y-8">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField control={form.control} name="name" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="uppercase text-[9px] font-black tracking-widest text-muted-foreground">Entity Name</FormLabel>
                            <FormControl><Input className="h-12 rounded-xl" placeholder="e.g. Fine Cacao Importers" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="contactPerson" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="uppercase text-[9px] font-black tracking-widest text-muted-foreground">Artisan Liaison</FormLabel>
                            <FormControl><Input className="h-12 rounded-xl" placeholder="Full Name" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField control={form.control} name="email" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="uppercase text-[9px] font-black tracking-widest text-muted-foreground">Workplace Email</FormLabel>
                            <FormControl><Input className="h-12 rounded-xl" placeholder="contact@vendor.com" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="phone" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="uppercase text-[9px] font-black tracking-widest text-muted-foreground">Secure Line</FormLabel>
                            <FormControl><Input className="h-12 rounded-xl" placeholder="+91..." {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                     </div>

                     <FormField control={form.control} name="address" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="uppercase text-[9px] font-black tracking-widest text-muted-foreground">Registered Address</FormLabel>
                          <FormControl><Input className="h-12 rounded-xl" placeholder="Headquarters/Warehouse location" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                     )} />

                     <FormField control={form.control} name="status" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="uppercase text-[9px] font-black tracking-widest text-muted-foreground">Operational Status</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                             <FormControl><SelectTrigger className="h-12 rounded-xl"><SelectValue /></SelectTrigger></FormControl>
                             <SelectContent>
                                <SelectItem value="Active">Active Supplier</SelectItem>
                                <SelectItem value="Inactive">On Hold / Inactive</SelectItem>
                             </SelectContent>
                          </Select>
                        </FormItem>
                     )} />
                  </div>
               </ScrollArea>

               <div className="p-8 border-t bg-background flex gap-4 shrink-0">
                  <DialogClose asChild><Button type="button" variant="ghost" className="flex-1 h-12 rounded-xl font-bold uppercase text-[10px] tracking-widest">Discard</Button></DialogClose>
                  <Button type="submit" disabled={isSaving} className="flex-2 px-10 h-12 rounded-xl font-bold uppercase text-[10px] tracking-widest shadow-xl shadow-primary/20">
                    {isSaving ? <Loader2 className="animate-spin mr-2" /> : <Store className="mr-2 h-4 w-4" />}
                    Commit Vendor Data
                  </Button>
               </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!itemToDelete} onOpenChange={(o) => { if(!o) { setItemToDelete(null); setDeleteInput(''); } }}>
        <DialogContent className="sm:max-w-md rounded-[2.5rem] border-none shadow-2xl overflow-hidden p-0">
          <div className="bg-destructive/10 p-8 border-b border-destructive/20">
            <DialogHeader>
              <DialogTitle className="text-2xl font-headline flex items-center gap-3 text-destructive">
                <ShieldAlert className="h-8 w-8" />
                Confirm De-Registration
              </DialogTitle>
              <DialogDescription className="text-stone-600 font-medium">
                Are you sure you want to permanently remove vendor <strong className="text-stone-900">{itemToDelete?.name}</strong> from the artisan network?
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
                 {isDeleting ? <Loader2 className="animate-spin h-4 w-4" /> : 'Final De-Register'}
               </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}