'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { PageHeader } from '@/components/page-header';
import { recentSalesData, topProductsData } from '@/lib/data';
import { IndianRupee, ShoppingBag, Crown } from 'lucide-react';
import { Bar, BarChart, Pie, PieChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';

export default function DashboardPage() {
  const kpiData = [
    { title: 'Daily Sales', value: '₹1,84,320', icon: IndianRupee, change: '+4.2%' },
    { title: 'Monthly Revenue', value: '₹45,23,189', icon: IndianRupee, change: '+12.5%' },
    { title: 'New Orders', value: '215', icon: ShoppingBag, change: '-2.1%' },
    { title: 'VIP Customers', value: '48', icon: Crown, change: '+3' },
  ];
  
  const topProductsChartConfig = {
    sales: { label: 'Sales' },
    "Velvet Noir 85%": { label: "Velvet Noir 85%", color: "hsl(var(--chart-1))" },
    "Hazelnut Praline": { label: "Hazelnut Praline", color: "hsl(var(--chart-2))" },
    "Salted Caramel": { label: "Salted Caramel", color: "hsl(var(--chart-3))" },
    "Raspberry Ganache": { label: "Raspberry Ganache", color: "hsl(var(--chart-4))" },
    "Classic Milk": { label: "Classic Milk", color: "hsl(var(--chart-5))" },
  }

  const recentSalesChartConfig = {
    sales: { label: 'Sales', color: 'hsl(var(--chart-1))' },
  };


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
              <p className="text-xs text-muted-foreground">{kpi.change} from last period</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-6 mt-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Recent Sales</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
             <ChartContainer config={recentSalesChartConfig} className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={recentSalesData}>
                   <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value / 1000}k`} />
                  <Tooltip
                    cursor={false}
                    content={<ChartTooltipContent
                        formatter={(value) => `₹${Number(value).toLocaleString()}`}
                        indicator="dot"
                      />}
                    />
                  <Bar dataKey="sales" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Top Selling Products</CardTitle>
          </CardHeader>
          <CardContent>
             <ChartContainer config={topProductsChartConfig} className="h-[300px] w-full">
               <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip
                        cursor={false}
                        content={<ChartTooltipContent hideLabel indicator="dot" />}
                    />
                    <Pie data={topProductsData} dataKey="sales" nameKey="name" cx="50%" cy="50%" outerRadius={100} innerRadius={60} fill="hsl(var(--primary))" />
                </PieChart>
               </ResponsiveContainer>
             </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
