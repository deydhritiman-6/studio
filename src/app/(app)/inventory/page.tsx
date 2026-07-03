'use client';

import { useState, useMemo, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { InventoryItem, Product } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, MoreHorizontal, Loader2, Trash2, Edit } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useCollection, useFirestore } from '@/firebase';
import { collection, doc, setDoc, deleteDoc, query, where, getDocs, updateDoc } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { Skeleton } from '@/components/ui/skeleton';

const inventoryFormSchema = z.object({
  name: z.string().min(1, 'Item name is required'),
  category: z.enum(['Raw Materials', 'Packaging Materials', 'Finished Products']),
  stockLevel: z.coerce.number().min(0, 'Stock level cannot be negative'),
  status: z.enum(['In Stock', 'Low Stock', 'Out of Stock']),
});

type InventoryFormValues = z.infer<typeof inventoryFormSchema>;

export default function InventoryPage() {
  const firestore = useFirestore();
  const inventoryQuery = useMemo(() => (firestore ? collection(firestore, 'inventory') : null), [firestore]);
  const { data: inventory, loading } = useCollection<InventoryItem>(inventoryQuery);

  const productsQuery = useMemo(() => (firestore ? collection(firestore, 'products') : null), [firestore]);
  const { data: products } = useCollection<Product>(productsQuery);

  const [isAddOrEditDialogOpen, setIsAddOrEditDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const { toast } = useToast();

  const form = useForm<InventoryFormValues>({
    resolver: zodResolver(inventoryFormSchema),
    defaultValues: {
      name: '',
      category: 'Raw Materials',
      stockLevel: 0,
      status: 'In Stock',
    },
  });

  const selectedCategory = form.watch('category');

  useEffect(() => {
    if (editingItem) {
      form.reset({
        name: editingItem.name,
        category: editingItem.category,
        stockLevel: editingItem.stockLevel,
        status: editingItem.status,
      });
    } else {
      form.reset({
        name: '',
        category: 'Raw Materials',
        stockLevel: 0,
        status: 'In Stock',
      });
    }
  }, [editingItem, form]);

  const onDialogSubmit = (values: InventoryFormValues) => {
    if (!firestore) return;

    const id = editingItem?.id || `INV-${Date.now()}`;
    const itemRef = doc(firestore, 'inventory', id);
    const itemData = { ...values, id };

    setDoc(itemRef, itemData)
      .then(() => {
        setIsAddOrEditDialogOpen(false);
        setEditingItem(null);
        toast({
          title: editingItem ? 'Item Updated' : 'Item Added',
          description: `${values.name} has been saved to inventory.`,
        });

        // Sync with products collection if it's a finished product
        if (values.category === 'Finished Products') {
          const productsRef = collection(firestore, 'products');
          const q = query(productsRef, where('name', '==', values.name));
          
          getDocs(q).then((snapshot) => {
            snapshot.forEach((productDoc) => {
              updateDoc(productDoc.ref, { 
                availabilityStatus: values.status === 'Out of Stock' ? 'Out of Stock' : 'In Stock' 
              });
            });
          });
        }
      })
      .catch(async (error) => {
        const permissionError = new FirestorePermissionError({
          path: itemRef.path,
          operation: editingItem ? 'update' : 'create',
          requestResourceData: itemData,
        });
        errorEmitter.emit('permission-error', permissionError);
      });
  };

  const handleDeleteItem = (item: InventoryItem) => {
    if (!firestore) return;

    const itemRef = doc(firestore, 'inventory', item.id);
    deleteDoc(itemRef)
      .then(() => {
        toast({
          title: 'Item Deleted',
          description: `${item.name} has been removed from inventory.`,
        });

        // If it was a finished product, mark it as out of stock in products
        if (item.category === 'Finished Products') {
           const productsRef = collection(firestore, 'products');
           const q = query(productsRef, where('name', '==', item.name));
           getDocs(q).then(snapshot => {
              snapshot.forEach(productDoc => {
                updateDoc(productDoc.ref, { availabilityStatus: 'Out of Stock' });
              });
           });
        }
      })
      .catch(async (error) => {
        const permissionError = new FirestorePermissionError({
          path: itemRef.path,
          operation: 'delete',
        });
        errorEmitter.emit('permission-error', permissionError);
      });
  };

  const renderInventoryTable = (items: InventoryItem[]) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Item Name</TableHead>
          <TableHead>Stock Level</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="w-[80px]"><span className="sr-only">Actions</span></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items && items.length > 0 ? (
          items.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="font-medium">{item.name}</TableCell>
              <TableCell>{item.stockLevel}</TableCell>
              <TableCell>
                <Badge
                  variant={item.status === 'In Stock' ? 'default' : item.status === 'Low Stock' ? 'secondary' : 'destructive'}
                  className={
                    item.status === 'In Stock'
                      ? 'bg-green-700 hover:bg-green-800'
                      : item.status === 'Low Stock'
                      ? 'bg-yellow-500 text-black hover:bg-yellow-600'
                      : ''
                  }
                >
                  {item.status}
                </Badge>
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => { setEditingItem(item); setIsAddOrEditDialogOpen(true); }}>
                      <Edit className="mr-2 h-4 w-4" /> Edit Item
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteItem(item)}>
                      <Trash2 className="mr-2 h-4 w-4" /> Delete Item
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
              No items found in this category.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );

  const TableSkeleton = () => (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead><Skeleton className="h-4 w-32" /></TableHead>
            <TableHead><Skeleton className="h-4 w-20" /></TableHead>
            <TableHead><Skeleton className="h-4 w-24" /></TableHead>
            <TableHead className="w-[80px]"><Skeleton className="h-4 w-8" /></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {[...Array(5)].map((_, i) => (
            <TableRow key={i}>
              <TableCell><Skeleton className="h-4 w-40" /></TableCell>
              <TableCell><Skeleton className="h-4 w-12" /></TableCell>
              <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
              <TableCell><Skeleton className="h-8 w-8 rounded-md" /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );

  const rawMaterials = inventory?.filter((item) => item.category === 'Raw Materials') || [];
  const packagingMaterials = inventory?.filter((item) => item.category === 'Packaging Materials') || [];
  const finishedProducts = inventory?.filter((item) => item.category === 'Finished Products') || [];

  return (
    <>
      <PageHeader
        title="Inventory"
        actions={
          <Button onClick={() => { setEditingItem(null); setIsAddOrEditDialogOpen(true); }}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add Item
          </Button>
        }
      />

      <Dialog open={isAddOrEditDialogOpen} onOpenChange={setIsAddOrEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Edit Inventory Item' : 'Add New Inventory Item'}</DialogTitle>
            <DialogDescription>
              Update stock levels and item details. Changes reflect in real-time.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onDialogSubmit)} className="space-y-4 py-4">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Raw Materials">Raw Materials</SelectItem>
                        <SelectItem value="Packaging Materials">Packaging Materials</SelectItem>
                        <SelectItem value="Finished Products">Finished Products</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Item Name</FormLabel>
                    {selectedCategory === 'Finished Products' ? (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a product" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {products?.map((p) => (
                            <SelectItem key={p.id} value={p.name}>
                              {p.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <FormControl>
                        <Input placeholder="e.g., Organic Cocoa Butter" {...field} />
                      </FormControl>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="stockLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Stock Level</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Availability Status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="In Stock">In Stock</SelectItem>
                          <SelectItem value="Low Stock">Low Stock</SelectItem>
                          <SelectItem value="Out of Stock">Out of Stock</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <DialogFooter className="pt-4">
                <DialogClose asChild>
                  <Button type="button" variant="secondary">Cancel</Button>
                </DialogClose>
                <Button type="submit">Save Changes</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Card>
        <CardContent className="p-0">
          <Tabs defaultValue="raw_materials">
            <div className="border-b p-4">
              <TabsList>
                <TabsTrigger value="raw_materials">Raw Materials</TabsTrigger>
                <TabsTrigger value="packaging">Packaging Materials</TabsTrigger>
                <TabsTrigger value="finished_products">Finished Products</TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value="raw_materials" className="p-4">
              {loading ? <TableSkeleton /> : renderInventoryTable(rawMaterials)}
            </TabsContent>
            <TabsContent value="packaging" className="p-4">
              {loading ? <TableSkeleton /> : renderInventoryTable(packagingMaterials)}
            </TabsContent>
            <TabsContent value="finished_products" className="p-4">
              {loading ? <TableSkeleton /> : renderInventoryTable(finishedProducts)}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </>
  );
}
