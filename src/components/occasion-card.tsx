
'use client';

import React, { useMemo } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useCollection, useFirestore } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import type { OccasionMessage } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PartyPopper } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * @fileOverview A compact, premium card to display scheduled occasion messages.
 * Automatically appears on the configured Indian date.
 */
export function OccasionCard() {
  const firestore = useFirestore();

  // Calculate current date in Indian Standard Time (YYYY-MM-DD)
  const todayIST = useMemo(() => {
    const options = { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' } as const;
    const parts = new Intl.DateTimeFormat('en-CA', options).formatToParts(new Date());
    const year = parts.find(p => p.type === 'year')?.value;
    const month = parts.find(p => p.type === 'month')?.value;
    const day = parts.find(p => p.type === 'day')?.value;
    return `${year}-${month}-${day}`;
  }, []);

  const occasionsQuery = useMemo(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'occasions'),
      where('isActive', '==', true),
      where('date', '==', todayIST)
    );
  }, [firestore, todayIST]);

  const { data: activeOccasions, loading } = useCollection<OccasionMessage>(occasionsQuery);

  if (loading || !activeOccasions || activeOccasions.length === 0) {
    return null;
  }

  // Use the first active occasion for today
  const occasion = activeOccasions[0];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: 50, scale: 0.9 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        exit={{ opacity: 0, x: 50, scale: 0.9 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
      >
        <Card className="w-full max-w-[280px] overflow-hidden border-none shadow-[0_30px_60px_-12px_rgba(0,0,0,0.25)] bg-white/80 backdrop-blur-xl rounded-[2.5rem] relative group border-t border-white/50">
          {/* Subtle Decorative Elements */}
          <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl -mr-12 -mt-12" />
          
          <div className="aspect-square relative overflow-hidden m-4 rounded-[1.8rem] shadow-lg">
            <Image 
              src={occasion.imageUrl} 
              alt={occasion.title} 
              fill 
              className="object-cover transition-transform duration-[3s] group-hover:scale-110" 
              sizes="280px"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-stone-900/40 via-transparent to-transparent" />
            <div className="absolute top-3 left-3">
               <div className="bg-stone-900/40 backdrop-blur-md rounded-full p-2 border border-white/20">
                  <PartyPopper className="h-3 w-3 text-primary animate-pulse" />
               </div>
            </div>
          </div>
          
          <CardContent className="p-6 pt-2 text-center space-y-3 relative z-10">
            <div className="space-y-1">
                <Badge className="bg-primary/10 text-primary border-none text-[8px] font-black uppercase tracking-[0.3em] px-3 py-0.5 rounded-full">
                {occasion.title}
                </Badge>
                <div className="h-px w-8 bg-primary/20 mx-auto mt-2" />
            </div>
            
            <p className="text-sm font-light text-stone-700 italic leading-relaxed px-2">
              "{occasion.message}"
            </p>
            
            <div className="pt-1">
               <p className="text-[7px] font-black uppercase tracking-[0.4em] text-stone-300">Certified Artisan Greeting</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}
