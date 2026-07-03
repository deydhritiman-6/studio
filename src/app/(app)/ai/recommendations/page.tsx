'use client';

import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { getChocolateRecommendationsAction } from './actions';
import type { RecommendChocolateOutput } from '@/ai/flows/recommend-chocolate';
import { Lightbulb, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useCollection, useFirestore } from '@/firebase';
import { collection } from 'firebase/firestore';
import type { Customer, Order, Product } from '@/lib/types';
import Image from 'next/image';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const formSchema = z.object({
  customerId: z.string().min(1, 'Customer selection is required'),
});

export default function RecommendationsPage() {
  const [recommendations, setRecommendations] = useState<RecommendChocolateOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const firestore = useFirestore();
  const customersQuery = useMemo(() => (firestore ? collection(firestore, 'customers') : null), [firestore]);
  const ordersQuery = useMemo(() => (firestore ? collection(firestore, 'orders') : null), [firestore]);
  const productsQuery = useMemo(() => (firestore ? collection(firestore, 'products') : null), [firestore]);

  const { data: customers } = useCollection<Customer>(customersQuery);
  const { data: orders } = useCollection<Order>(ordersQuery);
  const { data: products } = useCollection<Product>(productsQuery);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customerId: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!customers || !orders || !products) return;

    setIsLoading(true);
    setRecommendations(null);

    const customerOrders = orders.filter((o) => o.customerId === values.customerId);
    const purchaseHistory = customerOrders.flatMap((order) =>
      order.products.map((p) => {
        const productDetails = products.find((prod) => prod.id === p.productId);
        return {
          productId: p.productId,
          productName: productDetails?.name || 'Unknown',
          flavor: productDetails?.flavor || 'Unknown',
          quantity: p.quantity,
        };
      })
    );

    const result = await getChocolateRecommendationsAction(values.customerId, purchaseHistory);
    setIsLoading(false);

    if ('error' in result) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: result.error,
      });
    } else {
      setRecommendations(result);
    }
  }

  const getProductImage = (productId: string) => {
    return products?.find(p => p.id === productId)?.imageUrls?.[0] || 'https://picsum.photos/seed/default/400/300';
  }

  const getProductImageHint = (productId: string) => {
    return products?.find(p => p.id === productId)?.imageHint || 'chocolate';
  }
  
  const selectedCustomerName = customers?.find(c => c.id === form.getValues('customerId'))?.name;

  return (
    <>
      <PageHeader title="AI Recommendation Engine" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Get Recommendations</CardTitle>
            <CardDescription>Select a customer to generate personalized chocolate recommendations.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="customerId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Customer</FormLabel>
                       <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a customer" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                           {customers?.map((customer) => (
                            <SelectItem key={customer.id} value={customer.id}>{customer.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={isLoading || !form.getValues('customerId')} className="w-full">
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Lightbulb className="mr-2 h-4 w-4" />
                      Generate
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
        <div className="lg:col-span-2">
          {isLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[...Array(3)].map((_, i) => (
                 <Card key={i} className="animate-pulse">
                    <div className="bg-muted aspect-[4/3] rounded-t-lg"></div>
                    <CardHeader>
                        <div className="h-5 bg-muted rounded w-3/4"></div>
                    </CardHeader>
                    <CardContent>
                        <div className="h-4 bg-muted rounded w-full"></div>
                        <div className="h-4 bg-muted rounded w-5/6 mt-2"></div>
                    </CardContent>
                </Card>
              ))}
            </div>
          )}
          {recommendations && (
            <>
            <h2 className="text-2xl font-headline font-bold mb-4">Recommendations for {selectedCustomerName}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {recommendations.recommendations.map((rec) => (
                <Card key={rec.productId}>
                    <div className="aspect-[4/3] relative">
                        <Image src={getProductImage(rec.productId)} alt={rec.productName} fill className="rounded-t-lg object-cover" data-ai-hint={getProductImageHint(rec.productId)} />
                    </div>
                  <CardHeader>
                    <CardTitle className="font-headline">{rec.productName}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{rec.reason}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
            </>
          )}
           {!isLoading && !recommendations && (
             <div className="flex flex-col items-center justify-center h-full rounded-lg border-2 border-dashed border-border text-center p-8">
                <Lightbulb className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold font-headline">AI-Powered Insights Await</h3>
                <p className="text-muted-foreground mt-2 max-w-sm">
                    Select a customer and let our AI discover the perfect chocolates to delight them.
                </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
