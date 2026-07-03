
'use client';

import { useState, useMemo } from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MoreHorizontal, Loader2, MessageSquare } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import type { Order, Product, OrderHistoryItem } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { useCollection, useFirestore } from '@/firebase';
import { collection, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

export default function OrdersPage() {
  const firestore = useFirestore();
  const ordersQuery = useMemo(() => firestore ? collection(firestore, 'orders') : null, [firestore]);
  const productsQuery = useMemo(() => firestore ? collection(firestore, 'products') : null, [firestore]);
  
  const { data: orders, loading: ordersLoading } = useCollection<Order>(ordersQuery);
  const { data: products } = useCollection<Product>(productsQuery);

  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);
  const [statusToUpdate, setStatusToUpdate] = useState<{ id: string, status: Order['deliveryStatus'] } | null>(null);
  const [statusReason, setStatusReason] = useState('');
  const { toast } = useToast();

  const getProductName = (productId: string) => {
    return products?.find(p => p.id === productId)?.name || 'Unknown Product';
  };

  const handleUpdateStatus = (orderId: string, status: Order['deliveryStatus'], reason?: string) => {
    if (!firestore) return;
    const orderRef = doc(firestore, 'orders', orderId);
    
    let adminName = 'Admin';
    try {
      const stored = localStorage.getItem('user');
      if (stored) {
        const user = JSON.parse(stored);
        adminName = user.name || 'Admin';
      }
    } catch (e) {}
    
    const historyItem: OrderHistoryItem = {
      status,
      timestamp: new Date().toISOString(),
      adminName: adminName,
    };

    if (reason) {
      historyItem.reason = reason;
    }

    const updateData: any = { 
      deliveryStatus: status,
      history: arrayUnion(historyItem)
    };

    if (reason) {
      updateData.statusReason = reason;
    }

    updateDoc(orderRef, updateData)
      .then(() => {
        toast({ title: 'Order Updated', description: `Order ${orderId} is now ${status}.` });
        setStatusToUpdate(null);
        setStatusReason('');
      })
      .catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
          path: orderRef.path,
          operation: 'update',
          requestResourceData: updateData,
        });
        errorEmitter.emit('permission-error', permissionError);
      });
  };

  const handleActionClick = (orderId: string, status: Order['deliveryStatus']) => {
    if (status === 'Order On Hold' || status === 'Order Rejected') {
      setStatusToUpdate({ id: orderId, status });
    } else {
      handleUpdateStatus(orderId, status);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'Order Rejected': return 'destructive';
      case 'Order On Hold': return 'secondary';
      case 'Order Confirmed': return 'default';
      case 'New Order': return 'outline';
      default: return 'outline';
    }
  };

  if (ordersLoading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin" /></div>;

  return (
    <>
      <Dialog open={!!statusToUpdate} onOpenChange={(open) => !open && setStatusToUpdate(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reason for {statusToUpdate?.status}</DialogTitle>
            <DialogDescription>Please provide a mandatory reason for this status change.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Reason</Label>
              <Textarea 
                placeholder="e.g., Payment verification pending, Stock unavailable..." 
                value={statusReason}
                onChange={(e) => setStatusReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setStatusToUpdate(null)}>Cancel</Button>
            <Button 
              disabled={!statusReason.trim()} 
              onClick={() => statusToUpdate && handleUpdateStatus(statusToUpdate.id, statusToUpdate.status, statusReason)}
            >
              Update Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
                <div className="flex justify-between items-center"><h4 className="font-semibold">Current Workflow Status</h4><Badge variant={getStatusBadgeVariant(viewingOrder.deliveryStatus)}>{viewingOrder.deliveryStatus}</Badge></div>
                
                {viewingOrder.statusReason && (
                   <div className="bg-muted p-3 rounded-lg flex gap-3">
                      <MessageSquare className="h-4 w-4 shrink-0 mt-1 text-muted-foreground" />
                      <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Status Reason</p>
                        <p className="text-sm italic">{viewingOrder.statusReason}</p>
                      </div>
                   </div>
                )}
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
                  <TableCell><Badge variant={getStatusBadgeVariant(order.deliveryStatus)}>{order.deliveryStatus}</Badge></TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setViewingOrder(order)}>View order details</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleActionClick(order.id, 'Order Confirmed')}>Order Confirmed</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleActionClick(order.id, 'New Order for Production')}>Sent for Production</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleActionClick(order.id, 'Order On Hold')}>Order On Hold</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleActionClick(order.id, 'Order Rejected')} className="text-destructive">Order Rejected</DropdownMenuItem>
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
