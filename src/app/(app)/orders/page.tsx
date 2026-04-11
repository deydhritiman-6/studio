'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { orders as initialOrders, products } from '@/lib/data';
import { MoreHorizontal } from 'lucide-react';
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
import type { Order } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';

const getStatusBadgeVariant = (status: Order['deliveryStatus']) => {
  switch (status) {
    case 'Pending':
    case 'Confirmed':
      return 'secondary';
    case 'Preparing':
    case 'Packed':
      return 'default';
    case 'Shipped':
      return 'outline';
    case 'Delivered':
      return 'default'; // A different color would be better
    default:
      return 'secondary';
  }
};

const getStatusBadgeClassName = (status: Order['deliveryStatus']) => {
  switch (status) {
    case 'Delivered':
      return 'bg-green-700 hover:bg-green-800';
    case 'Shipped':
      return 'bg-blue-700 hover:bg-blue-800';
    case 'Preparing':
    case 'Packed':
      return 'bg-primary hover:bg-primary/90';
    case 'Confirmed':
        return 'bg-blue-600 hover:bg-blue-700';
    default:
      return '';
  }
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);
  const { toast } = useToast();

  const allStatuses: Order['deliveryStatus'][] = ['Pending', 'Confirmed', 'Preparing', 'Packed', 'Shipped', 'Delivered'];

  const getProductName = (productId: string) => {
    return products.find(p => p.id === productId)?.name || 'Unknown Product';
  };

  const handleUpdateStatus = (orderId: string, status: Order['deliveryStatus']) => {
    setOrders(prevOrders =>
      prevOrders.map(order =>
        order.id === orderId ? { ...order, deliveryStatus: status } : order
      )
    );
    toast({
      title: 'Order Status Updated',
      description: `Order ${orderId} has been marked as '${status}'.`,
    });
  };

  return (
    <>
      <Dialog open={!!viewingOrder} onOpenChange={(open) => !open && setViewingOrder(null)}>
        {viewingOrder && (
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Order Details</DialogTitle>
              <DialogDescription>
                Viewing details for order {viewingOrder.id}.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
                <div>
                    <h4 className="font-semibold">Customer</h4>
                    <p className="text-muted-foreground">{viewingOrder.customerName}</p>
                </div>
                <div>
                    <h4 className="font-semibold">Order Date</h4>
                    <p className="text-muted-foreground">{viewingOrder.orderDate}</p>
                </div>
                <div>
                    <h4 className="font-semibold">Products</h4>
                    <ul className="list-disc list-inside text-muted-foreground">
                        {viewingOrder.products.map(p => (
                            <li key={p.productId}>{getProductName(p.productId)} x {p.quantity}</li>
                        ))}
                    </ul>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                    <h4 className="font-semibold">Total Amount</h4>
                    <p className="font-semibold">₹{viewingOrder.totalAmount.toLocaleString('en-IN')}</p>
                </div>
                 <div className="flex justify-between items-center">
                    <h4 className="font-semibold">Payment Status</h4>
                    <Badge variant={viewingOrder.paymentStatus === 'Paid' ? 'default' : 'secondary'} className={viewingOrder.paymentStatus === 'Paid' ? 'bg-green-700 hover:bg-green-800' : ''}>
                        {viewingOrder.paymentStatus}
                    </Badge>
                </div>
                <div className="flex justify-between items-center">
                    <h4 className="font-semibold">Delivery Status</h4>
                    <Badge variant="default" className={getStatusBadgeClassName(viewingOrder.deliveryStatus)}>
                        {viewingOrder.deliveryStatus}
                    </Badge>
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
    
      <PageHeader title="Orders" />
      <Card>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead><span className="sr-only">Actions</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.id}</TableCell>
                  <TableCell>{order.customerName}</TableCell>
                  <TableCell>{order.orderDate}</TableCell>
                  <TableCell>
                    ₹{order.totalAmount.toLocaleString('en-IN')}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(order.deliveryStatus)} className={getStatusBadgeClassName(order.deliveryStatus)}>
                      {order.deliveryStatus}
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
                        <DropdownMenuItem onClick={() => setViewingOrder(order)}>
                          View order details
                        </DropdownMenuItem>
                        <DropdownMenuSub>
                          <DropdownMenuSubTrigger>
                            <span>Update status</span>
                          </DropdownMenuSubTrigger>
                          <DropdownMenuPortal>
                            <DropdownMenuSubContent>
                              {allStatuses.map(status => (
                                <DropdownMenuItem
                                  key={status}
                                  onClick={() => handleUpdateStatus(order.id, status)}
                                  disabled={order.deliveryStatus === status}
                                >
                                  {status}
                                </DropdownMenuItem>
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
