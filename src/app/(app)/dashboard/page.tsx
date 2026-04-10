'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart';
import { PageHeader } from '@/components/page-header';
import { performanceData, topProductsData, orders, inventory, customers } from '@/lib/data';
import type { PerformanceDataPoint } from '@/lib/types';
import { IndianRupee, ShoppingBag, Crown, Users, ArrowUpRight } from 'lucide-react';
import { Pie, PieChart, ResponsiveContainer, XAxis, YAxis, Cell, CartesianGrid, Line, LineChart } from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

export default function DashboardPage() {
  const [metric, setMetric] = useState<'Revenue' | 'Sales' | 'Orders' | 'Customers'>('Revenue');

  const kpiData = [
    { title: 'Total Revenue', value: '₹45,23,189', icon: IndianRupee, change: '+12.5% this month' },
    { title: 'Total Orders', value: '2,350', icon: ShoppingBag, change: '+15.2% this month' },
    { title: 'Active Customers', value: '1,245', icon: Users, change: '+80 this month' },
    { title: 'VIP Members', value: '48', icon: Crown, change: '+3 this month' },
  ];
  
  const topProductsChartConfig = {
    sales: { label: 'Sales' },
    "Velvet-Noir-85%-Cacao": { label: "Velvet Noir 85% Cacao", color: "green" },
    "Golden-Hazelnut-Praline": { label: "Golden Hazelnut Praline", color: "yellow" },
    "Himalayan-Pink-Salt-Caramel": { label: "Himalayan Pink Salt Caramel", color: "cyan" },
    "Royal-Raspberry-Ganache": { label: "Royal Raspberry Ganache", color: "magenta" },
    "Classic-Milk-Chocolate-Bar": { label: "Classic Milk Chocolate Bar", color: "crimson" },
  } satisfies import('@/components/ui/chart').ChartConfig;

  const performanceChartConfig = {
    previous: { label: 'Previous 6 Months', color: 'hsl(var(--chart-2))' },
    current: { label: 'Current 6 Months', color: 'hsl(var(--destructive))' },
  } satisfies import('@/components/ui/chart').ChartConfig;

  const metricConfig = {
    Revenue: {
      keys: { previous: 'previousRevenue', current: 'currentRevenue' },
      formatter: (value: number) => `₹${(value / 1000).toFixed(0)}k`,
      tooltipFormatter: (value: number) => `₹${value.toLocaleString()}`,
    },
    Sales: {
      keys: { previous: 'previousSales', current: 'currentSales' },
      formatter: (value: number) => value.toLocaleString(),
      tooltipFormatter: (value: number) => value.toLocaleString(),
    },
    Orders: {
      keys: { previous: 'previousOrders', current: 'currentOrders' },
      formatter: (value: number) => value.toLocaleString(),
      tooltipFormatter: (value: number) => value.toLocaleString(),
    },
    Customers: {
      keys: { previous: 'previousCustomers', current: 'currentCustomers' },
      formatter: (value: number) => value.toLocaleString(),
      tooltipFormatter: (value: number) => value.toLocaleString(),
    },
  };

  const currentMetricConfig = metricConfig[metric];

  const recentOrders = orders.slice(0, 5);
  const lowStockItems = inventory.filter(item => item.status === 'Low Stock');


  return (
    <>
      <PageHeader title="Dashboard" />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {kpiData.map((kpi) => (
          <Card key={kpi.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
              <kpi.icon className="h-5 w-5 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-headline">{kpi.value}</div>
              <p className="text-xs text-muted-foreground">{kpi.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle>Performance Comparison</CardTitle>
                <CardDescription>
                  Comparing the last 6 months with the previous 6 months.
                </CardDescription>
              </div>
              <div className="flex items-center gap-1 bg-muted p-1 rounded-md">
                {(Object.keys(metricConfig) as Array<keyof typeof metricConfig>).map((m) => (
                  <Button
                    key={m}
                    variant={metric === m ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setMetric(m)}
                    className="flex-1 px-2 h-8"
                  >
                    {m}
                  </Button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent>
             <ChartContainer config={performanceChartConfig} className="h-[300px] w-full">
              <LineChart accessibilityLayer data={performanceData} margin={{ top: 5, right: 10, bottom: 0, left: 10 }}>
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={currentMetricConfig.formatter} />
                <CartesianGrid vertical={false} stroke="hsl(var(--border))" strokeDasharray="3 3" />
                <ChartTooltip
                  cursor={true}
                  content={<ChartTooltipContent
                      indicator="dot"
                      formatter={(value) => currentMetricConfig.tooltipFormatter(value as number)}
                    />}
                />
                <ChartLegend content={<ChartLegendContent />} />
                <Line 
                  dataKey={currentMetricConfig.keys.previous}
                  name="previous"
                  type="monotone" 
                  stroke="var(--color-previous)" 
                  strokeWidth={2}
                  activeDot={{ r: 6, strokeWidth: 2 }}
                />
                <Line 
                  dataKey={currentMetricConfig.keys.current}
                  name="current"
                  type="monotone" 
                  stroke="var(--color-current)" 
                  strokeWidth={2}
                  activeDot={{ r: 6, strokeWidth: 2 }}
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>
        
        <Card>
            <CardHeader>
              <CardTitle>Recent Orders</CardTitle>
              <CardDescription>
                The latest 5 orders placed in the system.
              </CardDescription>
            </CardHeader>
            <CardContent>
               <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>
                        <div className="font-medium">{order.customerName}</div>
                        <div className="hidden text-sm text-muted-foreground md:inline">
                          {customers.find(c => c.id === order.customerId)?.email}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">₹{order.totalAmount.toLocaleString('en-IN')}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 mt-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="lg:col-span-1 flex flex-col">
          <CardHeader>
            <CardTitle>Top Selling Products</CardTitle>
            <CardDescription>This month's best performers.</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 pb-4">
             <ChartContainer config={topProductsChartConfig} className="mx-auto aspect-square h-full">
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
                  {topProductsData.map((entry) => (
                    <Cell key={`cell-${entry.name}`} fill={`var(--color-${entry.name.replace(/ /g, '-')})`} />
                  ))}
                </Pie>
                <ChartLegend 
                  content={<ChartLegendContent nameKey="name" />}
                  className="-translate-y-2 flex-wrap gap-2 [&>*]:basis-1/2 [&>*]:justify-start"
                />
              </PieChart>
             </ChartContainer>
          </CardContent>
        </Card>

         <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center">
            <div className="grid gap-2">
              <CardTitle>Low Stock Alert</CardTitle>
              <CardDescription>
                These items need to be restocked soon.
              </CardDescription>
            </div>
            <Button asChild size="sm" className="ml-auto gap-1">
              <Link href="/inventory">
                View Inventory
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Stock Level</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lowStockItems.length > 0 ? lowStockItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>{item.category}</TableCell>
                    <TableCell className="text-right">
                      <span className="inline-block animate-bell-shake text-lg font-bold text-yellow-500">
                        {item.stockLevel}
                      </span>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={3} className="h-24 text-center">
                      No items are currently low on stock. Great job!
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
