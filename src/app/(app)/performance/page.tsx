'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart';
import { PageHeader } from '@/components/page-header';
import { performanceData } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Line, LineChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { useCollection, useFirestore } from '@/firebase';
import { collection } from 'firebase/firestore';
import type { Order, Customer } from '@/lib/types';
import { startOfMonth, endOfMonth } from 'date-fns';
import { formatINR } from '@/lib/currency';

export default function PerformancePage() {
  const [metric, setMetric] = useState<'Revenue' | 'Sales' | 'Orders' | 'Customers'>('Revenue');
  const firestore = useFirestore();

  const ordersQuery = useMemo(() => (firestore ? collection(firestore, 'orders') : null), [firestore]);
  const customersQuery = useMemo(() => (firestore ? collection(firestore, 'customers') : null), [firestore]);

  const { data: orders } = useCollection<Order>(ordersQuery);
  const { data: customers } = useCollection<Customer>(customersQuery);

  const livePerformanceData = useMemo(() => {
    if (!orders || !customers) return performanceData;

    const computeMetricsForMonth = (date: Date) => {
      const start = startOfMonth(date);
      const end = endOfMonth(date);
      const monthOrders = orders.filter(o => {
        const orderDate = new Date(o.orderDate);
        return orderDate >= start && orderDate <= end;
      });

      return {
        revenue: monthOrders.reduce((sum, o) => sum + (o.paymentStatus === 'Paid' ? o.totalAmount : 0), 0),
        sales: monthOrders.reduce((sum, o) => sum + o.products.reduce((ps, p) => ps + p.quantity, 0), 0),
        orders: monthOrders.length,
        customers: new Set(monthOrders.map(o => o.customerId)).size
      };
    };

    const now = new Date();
    const currentMetrics = computeMetricsForMonth(now);

    return performanceData.map((d, i) => {
      if (i === performanceData.length - 1) {
        return {
          ...d,
          currentRevenue: currentMetrics.revenue || d.currentRevenue,
          currentSales: currentMetrics.sales || d.currentSales,
          currentOrders: currentMetrics.orders || d.currentOrders,
          currentCustomers: currentMetrics.customers || d.currentCustomers,
        };
      }
      return d;
    });
  }, [orders, customers]);

  const performanceChartConfig = {
    previous: { label: 'Previous 6 Months', color: 'hsl(var(--chart-2))' },
    current: { label: 'Current 6 Months', color: 'hsl(var(--destructive))' },
  } satisfies import('@/components/ui/chart').ChartConfig;

  const metricConfig = {
    Revenue: {
      keys: { previous: 'previousRevenue', current: 'currentRevenue' },
      formatter: (value: number) => `₹${(value / 1000).toFixed(0)}k`,
      tooltipFormatter: (value: number) => formatINR(value),
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

  return (
    <>
      <PageHeader title="Performance Analysis" />
       <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle>Performance Comparison</CardTitle>
                <CardDescription>
                  Comparing the last 6 months with the previous 6 months. (Includes live data)
                </CardDescription>
              </div>
              <div className="flex items-center gap-1 bg-muted p-1 rounded-md">
                {(Object.keys(metricConfig) as Array<keyof typeof metricConfig>).map((m) => (
                  <Button
                    key={m}
                    variant={metric === m ? 'default' : 'ghost'}
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
             <ChartContainer config={performanceChartConfig} className="h-[400px] w-full">
              <LineChart accessibilityLayer data={livePerformanceData} margin={{ top: 5, right: 10, bottom: 0, left: 10 }}>
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={currentMetricConfig.formatter} />
                <CartesianGrid vertical={false} stroke="hsl(var(--border))" strokeDasharray="3 3" />
                <ChartTooltip
                  cursor={true}
                  content={<ChartTooltipContent
                      indicator="dot"
                      formatter={(value, name, item) => {
                        const monthLabel = name === "previous" ? (item.payload as any).previousMonthName : (item.payload as any).currentMonthName;
                        const label = name === "previous" ? "Previous 6 Months" : "Current 6 Months";

                        return (
                           <div className="flex w-full items-stretch justify-between gap-4">
                            <div className="flex items-center gap-2">
                              <div
                                className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
                                style={{
                                  backgroundColor: item.color,
                                }}
                              />
                              <span className="text-muted-foreground">{monthLabel} ({label})</span>
                            </div>
                            <span className="font-mono font-medium tabular-nums text-foreground">
                              {currentMetricConfig.tooltipFormatter(value as number)}
                            </span>
                          </div>
                        );
                      }}
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
    </>
  );
}
