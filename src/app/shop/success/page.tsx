'use client';

import { Button } from '@/components/ui/button';
import { CheckCircle2, ShoppingBag, Truck } from 'lucide-react';
import Link from 'next/link';

export default function SuccessPage() {
  return (
    <div className="flex flex-col items-center justify-center py-24 space-y-8 text-center animate-in fade-in slide-in-from-top-4 duration-1000">
      <div className="relative">
        <div className="h-32 w-32 bg-green-100 rounded-full flex items-center justify-center animate-pulse shadow-inner">
          <CheckCircle2 className="h-16 w-16 text-green-600" />
        </div>
        <div className="absolute -top-2 -right-2 h-10 w-10 bg-primary rounded-full flex items-center justify-center border-4 border-stone-50 shadow-lg">
           <Truck className="h-4 w-4 text-stone-900" />
        </div>
      </div>
      
      <div className="space-y-4">
        <h1 className="text-4xl md:text-5xl font-bold font-headline text-stone-900">Your indulgence is on its way</h1>
        <p className="text-stone-500 max-w-md mx-auto text-lg leading-relaxed">Thank you for choosing Roseberry. Our chocolatiers have been notified and are now hand-preparing your selection for its journey.</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 pt-12">
        <Button asChild variant="outline" className="h-16 px-12 border-stone-200 text-stone-600 hover:bg-stone-50 shadow-sm">
          <Link href="/shop">Continue Browsing</Link>
        </Button>
        <Button asChild className="h-16 px-12 shadow-lg shadow-primary/20">
          <Link href="/shop">
            <ShoppingBag className="mr-3 h-5 w-5" /> View Order Status
          </Link>
        </Button>
      </div>

      <div className="pt-20 opacity-30">
        <p className="text-[10px] font-bold tracking-[0.4em] uppercase text-stone-400">Order Ref: RB-S{Math.floor(Math.random() * 1000000)}</p>
      </div>
    </div>
  );
}
