import { PageHeader } from '@/components/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { inventory } from '@/lib/data';
import type { InventoryItem } from '@/lib/types';
import { Badge } from '@/components/ui/badge';

const renderInventoryTable = (items: InventoryItem[]) => (
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead>Item Name</TableHead>
        <TableHead>Stock Level</TableHead>
        <TableHead>Status</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {items.map((item) => (
        <TableRow key={item.id}>
          <TableCell className="font-medium">{item.name}</TableCell>
          <TableCell>{item.stockLevel}</TableCell>
          <TableCell>
            <Badge variant={item.status === 'In Stock' ? 'default' : item.status === 'Low Stock' ? 'secondary' : 'destructive'}
              className={item.status === 'In Stock' ? 'bg-green-700 hover:bg-green-800' : item.status === 'Low Stock' ? 'bg-yellow-500 text-black hover:bg-yellow-600' : ''}>
              {item.status}
            </Badge>
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
);

export default function InventoryPage() {
  const rawMaterials = inventory.filter(item => item.category === 'Raw Materials');
  const packagingMaterials = inventory.filter(item => item.category === 'Packaging Materials');
  const finishedProducts = inventory.filter(item => item.category === 'Finished Products');

  return (
    <>
      <PageHeader title="Inventory" />
      <Card>
        <CardContent className="p-0">
          <Tabs defaultValue="raw_materials">
            <div className="p-4 border-b">
              <TabsList>
                <TabsTrigger value="raw_materials">Raw Materials</TabsTrigger>
                <TabsTrigger value="packaging">Packaging Materials</TabsTrigger>
                <TabsTrigger value="finished_products">Finished Products</TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value="raw_materials" className="p-4">
              {renderInventoryTable(rawMaterials)}
            </TabsContent>
            <TabsContent value="packaging" className="p-4">
              {renderInventoryTable(packagingMaterials)}
            </TabsContent>
            <TabsContent value="finished_products" className="p-4">
              {renderInventoryTable(finishedProducts)}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </>
  );
}
