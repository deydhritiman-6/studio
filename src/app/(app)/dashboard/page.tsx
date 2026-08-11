'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart';
import { PageHeader } from '@/components/page-header';
import { IndianRupee, ShoppingBag, Crown, Users, ArrowUpRight, Loader2 } from 'lucide-react';
import { Pie, PieChart, Cell } from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { useCollection, useFirestore } from '@/firebase';
import { collection } from 'firebase/firestore';
import type { Order, InventoryItem, Customer, Product } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { formatINR } from '@/lib/currency';

export default function DashboardPage() {
  const firestore = useFirestore();

  const ordersQuery = useMemo(() => (firestore ? collection(firestore, 'orders') : null), [firestore]);
  const inventoryQuery = useMemo(() => (firestore ? collection(firestore, 'inventory') : null), [firestore]);
  const customersQuery = useMemo(() => (firestore ? collection(firestore, 'customers') : null), [firestore]);
  const productsQuery = useMemo(() => (firestore ? collection(firestore, 'products') : null), [firestore]);

  const { data: orders, loading: ordersLoading } = useCollection<Order>(ordersQuery);
  const { data: inventory, loading: inventoryLoading } = useCollection<InventoryItem>(inventoryQuery);
  const { data: customers, loading: customersLoading } = useCollection<Customer>(customersQuery);
  const { data: products } = useCollection<Product>(productsQuery);

  const totalRevenue = useMemo(() => {
    return orders?.reduce((acc, order) => acc + (order.paymentStatus === 'Paid' ? order.totalAmount : 0), 0) || 0;
  }, [orders]);

  const vipCount = useMemo(() => {
    return customers?.filter(c => c.customerType === 'VIP').length || 0;
  }, [customers]);

  const topProductsData = useMemo(() => {
    const productSales: Record<string, number> = {};
    orders?.forEach(order => {
      order.products.forEach(p => {
        const productName = products?.find(prod => prod.id === p.productId)?.name || p.productId;
        productSales[productName] = (productSales[productName] || 0) + p.quantity;
      });
    });

    return Object.entries(productSales)
      .map(([name, sales]) => ({ name, sales }))
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 5);
  }, [orders, products]);

  const topProductsChartConfig = useMemo(() => {
    const config: any = { sales: { label: 'Units Sold' } };
    topProductsData.forEach((p, i) => {
      const key = p.name.replace(/ /g, '-');
      config[key] = { 
        label: p.name, 
        color: `hsl(var(--chart-${(i % 6) + 1}))` 
      };
    });
    return config;
  }, [topProductsData]);

  const kpiData = [
    { title: 'Total Revenue', value: formatINR(totalRevenue), icon: IndianRupee, change: '+12.5% vs last month', loading: ordersLoading },
    { title: 'Total Orders', value: (orders?.length || 0).toString(), icon: ShoppingBag, change: '+15.2% vs last month', loading: ordersLoading },
    { title: 'Active Customers', value: (customers?.length || 0).toString(), icon: Users, change: '+80 this month', loading: customersLoading },
    { title: 'VIP Members', value: vipCount.toString(), icon: Crown, change: '+3 this month', loading: customersLoading },
  ];

  const recentOrders = useMemo(() => orders?.slice(0, 5) || [], [orders]);
  const lowStockItems = useMemo(() => inventory?.filter(item => item.status === 'Low Stock') || [], [inventory]);

  return (
    <>
      <PageHeader title="Command Center" />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {kpiData.map((kpi) => (
          <Card key={kpi.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
              <kpi.icon className="h-5 w-5 text-accent" />
            </CardHeader>
            <CardContent>
              {kpi.loading ? (
                <Skeleton className="h-8 w-24 mb-1" />
              ) : (
                <div className="text-2xl font-bold font-headline">{kpi.value}</div>
              )}
              <p className="text-xs text-muted-foreground">{kpi.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <Card className="lg:col-span-1 flex flex-col">
          <CardHeader>
            <CardTitle>Top Selling Creations</CardTitle>
            <CardDescription>Real-time market performance.</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 pb-6 flex items-center justify-center">
             {topProductsData.length > 0 ? (
                <ChartContainer config={topProductsChartConfig} className="mx-auto aspect-square w-full max-h-[300px] flex items-center justify-center">
                  <PieChart>
                    <ChartTooltip
                        cursor={true}
                        content={<ChartTooltipContent hideLabel indicator="dot" />}
                    />
                    <Pie 
                      data={topProductsData} 
                      dataKey="sales" 
                      nameKey="name" 
                      cx="50%" 
                      cy="50%" 
                      innerRadius="60%"
                      strokeWidth={2}
                      paddingAngle={2}
                    >
                      {topProductsData.map((entry, i) => (
                        <Cell key={`cell-${entry.name}`} fill={`var(--color-${entry.name.replace(/ /g, '-')})`} />
                      ))}
                    </Pie>
                    <ChartLegend 
                      content={<ChartLegendContent nameKey="name" />}
                      className="-translate-y-2 flex-wrap gap-2 [&>*]:basis-1/2 [&>*]:justify-start"
                    />
                  </PieChart>
                </ChartContainer>
             ) : (
               <div className="flex items-center justify-center h-full text-muted-foreground text-sm italic">
                  Awaiting order data...
               </div>
             )}
          </CardContent>
        </Card>
        
        <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Recent Orders</CardTitle>
              <CardDescription>
                Latest interactions from the artisan portal.
              </CardDescription>
            </CardHeader>
            <CardContent>
               <div className="overflow-x-auto">
                 <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ordersLoading ? (
                      [...Array(5)].map((_, i) => (
                        <TableRow key={i}>
                          <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                          <TableCell className="text-right"><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                        </TableRow>
                      ))
                    ) : recentOrders.length > 0 ? (
                      recentOrders.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell>
                            <div className="font-medium">{order.customerName}</div>
                            <div className="hidden text-sm text-muted-foreground md:inline">
                              {order.id}
                            </div>
                          </TableCell>
                           <TableCell>{order.deliveryStatus}</TableCell>
                          <TableCell className="text-right">{formatINR(order.totalAmount)}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                          No orders recorded yet.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
               </div>
            </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 mt-6 md:grid-cols-1">
         <Card>
          <CardHeader className="flex flex-row items-center">
            <div className="grid gap-2">
              <CardTitle>Inventory Criticality</CardTitle>
              <CardDescription>
                Items requiring immediate artisan restocking.
              </CardDescription>
            </div>
            <Button asChild size="sm" className="ml-auto gap-1" variant="outline">
              <Link href="/inventory" prefetch={false}>
                Sync Inventory
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Level</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inventoryLoading ? (
                    [...Array(3)].map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-4 w-12 ml-auto" /></TableCell>
                      </TableRow>
                    ))
                  ) : lowStockItems.length > 0 ? (
                    lowStockItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell>{item.category}</TableCell>
                        <TableCell className="text-right">
                          <span className="inline-block animate-bell-shake text-lg font-bold text-yellow-500">
                            {item.stockLevel}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} className="h-24 text-center">
                        All kitchen stores are currently at optimal levels.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
