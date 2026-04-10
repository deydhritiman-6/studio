'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart';
import { PageHeader } from '@/components/page-header';
import { performanceData } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Line, LineChart, CartesianGrid, XAxis, YAxis } from 'recharts';

export default function PerformancePage() {
  const [metric, setMetric] = useState<'Revenue' | 'Sales' | 'Orders' | 'Customers'>('Revenue');

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

  return (
    <>
      <PageHeader title="Performance Analysis" />
       <Card>
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
             <ChartContainer config={performanceChartConfig} className="h-[400px] w-full">
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
    </>
  );
}
