
'use client';

import { useState, useMemo } from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MoreHorizontal, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
  DropdownMenuSubContent,
} from '@/components/ui/dropdown-menu';
import type { Order, Product } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { useCollection, useFirestore } from '@/firebase';
import { collection, doc, updateDoc } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export default function OrdersPage() {
  const firestore = useFirestore();
  const ordersQuery = useMemo(() => firestore ? collection(firestore, 'orders') : null, [firestore]);
  const productsQuery = useMemo(() => firestore ? collection(firestore, 'products') : null, [firestore]);
  
  const { data: orders, loading: ordersLoading } = useCollection<Order>(ordersQuery);
  const { data: products } = useCollection<Product>(productsQuery);

  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);
  const { toast } = useToast();

  const allStatuses: Order['deliveryStatus'][] = ['Pending', 'Confirmed', 'Preparing', 'Packed', 'Shipped', 'Delivered'];

  const getProductName = (productId: string) => {
    return products?.find(p => p.id === productId)?.name || 'Unknown Product';
  };

  const handleUpdateStatus = (orderId: string, status: Order['deliveryStatus']) => {
    if (!firestore) return;
    const orderRef = doc(firestore, 'orders', orderId);
    
    updateDoc(orderRef, { deliveryStatus: status })
      .then(() => {
        toast({ title: 'Order Updated', description: `Order ${orderId} is now ${status}.` });
      })
      .catch(async (error) => {
        const permissionError = new FirestorePermissionError({
          path: orderRef.path,
          operation: 'update',
          requestResourceData: { deliveryStatus: status },
        });
        errorEmitter.emit('permission-error', permissionError);
      });
  };

  if (ordersLoading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin" /></div>;

  return (
    <>
      <Dialog open={!!viewingOrder} onOpenChange={(open) => !open && setViewingOrder(null)}>
        {viewingOrder && (
          <DialogContent className="sm:max-w-md">
            <DialogHeader><DialogTitle>Order Details</DialogTitle></DialogHeader>
            <div className="py-4 space-y-4">
                <div><h4 className="font-semibold">Customer</h4><p className="text-muted-foreground">{viewingOrder.customerName}</p></div>
                <div><h4 className="font-semibold">Products</h4>
                    <ul className="list-disc list-inside text-muted-foreground">
                        {viewingOrder.products.map(p => (<li key={p.productId}>{getProductName(p.productId)} x {p.quantity}</li>))}
                    </ul>
                </div>
                <Separator />
                <div className="flex justify-between items-center"><h4 className="font-semibold">Total Amount</h4><p className="font-semibold">₹{viewingOrder.totalAmount.toLocaleString('en-IN')}</p></div>
                <div className="flex justify-between items-center"><h4 className="font-semibold">Status</h4><Badge>{viewingOrder.deliveryStatus}</Badge></div>
            </div>
            <DialogFooter><DialogClose asChild><Button type="button" variant="secondary">Close</Button></DialogClose></DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    
      <PageHeader title="Orders" />
      <Card>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Order ID</TableHead><TableHead>Customer</TableHead><TableHead>Date</TableHead><TableHead>Total</TableHead><TableHead>Status</TableHead><TableHead><span className="sr-only">Actions</span></TableHead></TableRow></TableHeader>
            <TableBody>
              {orders?.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.id}</TableCell>
                  <TableCell>{order.customerName}</TableCell>
                  <TableCell>{order.orderDate}</TableCell>
                  <TableCell>₹{order.totalAmount.toLocaleString('en-IN')}</TableCell>
                  <TableCell><Badge>{order.deliveryStatus}</Badge></TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setViewingOrder(order)}>View order details</DropdownMenuItem>
                        <DropdownMenuSub>
                          <DropdownMenuSubTrigger><span>Update status</span></DropdownMenuSubTrigger>
                          <DropdownMenuPortal>
                            <DropdownMenuSubContent>
                              {allStatuses.map(status => (
                                <DropdownMenuItem key={status} onClick={() => handleUpdateStatus(order.id, status)} disabled={order.deliveryStatus === status}>{status}</DropdownMenuItem>
                              ))}
                            </DropdownMenuSubContent>
                          </DropdownMenuPortal>
                        </DropdownMenuSub>
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
