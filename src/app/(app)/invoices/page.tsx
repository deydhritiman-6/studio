'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { orders as initialOrders, customers, products } from '@/lib/data';
import { MoreHorizontal, PlusCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import type { Order } from '@/lib/types';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';

const getStatusBadgeVariant = (status: Order['paymentStatus']) => {
  switch (status) {
    case 'Paid':
      return 'default';
    case 'Pending':
      return 'secondary';
    case 'Failed':
      return 'destructive';
    default:
      return 'secondary';
  }
}

const getStatusBadgeClassName = (status: Order['paymentStatus']) => {
    switch (status) {
        case 'Paid':
            return 'bg-green-700 hover:bg-green-800';
        case 'Pending':
            return 'bg-yellow-500 text-black hover:bg-yellow-600';
        default:
            return '';
    }
}

const invoiceFormSchema = z.object({
  customerId: z.string().min(1, { message: 'Please select a customer.' }),
  totalAmount: z.coerce.number().positive({ message: 'Amount must be a positive number.' }),
  paymentStatus: z.enum(['Paid', 'Pending', 'Failed']),
});

type InvoiceFormValues = z.infer<typeof invoiceFormSchema>;

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Order[]>(initialOrders);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [viewingInvoice, setViewingInvoice] = useState<Order | null>(null);
  const { toast } = useToast();

  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: {
      customerId: '',
      totalAmount: undefined,
      paymentStatus: 'Pending',
    },
  });

  function handleCreateInvoice(values: InvoiceFormValues) {
    const customer = customers.find(c => c.id === values.customerId);
    if (!customer) {
      toast({ variant: 'destructive', title: 'Error', description: 'Selected customer not found.' });
      return;
    }

    const newInvoice: Order = {
      id: `INV-${String(invoices.length + 100).padStart(3, '0')}`,
      customerId: values.customerId,
      customerName: customer.name,
      orderDate: new Date().toISOString().split('T')[0],
      totalAmount: values.totalAmount,
      products: [], // Simplified for this form
      paymentStatus: values.paymentStatus,
      deliveryStatus: 'Pending', // Default status for new invoices
    };

    setInvoices([newInvoice, ...invoices]);
    setIsCreateOpen(false);
    form.reset();
    toast({
      title: 'Invoice Created',
      description: `Invoice for ${customer.name} has been created successfully.`,
    });
  }

  function handleMarkAsPaid(invoiceId: string) {
    setInvoices(invoices.map(inv => inv.id === invoiceId ? { ...inv, paymentStatus: 'Paid' } : inv));
    toast({
      title: 'Invoice Updated',
      description: `Invoice ${invoiceId} has been marked as Paid.`,
    });
  }

  function handleDownloadPdf(invoiceId: string) {
    toast({
      title: 'Downloading PDF',
      description: `Preparing to download PDF for invoice ${invoiceId}.`,
    });
    // In a real app, you would trigger a PDF generation and download here.
  }
  
  const getProductName = (productId: string) => {
    return products.find(p => p.id === productId)?.name || `Product ${productId}`;
  };

  return (
    <>
      <PageHeader title="Invoices" actions={
        <Button onClick={() => setIsCreateOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Create Invoice
        </Button>
      }/>

      {/* Create Invoice Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Invoice</DialogTitle>
            <DialogDescription>Fill in the details for the new invoice.</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleCreateInvoice)} className="space-y-4 py-4">
              <FormField
                control={form.control}
                name="customerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a customer" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {customers.map(customer => (
                          <SelectItem key={customer.id} value={customer.id}>{customer.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="totalAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total Amount (₹)</FormLabel>
                    <FormControl><Input type="number" placeholder="e.g., 5000" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="paymentStatus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {['Pending', 'Paid', 'Failed'].map(status => (
                          <SelectItem key={status} value={status}>{status}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <DialogClose asChild><Button type="button" variant="secondary">Cancel</Button></DialogClose>
                <Button type="submit">Create</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* View Invoice Dialog */}
      <Dialog open={!!viewingInvoice} onOpenChange={() => setViewingInvoice(null)}>
        {viewingInvoice && (
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invoice Details</DialogTitle>
              <DialogDescription>Invoice ID: {viewingInvoice.id.replace('ORD', 'INV')}</DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="text-sm font-medium text-muted-foreground">Customer</h4>
                <p className="text-sm font-semibold">{viewingInvoice.customerName}</p>
              </div>
              <div className="flex justify-between items-center">
                <h4 className="text-sm font-medium text-muted-foreground">Date</h4>
                <p className="text-sm font-semibold">{viewingInvoice.orderDate}</p>
              </div>
              <Separator />
               {viewingInvoice.products.length > 0 && (
                <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">Products</h4>
                    <ul className="list-disc list-inside text-sm text-muted-foreground">
                        {viewingInvoice.products.map(p => (
                            <li key={p.productId}>{getProductName(p.productId)} x {p.quantity}</li>
                        ))}
                    </ul>
                </div>
               )}
              <div className="flex justify-between items-center font-bold text-lg">
                <h4 className="font-medium">Total</h4>
                <p>₹{viewingInvoice.totalAmount.toLocaleString('en-IN')}</p>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <h4 className="text-sm font-medium text-muted-foreground">Payment Status</h4>
                <Badge variant={getStatusBadgeVariant(viewingInvoice.paymentStatus)} className={getStatusBadgeClassName(viewingInvoice.paymentStatus)}>
                  {viewingInvoice.paymentStatus}
                </Badge>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild><Button type="button" variant="secondary">Close</Button></DialogClose>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
      
      <Card>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead><span className="sr-only">Actions</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium">{invoice.id.replace('ORD', 'INV')}</TableCell>
                  <TableCell>{invoice.customerName}</TableCell>
                  <TableCell>{invoice.orderDate}</TableCell>
                  <TableCell>
                    ₹{invoice.totalAmount.toLocaleString('en-IN')}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(invoice.paymentStatus)} className={getStatusBadgeClassName(invoice.paymentStatus)}>
                      {invoice.paymentStatus}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setViewingInvoice(invoice)}>View invoice</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleMarkAsPaid(invoice.id)} disabled={invoice.paymentStatus === 'Paid'}>
                          Mark as paid
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDownloadPdf(invoice.id)}>Download PDF</DropdownMenuItem>
                      </DropdownMenuContent>
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
