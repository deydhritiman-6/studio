'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { products as initialProducts } from '@/lib/data';
import type { Product } from '@/lib/types';
import { PlusCircle } from 'lucide-react';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

const productFormSchema = z.object({
  name: z.string().min(1, 'Product name is required.'),
  flavor: z.string().min(1, 'Flavor profile is required.'),
  price: z.coerce.number().positive('Price must be a positive number.'),
  wholesalePrice: z.coerce.number().positive('Wholesale price must be a positive number.'),
  availabilityStatus: z.enum(['In Stock', 'Out of Stock']),
});

type ProductFormValues = z.infer<typeof productFormSchema>;

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const { toast } = useToast();

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
  });

  useEffect(() => {
    if (editingProduct) {
      form.reset({
        name: editingProduct.name,
        flavor: editingProduct.flavor,
        price: editingProduct.price,
        wholesalePrice: editingProduct.wholesalePrice,
        availabilityStatus: editingProduct.availabilityStatus,
      });
    } else {
      form.reset({
        name: '',
        flavor: '',
        price: 0,
        wholesalePrice: 0,
        availabilityStatus: 'In Stock',
      });
    }
  }, [editingProduct, form]);

  function onAddSubmit(values: ProductFormValues) {
    const newProduct: Product = {
      id: `P${String(products.length + 10).padStart(3, '0')}`,
      ...values,
      imageUrl: `https://picsum.photos/seed/${Math.random()}/400/300`,
      imageHint: values.name.toLowerCase().split(' ').slice(0, 2).join(' '),
    };
    setProducts([newProduct, ...products]);
    setIsAddDialogOpen(false);
    toast({
      title: 'Product Added',
      description: `${newProduct.name} has been successfully added.`,
    });
  }

  function onEditSubmit(values: ProductFormValues) {
    if (!editingProduct) return;

    setProducts(
      products.map((p) =>
        p.id === editingProduct.id ? { ...p, ...values } : p
      )
    );
    setEditingProduct(null);
    toast({
      title: 'Product Updated',
      description: `The details for ${values.name} have been updated.`,
    });
  }

  const activeDialog = editingProduct ? 'edit' : (isAddDialogOpen ? 'add' : null);
  const onDialogSubmit = editingProduct ? onEditSubmit : onAddSubmit;

  return (
    <>
      <Dialog open={!!activeDialog} onOpenChange={(open) => {
        if (!open) {
          setEditingProduct(null);
          setIsAddDialogOpen(false);
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{activeDialog === 'edit' ? 'Edit Product' : 'Add New Product'}</DialogTitle>
            <DialogDescription>
              {activeDialog === 'edit' ? 'Update the details for this product.' : 'Fill in the details for the new product.'}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onDialogSubmit)} className="space-y-4 py-4">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Product Name</FormLabel>
                  <FormControl><Input placeholder="e.g., Velvet Noir 85%" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="flavor" render={({ field }) => (
                <FormItem>
                  <FormLabel>Flavor Profile</FormLabel>
                  <FormControl><Input placeholder="e.g., Dark Chocolate" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="price" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Retail Price (₹)</FormLabel>
                    <FormControl><Input type="number" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="wholesalePrice" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Wholesale Price (₹)</FormLabel>
                    <FormControl><Input type="number" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <FormField control={form.control} name="availabilityStatus" render={({ field }) => (
                <FormItem>
                  <FormLabel>Availability</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="In Stock">In Stock</SelectItem>
                      <SelectItem value="Out of Stock">Out of Stock</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <DialogFooter>
                 <DialogClose asChild>
                    <Button type="button" variant="secondary">Cancel</Button>
                </DialogClose>
                <Button type="submit">Save Changes</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      <PageHeader title="Products" actions={
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Product
        </Button>
      } />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {products.map((product) => (
          <Card key={product.id} className="flex flex-col">
            <CardHeader className="p-0 relative">
              <Image
                src={product.imageUrl}
                alt={product.name}
                width={400}
                height={300}
                className="object-cover rounded-t-lg aspect-[4/3]"
                data-ai-hint={product.imageHint}
              />
            </CardHeader>
            <CardContent className="p-4 flex-grow">
              <CardTitle className="font-headline text-lg mb-1">{product.name}</CardTitle>
              <p className="text-sm text-muted-foreground">{product.flavor}</p>
              <div className="flex justify-between items-center mt-4">
                <p className="text-lg font-semibold">₹{product.price}</p>
                 <Badge variant={product.availabilityStatus === 'In Stock' ? 'default' : 'destructive'} className={product.availabilityStatus === 'In Stock' ? 'bg-green-700 hover:bg-green-800' : ''}>
                    {product.availabilityStatus}
                </Badge>
              </div>
            </CardContent>
            <CardFooter className="p-4 pt-0">
              <Button variant="outline" className="w-full" onClick={() => setEditingProduct(product)}>
                Edit Product
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </>
  );
}
