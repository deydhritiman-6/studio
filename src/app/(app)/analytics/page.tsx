'use client';

import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { getDemandForecastAction } from './actions';
import type { DemandForecastOutput } from '@/ai/flows/forecast-chocolate-demand';
import { Bot, Loader2, TrendingUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useCollection, useFirestore } from '@/firebase';
import { collection } from 'firebase/firestore';
import type { Product, Order } from '@/lib/types';

const formSchema = z.object({
  productId: z.string().min(1, { message: 'Please select a product.' }),
  seasonalTrends: z.string().optional(),
  upcomingEvents: z.string().optional(),
});

export default function AnalyticsPage() {
  const [forecast, setForecast] = useState<DemandForecastOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const firestore = useFirestore();
  const productsQuery = useMemo(() => (firestore ? collection(firestore, 'products') : null), [firestore]);
  const ordersQuery = useMemo(() => (firestore ? collection(firestore, 'orders') : null), [firestore]);
  
  const { data: products } = useCollection<Product>(productsQuery);
  const { data: orders } = useCollection<Order>(ordersQuery);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      productId: '',
      seasonalTrends: '',
      upcomingEvents: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!products || !orders) return;

    const product = products.find(p => p.id === values.productId);
    if (!product) return;

    setIsLoading(true);
    setForecast(null);

    // Filter orders to get historical sales for this product
    const historicalSalesData = orders
      .filter(order => order.products.some(p => p.productId === product.id))
      .map(order => ({
        date: order.orderDate,
        salesCount: order.products.find(p => p.productId === product.id)?.quantity || 0
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const result = await getDemandForecastAction({
      productId: product.id,
      productName: product.name,
      historicalSalesData,
      seasonalTrends: values.seasonalTrends,
      upcomingEvents: values.upcomingEvents,
    });
    
    setIsLoading(false);

    if ('error' in result) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: result.error,
      });
    } else {
      setForecast(result);
    }
  }
  
  const selectedProductName = products?.find(p => p.id === form.getValues('productId'))?.name;

  return (
    <>
      <PageHeader title="AI Demand Forecasting" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Forecast Demand</CardTitle>
            <CardDescription>Select a product and provide context to generate a sales forecast.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="productId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a product to forecast" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {products?.map((product) => (
                            <SelectItem key={product.id} value={product.id}>{product.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="seasonalTrends"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Seasonal Trends (Optional)</FormLabel>
                      <FormControl>
                        <Textarea placeholder="e.g., Higher demand during Diwali season" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="upcomingEvents"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Upcoming Events (Optional)</FormLabel>
                      <FormControl>
                        <Textarea placeholder="e.g., Valentine's Day promotion next month" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={isLoading} className="w-full">
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Forecasting...
                    </>
                  ) : (
                    <>
                      <TrendingUp className="mr-2 h-4 w-4" />
                      Generate Forecast
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
        <div className="lg:col-span-2">
          {isLoading && <ForecastSkeleton />}

          {forecast && (
             <Card>
                <CardHeader>
                    <CardTitle>Forecast for {selectedProductName}</CardTitle>
                    <CardDescription>{forecast.reasoning}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <h4 className="font-semibold">Confidence Score</h4>
                            <span className="font-bold text-lg text-primary">{forecast.confidenceScore}%</span>
                        </div>
                        <Progress value={forecast.confidenceScore} />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-center">
                        {forecast.forecastedDemand.map(demand => (
                            <div key={demand.period} className="p-4 bg-muted rounded-lg">
                                <p className="text-sm text-muted-foreground">{demand.period}</p>
                                <p className="text-3xl font-bold font-headline">{demand.predictedSales.toLocaleString()}</p>
                                <p className="text-sm text-muted-foreground">Predicted Sales</p>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
          )}

          {!isLoading && !forecast && (
            <div className="flex flex-col items-center justify-center h-full rounded-lg border-2 border-dashed border-border text-center p-8">
              <Bot className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold font-headline">Predict Your Next Move</h3>
              <p className="text-muted-foreground mt-2 max-w-sm">
                Leverage AI to forecast product demand based on historical data and market trends.
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}


function ForecastSkeleton() {
    return (
        <Card className="animate-pulse">
            <CardHeader>
                <Skeleton className="h-7 w-2/3" />
                <Skeleton className="h-4 w-full mt-2" />
                <Skeleton className="h-4 w-5/6 mt-1" />
            </CardHeader>
            <CardContent className="space-y-6">
                 <div>
                    <div className="flex justify-between items-center mb-2">
                        <Skeleton className="h-5 w-1/4" />
                        <Skeleton className="h-7 w-1/6" />
                    </div>
                    <Skeleton className="h-4 w-full" />
                </div>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 bg-muted rounded-lg space-y-2">
                        <Skeleton className="h-4 w-1/2 mx-auto" />
                        <Skeleton className="h-8 w-1/3 mx-auto" />
                        <Skeleton className="h-4 w-1/2 mx-auto" />
                    </div>
                    <div className="p-4 bg-muted rounded-lg space-y-2">
                        <Skeleton className="h-4 w-1/2 mx-auto" />
                        <Skeleton className="h-8 w-1/3 mx-auto" />
                        <Skeleton className="h-4 w-1/2 mx-auto" />
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
