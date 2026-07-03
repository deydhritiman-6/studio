'use client';

import { useState, useMemo, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Search, Truck, Package, CheckCircle2, Clock, Send, PackageSearch } from 'lucide-react';
import { useCollection, useFirestore } from '@/firebase';
import { collection, doc, updateDoc } from 'firebase/firestore';
import type { Order } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const shippingFormSchema = z.object({
  status: z.enum(['Ready for Dispatch', 'Dispatched', 'Delivered', 'Cancelled', 'On Hold']),
  dispatchDescription: z.string().optional(),
  courierName: z.string().optional(),
  trackingNumber: z.string().optional(),
  dispatchDate: z.string().optional(),
  expectedDeliveryDate: z.string().optional(),
}).refine((data) => {
  if (data.status === 'Dispatched') {
    return !!data.courierName && !!data.trackingNumber && !!data.dispatchDate;
  }
  return true;
}, {
  message: "Dispatch details are required when marking as Dispatched.",
  path: ["courierName"],
});

type ShippingFormValues = z.infer<typeof shippingFormSchema>;

const statusColorMap: Record<string, string> = {
  'Order Received': 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  'Production in Progress': 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  'Ready for Dispatch': 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  'Dispatched': 'bg-green-500/10 text-green-500 border-green-500/20',
  'Delivered': 'bg-emerald-900/10 text-emerald-900 border-emerald-900/20 dark:text-emerald-400 dark:border-emerald-400/20',
  'Cancelled': 'bg-red-500/10 text-red-500 border-red-500/20',
  'On Hold': 'bg-slate-500/10 text-slate-500 border-slate-500/20',
};

export default function ShippingStatusPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  
  const { toast } = useToast();
  const firestore = useFirestore();

  const ordersQuery = useMemo(() => (firestore ? collection(firestore, 'orders') : null), [firestore]);
  const { data: orders, loading } = useCollection<Order>(ordersQuery);

  const filteredOrders = useMemo(() => {
    if (!orders) return [];
    return orders
      .filter(o => !!o.shippingStatus)
      .filter(o => 
        o.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (o.id.replace('ORD', 'INV').toLowerCase().includes(searchTerm.toLowerCase()))
      );
  }, [orders, searchTerm]);

  const form = useForm<ShippingFormValues>({
    resolver: zodResolver(shippingFormSchema),
    defaultValues: {
      status: 'Ready for Dispatch',
      dispatchDescription: '',
      courierName: '',
      trackingNumber: '',
      dispatchDate: new Date().toISOString().split('T')[0],
      expectedDeliveryDate: '',
    },
  });

  const currentStatus = form.watch('status');

  useEffect(() => {
    if (selectedOrder) {
      const orderStatus = selectedOrder.shippingStatus as any;
      const validStatuses = ['Ready for Dispatch', 'Dispatched', 'Delivered', 'Cancelled', 'On Hold'];
      
      form.reset({
        status: validStatuses.includes(orderStatus) ? orderStatus : 'Ready for Dispatch',
        dispatchDescription: selectedOrder.dispatchDetails?.description || '',
        courierName: selectedOrder.dispatchDetails?.courierName || '',
        trackingNumber: selectedOrder.dispatchDetails?.trackingNumber || '',
        dispatchDate: selectedOrder.dispatchDetails?.dispatchDate || new Date().toISOString().split('T')[0],
        expectedDeliveryDate: selectedOrder.dispatchDetails?.expectedDeliveryDate || '',
      });
    }
  }, [selectedOrder, form]);

  const handleUpdateStatus = (values: ShippingFormValues) => {
    if (!firestore || !selectedOrder) return;

    setIsUpdating(true);
    let adminName = 'Admin';
    try {
      const stored = localStorage.getItem('user');
      if (stored) adminName = JSON.parse(stored).name || 'Admin';
    } catch (e) {}
    
    const orderRef = doc(firestore, 'orders', selectedOrder.id);
    
    const dispatchDetails: any = {
      updatedBy: adminName,
      updatedAt: new Date().toISOString(),
    };

    if (values.status === 'Dispatched') {
      if (values.dispatchDescription) dispatchDetails.description = values.dispatchDescription;
      if (values.courierName) dispatchDetails.courierName = values.courierName;
      if (values.trackingNumber) dispatchDetails.trackingNumber = values.trackingNumber;
      if (values.dispatchDate) dispatchDetails.dispatchDate = values.dispatchDate;
      if (values.expectedDeliveryDate) dispatchDetails.expectedDeliveryDate = values.expectedDeliveryDate;
    }

    const updateData = {
      shippingStatus: values.status,
      dispatchDetails: dispatchDetails
    };

    updateDoc(orderRef, updateData)
      .then(() => {
        toast({ title: 'Status Updated', description: `Order ${selectedOrder.id} is now ${values.status}.` });
        setSelectedOrder(null);
      })
      .catch((err) => {
        console.error(err);
        toast({ variant: 'destructive', title: 'Update Failed', description: 'Failed to update shipping status.' });
      })
      .finally(() => setIsUpdating(false));
  };

  const StatusTimeline = ({ status }: { status?: string }) => {
    const steps = [
      { id: 'Order Received', icon: Send },
      { id: 'Production in Progress', icon: Clock },
      { id: 'Ready for Dispatch', icon: Package },
      { id: 'Dispatched', icon: Truck },
    ];
    const currentIndex = steps.findIndex(s => s.id === status);

    return (
      <div className="flex items-center gap-1.5 mt-2">
        {steps.map((step, i) => (
          <div key={step.id} className="flex items-center">
            <div className={cn(
              "flex items-center justify-center h-7 w-7 rounded-full border-2 transition-all",
              i <= currentIndex ? "bg-primary border-primary text-white" : "border-muted-foreground/30 text-muted-foreground"
            )}>
              {i < currentIndex ? <CheckCircle2 className="h-3 w-3" /> : <step.icon className="h-3 w-3" />}
            </div>
            {i < steps.length - 1 && (
              <div className={cn("h-0.5 w-4 mx-0.5", i < currentIndex ? "bg-primary" : "bg-muted-foreground/20")} />
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <>
      <PageHeader title="Dispatch Control" />
      
      <div className="grid grid-cols-1 gap-8">
        <Card className="rounded-[2rem] border-none shadow-xl bg-card overflow-hidden">
          <CardHeader className="bg-muted/30 p-8 border-b">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <CardTitle className="text-2xl font-headline flex items-center gap-3">
                  <Truck className="h-6 w-6 text-primary" />
                  Dispatch Control Center
                </CardTitle>
                <CardDescription>Track and update the color-coded lifecycle of artisan chocolates.</CardDescription>
              </div>
              <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search Invoice, ID, Customer..." 
                  className="pl-10 h-11 rounded-xl bg-background border-none shadow-inner" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-12 flex justify-center"><Loader2 className="animate-spin h-10 w-10 text-primary" /></div>
            ) : filteredOrders.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent bg-muted/10">
                    <TableHead className="font-black uppercase text-[10px] tracking-widest p-6">Identity</TableHead>
                    <TableHead className="font-black uppercase text-[10px] tracking-widest p-6">Customer</TableHead>
                    <TableHead className="font-black uppercase text-[10px] tracking-widest p-6">Progress</TableHead>
                    <TableHead className="font-black uppercase text-[10px] tracking-widest p-6">Status Indicator</TableHead>
                    <TableHead className="font-black uppercase text-[10px] tracking-widest p-6 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => (
                    <TableRow key={order.id} className="group hover:bg-muted/5 transition-colors">
                      <TableCell className="p-6">
                        <div className="font-bold text-sm">{order.id.replace('ORD', 'INV')}</div>
                        <div className="text-[10px] text-muted-foreground font-mono">{order.id}</div>
                      </TableCell>
                      <TableCell className="p-6">
                        <div className="font-medium">{order.customerName}</div>
                        <div className="text-xs text-muted-foreground">Placed: {order.orderDate}</div>
                      </TableCell>
                      <TableCell className="p-6">
                         <StatusTimeline status={order.shippingStatus} />
                      </TableCell>
                      <TableCell className="p-6">
                        <Badge variant="outline" className={cn(
                          "rounded-full px-4 py-1 text-[10px] font-bold uppercase tracking-widest border-2",
                          statusColorMap[order.shippingStatus || 'Order Received'] || 'bg-muted text-muted-foreground border-muted'
                        )}>
                          {order.shippingStatus || 'Order Received'}
                        </Badge>
                      </TableCell>
                      <TableCell className="p-6 text-right">
                        <Button 
                          variant="secondary" 
                          size="sm" 
                          className="rounded-xl px-6 h-10 hover:bg-primary hover:text-white transition-all shadow-sm"
                          onClick={() => setSelectedOrder(order)}
                        >
                          Update Log
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="flex flex-col items-center justify-center h-80 text-center space-y-4">
                 <PackageSearch className="h-12 w-12 text-muted-foreground/30" />
                 <div className="space-y-1">
                   <p className="font-headline text-xl italic text-muted-foreground">The dispatch queue is quiet.</p>
                   <p className="text-xs uppercase tracking-widest text-muted-foreground/60">Orders will appear here once marked as "Ready for Shipping" or "Product Ready".</p>
                 </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <DialogContent className="sm:max-w-xl rounded-[2.5rem] p-8 overflow-hidden">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-3xl font-headline">Shipping Log Update</DialogTitle>
            <DialogDescription>Updating transit details for {selectedOrder?.id.replace('ORD', 'INV')}</DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleUpdateStatus)} className="space-y-6">
              <FormField control={form.control} name="status" render={({ field }) => (
                <FormItem>
                  <FormLabel className="uppercase text-[10px] font-black tracking-widest text-muted-foreground">Workflow Stage</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-12 rounded-xl border-2 focus:ring-primary/20 transition-all">
                        <SelectValue placeholder="Select stage" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Ready for Dispatch"><div className="flex items-center gap-2"><div className="h-2 w-2 rounded-full bg-purple-500" /> Ready for Dispatch</div></SelectItem>
                      <SelectItem value="Dispatched"><div className="flex items-center gap-2"><div className="h-2 w-2 rounded-full bg-green-500" /> Dispatched</div></SelectItem>
                      <SelectItem value="Delivered"><div className="flex items-center gap-2"><div className="h-2 w-2 rounded-full bg-emerald-800" /> Delivered</div></SelectItem>
                      <SelectItem value="Cancelled"><div className="flex items-center gap-2"><div className="h-2 w-2 rounded-full bg-red-500" /> Cancelled</div></SelectItem>
                      <SelectItem value="On Hold"><div className="flex items-center gap-2"><div className="h-2 w-2 rounded-full bg-slate-500" /> On Hold</div></SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              {currentStatus === 'Dispatched' && (
                <div className="space-y-6 pt-4 border-t-2 border-dashed animate-in slide-in-from-top-4 duration-300">
                  <FormField control={form.control} name="dispatchDescription" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="uppercase text-[10px] font-black tracking-widest text-muted-foreground">Transit Notes</FormLabel>
                      <FormControl><Textarea placeholder="e.g., Packed in insulated containers for summer travel." className="rounded-xl min-h-[80px]" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="courierName" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="uppercase text-[10px] font-black tracking-widest text-muted-foreground">Courier Service</FormLabel>
                        <FormControl><Input placeholder="e.g., Blue Dart" className="rounded-xl h-12" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="trackingNumber" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="uppercase text-[10px] font-black tracking-widest text-muted-foreground">Consignment #</FormLabel>
                        <FormControl><Input placeholder="e.g., 7823-1102" className="rounded-xl h-12" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="dispatchDate" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="uppercase text-[10px] font-black tracking-widest text-muted-foreground">Dispatch Date</FormLabel>
                        <FormControl><Input type="date" className="rounded-xl h-12" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="expectedDeliveryDate" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="uppercase text-[10px] font-black tracking-widest text-muted-foreground">Expected Arrival</FormLabel>
                        <FormControl><Input type="date" className="rounded-xl h-12" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                </div>
              )}

              <div className="flex gap-4 pt-6">
                <Button 
                  type="button" 
                  variant="ghost" 
                  className="flex-1 h-12 rounded-xl font-bold" 
                  onClick={() => setSelectedOrder(null)}
                >
                  Discard
                </Button>
                <Button 
                  type="submit" 
                  className="flex-2 px-12 h-12 rounded-xl font-bold shadow-lg shadow-primary/20" 
                  disabled={isUpdating}
                >
                  {isUpdating ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                  Commit Transit Log
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}
