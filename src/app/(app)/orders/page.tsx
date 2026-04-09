import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { orders } from '@/lib/data';
import { MoreHorizontal } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';

const getStatusBadgeVariant = (status: (typeof orders)[0]['deliveryStatus']) => {
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
}

const getStatusBadgeClassName = (status: (typeof orders)[0]['deliveryStatus']) => {
    switch (status) {
        case 'Delivered':
            return 'bg-green-700 hover:bg-green-800';
        case 'Shipped':
            return 'bg-blue-700 hover:bg-blue-800';
        case 'Preparing':
        case 'Packed':
            return 'bg-primary hover:bg-primary/90';
        default:
            return '';
    }
}

export default function OrdersPage() {
  return (
    <>
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
                        <DropdownMenuItem>View order details</DropdownMenuItem>
                        <DropdownMenuItem>Update status</DropdownMenuItem>
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
