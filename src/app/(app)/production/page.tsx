'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { orders as initialOrders, products } from '@/lib/data';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, PlayCircle } from 'lucide-react';
import type { Order } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';


const getStatusBadgeClassName = (status: Order['deliveryStatus']) => {
    switch (status) {
        case 'Confirmed':
            return 'bg-blue-600 hover:bg-blue-700';
        case 'Preparing':
            return 'bg-yellow-500 text-black hover:bg-yellow-600';
        default:
            return '';
    }
}

export default function ProductionPage() {
    const [orders, setOrders] = useState<Order[]>(() => {
    if (typeof window === 'undefined') {
      return initialOrders;
    }
    try {
      const savedOrders = localStorage.getItem('roseberry-orders');
      if (savedOrders) {
        return JSON.parse(savedOrders);
      }
      return initialOrders;
    } catch (error) {
      console.error("Failed to read orders from localStorage", error);
      return initialOrders;
    }
  });
  
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('roseberry-orders', JSON.stringify(orders));
      } catch (error) {
        console.error("Failed to save orders to localStorage", error);
      }
    }
  }, [orders]);


  const productionOrders = orders.filter(
    (order) => order.deliveryStatus === 'Confirmed' || order.deliveryStatus === 'Preparing'
  );

  const getProductName = (productId: string) => {
    return products.find(p => p.id === productId)?.name || 'Unknown Product';
  }

  const handleUpdateStatus = (orderId: string, status: Order['deliveryStatus']) => {
    setOrders(prevOrders => prevOrders.map(order => 
      order.id === orderId ? { ...order, deliveryStatus: status } : order
    ));
    toast({
      title: 'Order Status Updated',
      description: `Order ${orderId} has been marked as '${status}'.`,
    });
  };

  const handleStartBatch = () => {
    let updatedCount = 0;
    const updatedOrders = orders.map(order => {
      if (order.deliveryStatus === 'Confirmed') {
        updatedCount++;
        return { ...order, deliveryStatus: 'Preparing' };
      }
      return order;
    });

    if (updatedCount > 0) {
      setOrders(updatedOrders);
      toast({
        title: 'Production Batch Started',
        description: `${updatedCount} confirmed orders have been moved to 'Preparing'.`,
      });
    } else {
      toast({
        title: 'No Orders to Start',
        description: 'There are no "Confirmed" orders to move into production.',
      });
    }
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

      <PageHeader title="Production Schedule" actions={
        <Button onClick={handleStartBatch}>
          <PlayCircle className="mr-2 h-4 w-4" />
          Start Daily Production Batch
        </Button>
      } />
      <Card>
        <CardHeader>
            <CardTitle>Active Production Orders</CardTitle>
        </CardHeader>
        <CardContent>
        {productionOrders.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Products to Produce</TableHead>
                <TableHead>Status</TableHead>
                <TableHead><span className="sr-only">Actions</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {productionOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.id}</TableCell>
                  <TableCell>{order.customerName}</TableCell>
                  <TableCell>
                    <ul className="flex flex-col gap-1">
                        {order.products.map(p => (
                            <li key={p.productId}>{getProductName(p.productId)} <span className="text-muted-foreground">x {p.quantity}</span></li>
                        ))}
                    </ul>
                  </TableCell>
                  <TableCell>
                    <Badge variant="default" className={getStatusBadgeClassName(order.deliveryStatus)}>
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
                          View Order Details
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleUpdateStatus(order.id, 'Preparing')}
                          disabled={order.deliveryStatus === 'Preparing'}
                        >
                          Mark as 'Preparing'
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleUpdateStatus(order.id, 'Packed')}>
                          Mark as 'Packed'
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              No active production orders.
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
