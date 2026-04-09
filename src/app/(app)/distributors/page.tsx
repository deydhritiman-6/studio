import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { distributors } from '@/lib/data';
import type { Distributor } from '@/lib/types';
import { MoreHorizontal, PlusCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';

const getStatusBadgeClassName = (status: Distributor['status']) => {
    switch (status) {
        case 'Active':
            return 'bg-green-700 hover:bg-green-800';
        default:
            return '';
    }
}

export default function DistributorsPage() {
  return (
    <>
      <PageHeader title="Distributors" actions={
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Distributor
        </Button>
      } />
      <Card>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Distributor Name</TableHead>
                <TableHead>Contact Person</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Region</TableHead>
                <TableHead>Status</TableHead>
                <TableHead><span className="sr-only">Actions</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {distributors.map((distributor) => (
                <TableRow key={distributor.id}>
                  <TableCell className="font-medium">{distributor.name}</TableCell>
                  <TableCell>{distributor.contactPerson}</TableCell>
                  <TableCell>{distributor.email}</TableCell>
                  <TableCell>{distributor.region}</TableCell>
                  <TableCell>
                    <Badge variant={distributor.status === 'Active' ? 'default' : 'destructive'} className={getStatusBadgeClassName(distributor.status)}>
                      {distributor.status}
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
                        <DropdownMenuItem>View details</DropdownMenuItem>
                        <DropdownMenuItem>Edit distributor</DropdownMenuItem>
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
