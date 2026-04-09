import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { orders, products } from '@/lib/data';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, PlayCircle } from 'lucide-react';
import type { Order } from '@/lib/types';

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
  const productionOrders = orders.filter(
    (order) => order.deliveryStatus === 'Confirmed' || order.deliveryStatus === 'Preparing'
  );

  const getProductName = (productId: string) => {
    return products.find(p => p.id === productId)?.name || 'Unknown Product';
  }

  return (
    <>
      <PageHeader title="Production Schedule" actions={
        <Button>
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
                        <DropdownMenuItem>View Order Details</DropdownMenuItem>
                        <DropdownMenuItem>Mark as 'Preparing'</DropdownMenuItem>
                        <DropdownMenuItem>Mark as 'Packed'</DropdownMenuItem>
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
