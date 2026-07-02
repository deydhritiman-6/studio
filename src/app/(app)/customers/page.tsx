
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
import type { Customer } from '@/lib/types';
import { MoreHorizontal, PlusCircle, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { useCollection, useFirestore } from '@/firebase';
import { collection, doc, setDoc } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

const customerFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  customerType: z.enum(['VIP', 'Regular', 'Corporate', 'Wholesale']),
  vipLevel: z.enum(['Gold', 'Platinum', 'Diamond', 'Silver']),
});

type CustomerFormValues = z.infer<typeof customerFormSchema>;

export default function CustomersPage() {
  const firestore = useFirestore();
  const customersQuery = useMemo(() => firestore ? collection(firestore, 'customers') : null, [firestore]);
  const { data: customers, loading } = useCollection<Customer>(customersQuery);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [isAddOrEditDialogOpen, setIsAddOrEditDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [viewingCustomer, setViewingCustomer] = useState<Customer | null>(null);
  const { toast } = useToast();

  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: { customerType: 'Regular', vipLevel: 'Silver' }
  });

  const customerType = form.watch('customerType');

  useEffect(() => {
    if (editingCustomer) {
      form.reset({
        name: editingCustomer.name,
        email: editingCustomer.email,
        phone: editingCustomer.phone,
        customerType: editingCustomer.customerType,
        vipLevel: editingCustomer.vipLevel,
      });
    } else {
      form.reset({ name: '', email: '', phone: '', customerType: 'Regular', vipLevel: 'Silver' });
    }
  }, [editingCustomer, form]);

  const onDialogSubmit = (values: CustomerFormValues) => {
    if (!firestore) return;
    const id = editingCustomer?.id || `C${Date.now()}`;
    const customerRef = doc(firestore, 'customers', id);
    const customerData = {
      ...values,
      id,
      totalPurchaseValue: editingCustomer?.totalPurchaseValue || 0,
      joinedDate: editingCustomer?.joinedDate || new Date().toISOString().split('T')[0],
    };

    setDoc(customerRef, customerData)
      .then(() => {
        setIsAddOrEditDialogOpen(false);
        setEditingCustomer(null);
        toast({ title: editingCustomer ? 'Customer Updated' : 'Customer Added', description: `${values.name}'s details have been saved.` });
      })
      .catch(async (error) => {
        const permissionError = new FirestorePermissionError({
          path: customerRef.path,
          operation: editingCustomer ? 'update' : 'create',
          requestResourceData: customerData,
        });
        errorEmitter.emit('permission-error', permissionError);
      });
  };

  const filteredCustomers = useMemo(() => {
    if (!customers) return [];
    return customers
      .filter(c => filterType === 'all' || c.customerType.toLowerCase() === filterType.toLowerCase())
      .filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.email.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [customers, searchTerm, filterType]);

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin" /></div>;

  return (
    <>
      <PageHeader title="Customers" actions={<Button onClick={() => { setEditingCustomer(null); setIsAddOrEditDialogOpen(true); }}><PlusCircle className="mr-2 h-4 w-4" />Add Customer</Button>} />
      
      <Dialog open={!!viewingCustomer} onOpenChange={(open) => !open && setViewingCustomer(null)}>
        {viewingCustomer && (
          <DialogContent>
            <DialogHeader><DialogTitle>{viewingCustomer.name}</DialogTitle><DialogDescription>Customer Details</DialogDescription></DialogHeader>
            <div className="py-4 space-y-4">
              <div className="flex justify-between items-center"><h4 className="text-sm font-medium text-muted-foreground">Customer ID</h4><p className="text-sm font-semibold">{viewingCustomer.id}</p></div>
              <div className="flex justify-between items-center"><h4 className="text-sm font-medium text-muted-foreground">Phone</h4><p className="text-sm font-semibold">{viewingCustomer.phone}</p></div>
              <div className="flex justify-between items-center"><h4 className="text-sm font-medium text-muted-foreground">Email</h4><p className="text-sm font-semibold">{viewingCustomer.email}</p></div>
              <Separator /><div className="flex justify-between items-center"><h4 className="text-sm font-medium text-muted-foreground">Status</h4><Badge>{viewingCustomer.customerType}</Badge></div>
              <Separator /><div className="flex justify-between items-center"><h4 className="text-sm font-medium text-muted-foreground">Total Spend</h4><p className="text-sm font-semibold">₹{viewingCustomer.totalPurchaseValue.toLocaleString('en-IN')}</p></div>
            </div>
            <DialogFooter><DialogClose asChild><Button type="button" variant="secondary">Close</Button></DialogClose></DialogFooter>
          </DialogContent>
        )}
      </Dialog>
      
      <Dialog open={isAddOrEditDialogOpen} onOpenChange={setIsAddOrEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader><DialogTitle>{editingCustomer ? 'Edit Customer' : 'Add New Customer'}</DialogTitle></DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onDialogSubmit)} className="space-y-4 py-4">
              <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Customer Name</FormLabel><FormControl><Input placeholder="e.g., Aarav Sharma" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="email" render={({ field }) => (<FormItem><FormLabel>Email</FormLabel><FormControl><Input placeholder="e.g., aarav@example.com" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="phone" render={({ field }) => (<FormItem><FormLabel>Phone</FormLabel><FormControl><Input placeholder="e.g., +91 9876543210" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="customerType" render={({ field }) => (<FormItem><FormLabel>Customer Type</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger></FormControl><SelectContent>{['VIP', 'Regular', 'Corporate', 'Wholesale'].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="vipLevel" render={({ field }) => (<FormItem><FormLabel>VIP Level</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value} disabled={customerType !== 'VIP'}><FormControl><SelectTrigger><SelectValue placeholder="Select level" /></SelectTrigger></FormControl><SelectContent>{['Silver', 'Gold', 'Platinum', 'Diamond'].map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
              <DialogFooter><DialogClose asChild><Button type="button" variant="secondary">Cancel</Button></DialogClose><Button type="submit">Save</Button></DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      <Card>
        <CardContent>
          <div className="flex flex-col md:flex-row items-center gap-4 py-4">
            <Input placeholder="Search customers..." className="w-full md:max-w-sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            <div className="w-full md:w-auto md:ml-auto">
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-full md:w-[180px]"><SelectValue placeholder="Filter by type" /></SelectTrigger>
                  <SelectContent><SelectItem value="all">All Types</SelectItem><SelectItem value="vip">VIP</SelectItem><SelectItem value="regular">Regular</SelectItem><SelectItem value="corporate">Corporate</SelectItem><SelectItem value="wholesale">Wholesale</SelectItem></SelectContent>
                </Select>
            </div>
          </div>
          <Table>
            <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Type</TableHead><TableHead>Total Spend</TableHead><TableHead>Joined</TableHead><TableHead><span className="sr-only">Actions</span></TableHead></TableRow></TableHeader>
            <TableBody>
              {filteredCustomers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell className="font-medium">{customer.name}</TableCell>
                  <TableCell>{customer.email}</TableCell>
                  <TableCell><Badge>{customer.customerType}</Badge></TableCell>
                  <TableCell>₹{customer.totalPurchaseValue.toLocaleString('en-IN')}</TableCell>
                  <TableCell>{customer.joinedDate}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end"><DropdownMenuItem onClick={() => setViewingCustomer(customer)}>View details</DropdownMenuItem><DropdownMenuItem onClick={() => { setEditingCustomer(customer); setIsAddOrEditDialogOpen(true); }}>Edit customer</DropdownMenuItem></DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
