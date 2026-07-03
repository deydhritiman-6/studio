'use client';

import { useState, useMemo } from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { analyzeCustomerAction } from './actions';
import type { AnalyzeVIPCustomerBehaviorOutput, AnalyzeVIPCustomerBehaviorInput } from '@/ai/flows/analyze-vip-customer-behavior';
import { BrainCircuit, Loader2, List, BarChart3, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { useCollection, useFirestore } from '@/firebase';
import { collection } from 'firebase/firestore';
import type { Customer, Order, Product } from '@/lib/types';

export default function VipClientsPage() {
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [analysis, setAnalysis] = useState<AnalyzeVIPCustomerBehaviorOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const firestore = useFirestore();
  const customersQuery = useMemo(() => (firestore ? collection(firestore, 'customers') : null), [firestore]);
  const ordersQuery = useMemo(() => (firestore ? collection(firestore, 'orders') : null), [firestore]);
  const productsQuery = useMemo(() => (firestore ? collection(firestore, 'products') : null), [firestore]);

  const { data: customers } = useCollection<Customer>(customersQuery);
  const { data: orders } = useCollection<Order>(ordersQuery);
  const { data: products } = useCollection<Product>(productsQuery);

  const vipCustomers = customers?.filter(c => c.customerType === 'VIP') || [];

  async function handleAnalyze() {
    if (!selectedCustomerId || !customers || !orders || !products) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please select a VIP client to analyze.',
      });
      return;
    }

    const customer = customers.find(c => c.id === selectedCustomerId);
    if (!customer) return;

    setIsLoading(true);
    setAnalysis(null);

    const customerOrders = orders.filter((o) => o.customerId === selectedCustomerId);
    const purchaseHistory = customerOrders.map(order => ({
        orderId: order.id,
        orderDate: order.orderDate,
        totalAmount: order.totalAmount,
        products: order.products.map(p => products.find(prod => prod.id === p.productId)?.name || 'Unknown Product'),
    }));

    const input: AnalyzeVIPCustomerBehaviorInput = {
        customerId: customer.id,
        customerProfile: {
            name: customer.name,
            email: customer.email,
            vipLevel: customer.vipLevel,
            customerType: customer.customerType,
            totalPurchaseValue: customer.totalPurchaseValue,
        },
        purchaseHistory,
        interactionLogs: [], // Could be expanded later
        feedback: [], // Could be expanded later
    };

    const result = await analyzeCustomerAction(input);
    setIsLoading(false);

    if ('error' in result) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: result.error,
      });
    } else {
      setAnalysis(result);
    }
  }
  
  const selectedCustomer = customers?.find(c => c.id === selectedCustomerId);

  return (
    <>
      <PageHeader title="VIP Client Intelligence" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Select a Client</CardTitle>
            <CardDescription>Choose a VIP client to generate behavioral insights.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
             <div className="space-y-2">
                <label className="text-sm font-medium">VIP Client</label>
                <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select a client..." />
                    </SelectTrigger>
                    <SelectContent>
                        {vipCustomers.map(customer => (
                        <SelectItem key={customer.id} value={customer.id}>{customer.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <Button onClick={handleAnalyze} disabled={isLoading || !selectedCustomerId} className="w-full">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <BrainCircuit className="mr-2 h-4 w-4" />
                  Generate Insights
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <div className="lg:col-span-2">
          {isLoading && <AnalysisSkeleton />}
          
          {analysis && selectedCustomer && (
            <div className="space-y-6">
                <h2 className="text-2xl font-headline font-bold">Analysis for {selectedCustomer.name}</h2>
              <Card>
                <CardHeader className="flex flex-row items-center gap-4">
                  <BarChart3 className="h-6 w-6 text-accent" />
                  <CardTitle>Behavioral Patterns</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                    {analysis.behavioralPatterns.map((pattern, i) => <li key={i}>{pattern}</li>)}
                  </ul>
                </CardContent>
              </Card>

               <Card>
                <CardHeader className="flex flex-row items-center gap-4">
                  <User className="h-6 w-6 text-accent" />
                  <CardTitle>Customer Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{analysis.summary}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center gap-4">
                  <List className="h-6 w-6 text-accent" />
                  <CardTitle>Recommended Actions</CardTitle>
                </CardHeader>
                <CardContent>
                   <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                    {analysis.recommendedActions.map((action, i) => <li key={i}>{action}</li>)}
                  </ul>
                </CardContent>
              </Card>
            </div>
          )}

          {!isLoading && !analysis && (
            <div className="flex flex-col items-center justify-center h-full rounded-lg border-2 border-dashed border-border text-center p-8">
              <BrainCircuit className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold font-headline">Unlock Deeper Customer Understanding</h3>
              <p className="text-muted-foreground mt-2 max-w-sm">
                Select a VIP client and let our AI provide actionable insights to enhance your relationship and drive growth.
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function AnalysisSkeleton() {
    return (
        <div className="space-y-6 animate-pulse">
            <div className="space-y-2">
                <Skeleton className="h-8 w-1/2" />
            </div>
            {[...Array(3)].map((_, i) => (
                 <Card key={i}>
                    <CardHeader className="flex flex-row items-center gap-4">
                        <Skeleton className="h-6 w-6 rounded-full" />
                        <Skeleton className="h-6 w-1/3" />
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-5/6" />
                        <Skeleton className="h-4 w-full" />
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}
