'use client';

import { useMemo } from 'react';
import { useCollection, useFirestore, useUser } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import type { Order } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Package, Truck, CheckCircle2, ShoppingBag, Send, Ban, PauseCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

const statusColorMap: Record<string, string> = {
  'Order Received': 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  'Production in Progress': 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  'Ready for Dispatch': 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  'Dispatched': 'bg-green-500/10 text-green-500 border-green-500/20',
  'Delivered': 'bg-emerald-900/10 text-emerald-900 border-emerald-900/20 dark:text-emerald-400 dark:border-emerald-400/20',
  'Cancelled': 'bg-red-500/10 text-red-500 border-red-500/20',
  'On Hold': 'bg-slate-500/10 text-slate-500 border-slate-500/20',
};

export default function MyOrdersPage() {
  const firestore = useFirestore();

  const ordersQuery = useMemo(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'orders'),
      orderBy('orderDate', 'desc')
    );
  }, [firestore]);

  const { data: allOrders, loading } = useCollection<Order>(ordersQuery);
  
  const myOrders = useMemo(() => {
    return allOrders?.filter(o => o.id.includes('WEB-')) || [];
  }, [allOrders]);

  const StatusTimeline = ({ status }: { status?: string }) => {
    const steps = [
      { id: 'Order Received', label: 'Received', icon: Send },
      { id: 'Production in Progress', label: 'Preparation', icon: Clock },
      { id: 'Ready for Dispatch', label: 'Ready', icon: Package },
      { id: 'Dispatched', label: 'Dispatched', icon: Truck },
    ];
    const currentIndex = steps.findIndex(s => s.id === status);

    // If it's a special status like Cancelled or On Hold, don't show the standard timeline
    if (status === 'Cancelled' || status === 'On Hold' || status === 'Delivered') {
        return (
            <div className="flex items-center justify-center p-8 bg-stone-50 rounded-2xl border border-stone-100">
                <Badge variant="outline" className={cn("text-lg px-8 py-3 rounded-full border-2", statusColorMap[status])}>
                    {status}
                </Badge>
            </div>
        );
    }

    return (
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 py-8">
        {steps.map((step, i) => (
          <div key={step.id} className="flex flex-row md:flex-col items-center gap-4 md:flex-1 relative">
            <div className={cn(
              "z-10 flex items-center justify-center h-14 w-14 rounded-full border-4 transition-all duration-700 shadow-xl",
              i <= currentIndex ? "bg-primary border-white text-white scale-110" : "bg-white border-stone-100 text-stone-300"
            )}>
              {i < currentIndex ? <CheckCircle2 className="h-6 w-6" /> : <step.icon className="h-6 w-6" />}
            </div>
            
            <div className="text-left md:text-center">
              <p className={cn(
                "font-headline text-lg",
                i <= currentIndex ? "text-stone-900 font-bold" : "text-stone-400"
              )}>{step.label}</p>
              {i === currentIndex && <Badge className="mt-1 bg-primary/10 text-primary border-none text-[8px] uppercase tracking-tighter">Active Stage</Badge>}
            </div>

            {i < steps.length - 1 && (
              <div className={cn(
                "hidden md:block absolute top-7 left-[calc(50%+3.5rem)] w-[calc(100%-7rem)] h-1 rounded-full",
                i < currentIndex ? "bg-primary" : "bg-stone-100"
              )} />
            )}
          </div>
        ))}
      </div>
    );
  };

  if (loading) return (
    <div className="max-w-4xl mx-auto py-12 space-y-8 animate-pulse">
        <div className="h-12 w-48 bg-stone-200 rounded-xl" />
        <Card className="rounded-[2rem] border-none bg-white p-12 h-64" />
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-12 animate-in fade-in duration-1000">
      <div className="space-y-2">
        <h1 className="text-5xl font-bold font-headline text-stone-900 tracking-tight">Artisan Tracking</h1>
        <p className="text-stone-400 font-light text-lg">Follow the journey of your artisan selections from our kitchen to your door.</p>
      </div>

      {myOrders.length === 0 ? (
        <div className="bg-white rounded-[3rem] p-24 text-center border border-stone-100 shadow-sm space-y-8">
           <div className="h-24 w-24 bg-stone-50 rounded-full flex items-center justify-center mx-auto">
             <ShoppingBag className="h-10 w-10 text-stone-200" />
           </div>
           <div className="space-y-2">
              <h2 className="text-3xl font-bold font-headline">No journeys found</h2>
              <p className="text-stone-400">You haven't placed any orders with this session yet.</p>
           </div>
           <Button className="rounded-full px-12 h-14" asChild>
             <Link href="/shop">Begin Your Indulgence</Link>
           </Button>
        </div>
      ) : (
        <div className="space-y-8">
          {myOrders.map((order) => (
            <Card key={order.id} className="rounded-[2.5rem] border-stone-100 shadow-xl overflow-hidden bg-white hover:shadow-2xl transition-all duration-500">
              <div className="bg-stone-900 p-8 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Artisan Reference</p>
                  <h3 className="text-2xl font-bold font-headline">{order.id.replace('ORD', 'INV')}</h3>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-500">Selection Value</p>
                    <p className="text-xl font-bold text-primary">₹{order.totalAmount.toLocaleString()}</p>
                  </div>
                  <div className="h-10 w-px bg-stone-800" />
                   <div className="text-right">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-500">Ordered On</p>
                    <p className="text-sm font-bold">{order.orderDate}</p>
                  </div>
                </div>
              </div>
              <CardContent className="p-10">
                <div className="space-y-10">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-400">Artisan Lifecycle</h4>
                    <Badge variant="outline" className={cn("px-4 py-1 rounded-full border-2 font-bold text-[10px] uppercase tracking-widest", statusColorMap[order.shippingStatus || 'Order Received'])}>
                        {order.shippingStatus || 'Order Received'}
                    </Badge>
                  </div>
                  
                  <StatusTimeline status={order.shippingStatus} />

                  {order.shippingStatus === 'Dispatched' && order.dispatchDetails && (
                    <div className="bg-stone-50 rounded-[2rem] p-10 grid grid-cols-1 md:grid-cols-2 gap-12 border border-stone-100 animate-in zoom-in-95 duration-500">
                        <div className="space-y-6">
                            <div>
                                <h5 className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-400 mb-1">Logistics Partner</h5>
                                <p className="text-xl font-bold font-headline">{order.dispatchDetails.courierName}</p>
                            </div>
                            <div>
                                <h5 className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-400 mb-1">Consignment tracking</h5>
                                <p className="text-lg font-mono text-primary font-bold">{order.dispatchDetails.trackingNumber}</p>
                            </div>
                        </div>
                        <div className="space-y-6">
                            <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-stone-100">
                                <span className="text-xs text-stone-500 font-bold uppercase tracking-widest">Left Workshop</span>
                                <span className="text-sm font-bold">{order.dispatchDetails.dispatchDate}</span>
                            </div>
                             <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-primary/20">
                                <span className="text-xs text-primary font-black uppercase tracking-widest">Expected Arrival</span>
                                <span className="text-sm font-bold text-primary">{order.dispatchDetails.expectedDeliveryDate || 'Standard Window'}</span>
                            </div>
                        </div>
                        <div className="md:col-span-2 pt-6 border-t border-stone-200">
                             <h5 className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-400 mb-2">Artisan Note</h5>
                             <p className="text-stone-600 italic leading-relaxed text-sm">"{order.dispatchDetails.description || 'Your selection has been carefully inspected and handed to our elite logistics partner for prompt delivery.'}"</p>
                        </div>
                    </div>
                  )}

                  {order.shippingStatus === 'Order Received' && (
                     <div className="bg-stone-50 rounded-2xl p-8 flex items-center gap-4 text-stone-500 border border-stone-100 italic">
                        <Clock className="h-5 w-5 text-stone-300" />
                        Our chocolatiers have received your selection and are currently preparing for the tempering process. Detailed tracking will appear here shortly.
                     </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
