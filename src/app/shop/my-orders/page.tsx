'use client';

import { useMemo, useState } from 'react';
import { useCollection, useFirestore, useDoc } from '@/firebase';
import { collection, query, orderBy, doc } from 'firebase/firestore';
import type { Order } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Package, Truck, CheckCircle2, ShoppingBag, Send, MessageSquare, ListChecks, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';

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
  const [viewingStatusOrder, setViewingStatusOrder] = useState<Order | null>(null);

  const ordersQuery = useMemo(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'orders'),
      orderBy('orderDate', 'desc')
    );
  }, [firestore]);

  const { data: allOrders, loading } = useCollection<Order>(ordersQuery);

  const settingsRef = useMemo(() => (firestore ? doc(firestore, 'settings', 'tracking-visibility') : null), [firestore]);
  const { data: visibilitySettings } = useDoc<any>(settingsRef as any);
  
  const myOrders = useMemo(() => {
    return allOrders?.filter(o => o.id.includes('WEB-')) || [];
  }, [allOrders]);

  const filteredHistory = (order: Order) => {
    if (!order.history) return [];
    return order.history.filter(h => {
        // Special case: ready for dispatch might be stored as shippingStatus
        if (h.status === 'Ready for Dispatch') return !!visibilitySettings?.['Ready for Dispatch'];
        return !!visibilitySettings?.[h.status];
    });
  };

  const StatusTimeline = ({ status }: { status?: string }) => {
    const steps = [
      { id: 'Order Received', label: 'Received', icon: Send },
      { id: 'Production in Progress', label: 'Preparation', icon: Clock },
      { id: 'Ready for Dispatch', label: 'Ready', icon: Package },
      { id: 'Dispatched', label: 'Dispatched', icon: Truck },
    ];
    const currentIndex = steps.findIndex(s => s.id === status);

    if (status === 'Cancelled' || status === 'On Hold' || status === 'Delivered') {
        return (
            <div className="flex items-center justify-center p-6 md:p-8 bg-stone-50 rounded-2xl border border-stone-100">
                <Badge variant="outline" className={cn("text-base md:text-lg px-6 md:px-8 py-2 md:py-3 rounded-full border-2", statusColorMap[status])}>
                    {status}
                </Badge>
            </div>
        );
    }

    return (
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 py-6 md:py-8">
        {steps.map((step, i) => (
          <div key={step.id} className="flex flex-row md:flex-col items-center gap-4 md:flex-1 relative w-full md:w-auto">
            <div className={cn(
              "z-10 flex items-center justify-center h-12 w-12 md:h-14 md:w-14 rounded-full border-4 transition-all duration-700 shadow-xl shrink-0",
              i <= currentIndex ? "bg-primary border-white text-white scale-110" : "bg-white border-stone-100 text-stone-300"
            )}>
              {i < currentIndex ? <CheckCircle2 className="h-5 w-5 md:h-6 md:w-6" /> : <step.icon className="h-5 w-5 md:h-6 md:w-6" />}
            </div>
            
            <div className="text-left md:text-center flex-1 md:flex-none">
              <p className={cn(
                "font-headline text-base md:text-lg",
                i <= currentIndex ? "text-stone-900 font-bold" : "text-stone-400"
              )}>{step.label}</p>
              {i === currentIndex && <Badge className="mt-1 bg-primary/10 text-primary border-none text-[8px] uppercase tracking-tighter">Active Stage</Badge>}
            </div>

            {i < steps.length - 1 && (
              <>
                <div className={cn(
                  "hidden md:block absolute top-7 left-[calc(50%+3.5rem)] w-[calc(100%-7rem)] h-1 rounded-full",
                  i < currentIndex ? "bg-primary" : "bg-stone-100"
                )} />
                <div className={cn(
                  "md:hidden absolute left-6 top-[3rem] w-0.5 h-6 -translate-x-1/2",
                  i < currentIndex ? "bg-primary" : "bg-stone-100"
                )} />
              </>
            )}
          </div>
        ))}
      </div>
    );
  };

  const getOrderStatusVariant = (status: string) => {
    switch (status) {
      case 'Order Rejected': return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'Order On Hold': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'Order Confirmed': return 'bg-green-500/10 text-green-500 border-green-500/20';
      default: return 'bg-stone-100 text-stone-500 border-stone-200';
    }
  }

  if (loading) return (
    <div className="max-w-4xl mx-auto py-12 space-y-8 animate-pulse px-4 md:px-0">
        <div className="h-12 w-48 bg-stone-200 rounded-xl" />
        <Card className="rounded-[1.5rem] md:rounded-[2rem] border-none bg-white p-6 md:p-12 h-64" />
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-8 md:space-y-12 animate-in fade-in duration-1000 px-4 md:px-0">
      <div className="space-y-2">
        <h1 className="text-4xl md:text-5xl font-bold font-headline text-stone-900 tracking-tight">Artisan Tracking</h1>
        <p className="text-stone-400 font-light text-base md:text-lg">Follow the journey of your artisan selections from our kitchen to your door.</p>
      </div>

      {myOrders.length === 0 ? (
        <div className="bg-white rounded-[2rem] md:rounded-[3rem] p-12 md:p-24 text-center border border-stone-100 shadow-sm space-y-8">
           <div className="h-20 w-20 md:h-24 md:w-24 bg-stone-50 rounded-full flex items-center justify-center mx-auto">
             <ShoppingBag className="h-8 w-8 md:h-10 md:w-10 text-stone-200" />
           </div>
           <div className="space-y-2">
              <h2 className="text-2xl md:text-3xl font-bold font-headline">No journeys found</h2>
              <p className="text-stone-400 text-sm md:text-base">You haven't placed any orders with this session yet.</p>
           </div>
           <Button className="rounded-full px-10 md:px-12 h-12 md:h-14 w-full sm:w-auto" asChild>
             <Link href="/shop">Begin Your Indulgence</Link>
           </Button>
        </div>
      ) : (
        <div className="space-y-6 md:space-y-8">
          {myOrders.map((order) => (
            <Card key={order.id} className="rounded-[1.5rem] md:rounded-[2.5rem] border-stone-100 shadow-xl overflow-hidden bg-white hover:shadow-2xl transition-all duration-500">
              <div className="bg-stone-900 p-6 md:p-8 text-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                <div className="space-y-1 w-full sm:w-auto">
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Artisan Reference</p>
                  <h3 className="text-xl md:text-2xl font-bold font-headline break-all">{order.id.replace('ORD', 'INV')}</h3>
                </div>
                <div className="flex flex-col xs:flex-row items-start xs:items-center gap-4 md:gap-6 w-full sm:w-auto">
                  <Button 
                    variant="outline" 
                    className="w-full xs:w-auto rounded-full border-primary/30 text-primary hover:bg-primary hover:text-stone-950 font-bold uppercase text-[10px] tracking-widest h-11 md:h-12 px-6 shadow-lg shadow-primary/10 transition-all"
                    onClick={() => setViewingStatusOrder(order)}
                  >
                    <ListChecks className="mr-2 h-4 w-4" /> View Status
                  </Button>
                  <div className="hidden xs:block h-10 w-px bg-stone-800" />
                  <div className="text-left xs:text-right w-full xs:w-auto">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-500">Order Status</p>
                    <Badge variant="outline" className={cn("rounded-full border-2 mt-1", getOrderStatusVariant(order.deliveryStatus))}>
                      {order.deliveryStatus}
                    </Badge>
                  </div>
                </div>
              </div>
              <CardContent className="p-6 md:p-10">
                <div className="space-y-8 md:space-y-10">
                  {order.statusReason && (
                    <div className="bg-amber-50 border border-amber-100 p-5 md:p-6 rounded-2xl flex gap-4 animate-in slide-in-from-top-4 duration-500">
                      <MessageSquare className="h-5 w-5 md:h-6 md:w-6 text-amber-500 shrink-0" />
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-600 mb-1">Status Update Note</p>
                        <p className="text-stone-700 italic leading-relaxed font-light text-sm md:text-base">{order.statusReason}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-400">Shipping Lifecycle</h4>
                    <Badge variant="outline" className={cn("px-4 py-1 rounded-full border-2 font-bold text-[10px] uppercase tracking-widest w-fit", statusColorMap[order.shippingStatus || 'Order Received'])}>
                        {order.shippingStatus || 'Order Received'}
                    </Badge>
                  </div>
                  
                  <StatusTimeline status={order.shippingStatus} />

                  {(order.shippingStatus === 'Dispatched' || visibilitySettings?.['Expected Arrival Date']) && order.dispatchDetails && (
                    <div className="bg-stone-50 rounded-[1.5rem] md:rounded-[2rem] p-6 md:p-10 grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 border border-stone-100 animate-in zoom-in-95 duration-500">
                        <div className="space-y-6">
                            <div>
                                <h5 className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-400 mb-1">Logistics Partner</h5>
                                <p className="text-lg md:text-xl font-bold font-headline">{order.dispatchDetails.courierName}</p>
                            </div>
                            <div>
                                <h5 className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-400 mb-1">Consignment tracking</h5>
                                <p className="text-base md:text-lg font-mono text-primary font-bold break-all">{order.dispatchDetails.trackingNumber}</p>
                            </div>
                        </div>
                        <div className="space-y-6">
                            <div className="flex justify-between items-center bg-white p-4 rounded-xl md:rounded-2xl shadow-sm border border-stone-100">
                                <span className="text-[10px] md:text-xs text-stone-500 font-bold uppercase tracking-widest">Left Workshop</span>
                                <span className="text-xs md:text-sm font-bold">{order.dispatchDetails.dispatchDate}</span>
                            </div>
                             {visibilitySettings?.['Expected Arrival Date'] && order.dispatchDetails.expectedDeliveryDate && (
                                <div className="flex justify-between items-center bg-white p-4 rounded-xl md:rounded-2xl shadow-sm border border-primary/20">
                                    <span className="text-[10px] md:text-xs text-primary font-black uppercase tracking-widest">Expected Arrival</span>
                                    <span className="text-xs md:text-sm font-bold text-primary">{order.dispatchDetails.expectedDeliveryDate}</span>
                                </div>
                             )}
                        </div>
                        <div className="md:col-span-2 pt-6 border-t border-stone-200">
                             <h5 className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-400 mb-2">Artisan Note</h5>
                             <p className="text-stone-600 italic leading-relaxed text-sm">"{order.dispatchDetails.description || 'Your selection has been carefully inspected and handed to our elite logistics partner for prompt delivery.'}"</p>
                        </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Artisan Journey Status Dialog */}
      <Dialog open={!!viewingStatusOrder} onOpenChange={(open) => !open && setViewingStatusOrder(null)}>
        <DialogContent className="sm:max-w-xl rounded-[1.5rem] md:rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl">
          <div className="bg-stone-900 p-6 md:p-8 text-white">
            <DialogHeader>
               <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary mb-2">Detailed Log</p>
               <DialogTitle className="text-2xl md:text-3xl font-headline">Artisan Journey</DialogTitle>
               <DialogDescription className="text-stone-400 text-xs md:text-sm">Chronological history of your chocolate's craftsmanship.</DialogDescription>
            </DialogHeader>
          </div>
          
          <div className="p-6 md:p-8">
            <ScrollArea className="h-[350px] md:h-[400px] pr-4">
              {viewingStatusOrder && filteredHistory(viewingStatusOrder).length > 0 ? (
                <div className="space-y-6 md:space-y-8 relative">
                   <div className="absolute left-[23px] md:left-[27px] top-4 bottom-4 w-0.5 bg-stone-100" />
                   {filteredHistory(viewingStatusOrder).map((item, index) => (
                     <div key={index} className="flex gap-4 md:gap-6 relative group animate-in slide-in-from-left-4 duration-500" style={{ animationDelay: `${index * 100}ms` }}>
                        <div className={cn(
                            "z-10 h-12 w-12 md:h-14 md:w-14 rounded-xl md:rounded-2xl flex items-center justify-center shrink-0 border-2 transition-all group-hover:scale-110 shadow-sm",
                            index === 0 ? "bg-primary border-primary text-white" : "bg-white border-stone-100 text-stone-400"
                        )}>
                            {index === 0 ? <CheckCircle2 className="h-5 w-5 md:h-6 md:w-6" /> : <Clock className="h-4 w-4 md:h-5 md:w-5" />}
                        </div>
                        <div className="space-y-1 py-1">
                            <p className={cn("font-bold text-base md:text-lg leading-none", index === 0 ? "text-stone-900" : "text-stone-500")}>{item.status}</p>
                            <div className="flex items-center gap-2 text-stone-400 text-[10px] md:text-xs font-medium">
                                <Calendar className="h-3 w-3" />
                                {format(new Date(item.timestamp), 'PPP p')}
                            </div>
                            {item.reason && (
                                <p className="text-xs md:text-sm italic text-stone-500 bg-stone-50 p-3 rounded-xl mt-2 border border-stone-100">{item.reason}</p>
                            )}
                        </div>
                     </div>
                   ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-64 text-center space-y-4">
                    <Clock className="h-12 w-12 text-stone-100" />
                    <p className="font-headline text-xl italic text-stone-400">The journey is just beginning.</p>
                    <p className="text-xs uppercase tracking-widest text-stone-300">Detailed milestones will appear here as your order progresses.</p>
                </div>
              )}
            </ScrollArea>
          </div>
          
          <div className="p-6 md:p-8 pt-0">
            <DialogFooter>
              <DialogClose asChild>
                <Button className="w-full h-12 md:h-14 rounded-xl md:rounded-2xl font-bold uppercase tracking-widest text-[10px] shadow-xl shadow-primary/20">Close Journey Log</Button>
              </DialogClose>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
