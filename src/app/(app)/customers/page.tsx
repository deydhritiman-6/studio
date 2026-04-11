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
import { customers as initialCustomers } from '@/lib/data';
import type { Customer } from '@/lib/types';
import { MoreHorizontal, PlusCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';


const customerFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  customerType: z.enum(['VIP', 'Regular', 'Corporate', 'Wholesale']),
  vipLevel: z.enum(['Gold', 'Platinum', 'Diamond', 'Silver']),
});

type CustomerFormValues = z.infer<typeof customerFormSchema>;

const getCustomerBadgeProps = (customer: Customer): { text: string; className: string; variant: 'default' | 'secondary' } => {
  if (customer.customerType === 'VIP') {
    const text = `VIP - ${customer.vipLevel}`;
    let className = 'bg-accent text-accent-foreground';
    switch (customer.vipLevel) {
      case 'Diamond':
        className = 'bg-purple-600 text-white hover:bg-purple-700 border-transparent';
        break;
      case 'Platinum':
        className = 'bg-slate-600 text-white hover:bg-slate-700 border-transparent';
        break;
      case 'Gold':
        className = 'bg-yellow-500 text-black hover:bg-yellow-600 border-transparent';
        break;
      case 'Silver':
        className = 'bg-gray-400 text-black hover:bg-gray-500 border-transparent';
        break;
    }
    return { text, className, variant: 'default' };
  }
  return { text: customer.customerType, className: '', variant: 'secondary' };
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>(() => {
    if (typeof window === 'undefined') {
      return initialCustomers;
    }
    try {
      const savedCustomers = localStorage.getItem('roseberry-customers');
      return savedCustomers ? JSON.parse(savedCustomers) : initialCustomers;
    } catch (error) {
      console.error("Failed to read customers from localStorage", error);
      return initialCustomers;
    }
  });
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('roseberry-customers', JSON.stringify(customers));
      } catch (error) {
        console.error("Failed to save customers to localStorage", error);
      }
    }
  }, [customers]);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  const [isAddOrEditDialogOpen, setIsAddOrEditDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [viewingCustomer, setViewingCustomer] = useState<Customer | null>(null);
  
  const { toast } = useToast();

  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerFormSchema),
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
      form.reset({
        name: '',
        email: '',
        phone: '',
        customerType: 'Regular',
        vipLevel: 'Silver',
      });
    }
  }, [editingCustomer, form]);

  const onDialogSubmit = (values: CustomerFormValues) => {
    if (editingCustomer) {
      // Edit logic
      const updatedCustomer: Customer = {
        ...editingCustomer,
        ...values,
      };
      setCustomers(customers.map(c => c.id === editingCustomer.id ? updatedCustomer : c));
      toast({ title: 'Customer Updated', description: `${values.name}'s details have been updated.` });
    } else {
      // Add logic
      const newCustomer: Customer = {
        id: `C${String(customers.length + 10).padStart(3, '0')}`,
        totalPurchaseValue: 0,
        joinedDate: new Date().toISOString().split('T')[0],
        ...values,
      };
      setCustomers([newCustomer, ...customers]);
      toast({ title: 'Customer Added', description: `${values.name} has been added.` });
    }
    setIsAddOrEditDialogOpen(false);
    setEditingCustomer(null);
  };
  
  const handleOpenAddDialog = () => {
    setEditingCustomer(null);
    form.reset({
      name: '',
      email: '',
      phone: '',
      customerType: 'Regular',
      vipLevel: 'Silver',
    });
    setIsAddOrEditDialogOpen(true);
  };
  
  const handleOpenEditDialog = (customer: Customer) => {
    setEditingCustomer(customer);
    setIsAddOrEditDialogOpen(true);
  };

  const filteredCustomers = useMemo(() => {
    return customers
      .filter(c => filterType === 'all' || c.customerType.toLowerCase() === filterType.toLowerCase())
      .filter(c => 
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        c.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
  }, [customers, searchTerm, filterType]);

  return (
    <>
      <PageHeader title="Customers" actions={
        <Button onClick={handleOpenAddDialog}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Customer
        </Button>
      } />
      
      {/* View Details Dialog */}
      <Dialog open={!!viewingCustomer} onOpenChange={(open) => !open && setViewingCustomer(null)}>
        {viewingCustomer && (
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{viewingCustomer.name}</DialogTitle>
              <DialogDescription>Customer Details</DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <div className="flex justify-between items-center">
                  <h4 className="text-sm font-medium text-muted-foreground">Customer ID</h4>
                  <p className="text-sm font-semibold">{viewingCustomer.id}</p>
              </div>
              <div className="flex justify-between items-center">
                  <h4 className="text-sm font-medium text-muted-foreground">Phone</h4>
                  <p className="text-sm font-semibold">{viewingCustomer.phone}</p>
              </div>
              <div className="flex justify-between items-center">
                  <h4 className="text-sm font-medium text-muted-foreground">Email</h4>
                  <p className="text-sm font-semibold">{viewingCustomer.email}</p>
              </div>
               <Separator />
               <div className="flex justify-between items-center">
                <h4 className="text-sm font-medium text-muted-foreground">Status</h4>
                {(() => {
                    const badgeProps = getCustomerBadgeProps(viewingCustomer);
                    return (
                        <Badge variant={badgeProps.variant} className={badgeProps.className}>
                            {badgeProps.text}
                        </Badge>
                    );
                })()}
              </div>
               <Separator />
               <div className="flex justify-between items-center">
                  <h4 className="text-sm font-medium text-muted-foreground">Total Spend</h4>
                  <p className="text-sm font-semibold">₹{viewingCustomer.totalPurchaseValue.toLocaleString('en-IN')}</p>
              </div>
               <div className="flex justify-between items-center">
                  <h4 className="text-sm font-medium text-muted-foreground">Joined Date</h4>
                  <p className="text-sm font-semibold">{viewingCustomer.joinedDate}</p>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="secondary">Close</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
      
      {/* Add/Edit Dialog */}
      <Dialog open={isAddOrEditDialogOpen} onOpenChange={setIsAddOrEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingCustomer ? 'Edit Customer' : 'Add New Customer'}</DialogTitle>
            <DialogDescription>
              {editingCustomer ? "Update the customer's details." : "Fill in the details for the new customer."}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onDialogSubmit)} className="space-y-4 py-4">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Customer Name</FormLabel>
                  <FormControl><Input placeholder="e.g., Aarav Sharma" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl><Input placeholder="e.g., aarav@example.com" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="phone" render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone</FormLabel>
                  <FormControl><Input placeholder="e.g., +91 9876543210" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
               <FormField control={form.control} name="customerType" render={({ field }) => (
                <FormItem>
                  <FormLabel>Customer Type</FormLabel>
                   <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                       {['VIP', 'Regular', 'Corporate', 'Wholesale'].map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
               <FormField control={form.control} name="vipLevel" render={({ field }) => (
                <FormItem>
                  <FormLabel>VIP Level</FormLabel>
                   <Select onValueChange={field.onChange} defaultValue={field.value} disabled={customerType !== 'VIP'}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a level" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                       {['Silver', 'Gold', 'Platinum', 'Diamond'].map(level => (
                        <SelectItem key={level} value={level}>{level}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="secondary">Cancel</Button>
                </DialogClose>
                <Button type="submit">Save</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      <Card>
        <CardContent>
          <div className="flex flex-col md:flex-row items-center gap-4 py-4">
            <Input 
              placeholder="Search customers..." 
              className="w-full md:max-w-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="w-full md:w-auto md:ml-auto">
                <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-full md:w-[180px]">
                    <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="vip">VIP</SelectItem>
                    <SelectItem value="regular">Regular</SelectItem>
                    <SelectItem value="corporate">Corporate</SelectItem>
                    <SelectItem value="wholesale">Wholesale</SelectItem>
                </SelectContent>
                </Select>
            </div>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Total Spend</TableHead>
                <TableHead>Joined Date</TableHead>
                <TableHead><span className="sr-only">Actions</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCustomers.map((customer) => {
                const badgeProps = getCustomerBadgeProps(customer);
                return (
                <TableRow key={customer.id}>
                  <TableCell className="font-medium">{customer.name}</TableCell>
                  <TableCell>{customer.email}</TableCell>
                  <TableCell>
                    <Badge variant={badgeProps.variant} className={badgeProps.className}>
                      {badgeProps.text}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    ₹{customer.totalPurchaseValue.toLocaleString('en-IN')}
                  </TableCell>
                  <TableCell>{customer.joinedDate}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setViewingCustomer(customer)}>
                          View details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleOpenEditDialog(customer)}>
                          Edit customer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )})}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
