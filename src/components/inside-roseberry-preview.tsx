'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Sparkles, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useCollection, useDoc, useFirestore } from '@/firebase';
import { collection, query, where, doc } from 'firebase/firestore';
import type { Facility, FacilitiesPageSettings } from '@/lib/types';
import { cn } from '@/lib/utils';
import { ArtisanPerimeter } from '@/components/artisan-perimeter';

function FacilityPreviewCard({ facility, index }: { facility: Facility; index: number }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const clearCollapseTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startCollapseTimer = useCallback(() => {
    clearCollapseTimer();
    if (isExpanded) {
      timerRef.current = setTimeout(() => {
        setIsExpanded(false);
      }, 15000); // Updated timeout to 15 seconds
    }
  }, [isExpanded, clearCollapseTimer]);

  useEffect(() => {
    return () => clearCollapseTimer();
  }, [clearCollapseTimer]);

  const handleToggle = () => {
    clearCollapseTimer();
    setIsExpanded(!isExpanded);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      viewport={{ once: true }}
      onMouseEnter={clearCollapseTimer}
      onMouseLeave={startCollapseTimer}
    >
      <ArtisanPerimeter radius="2.5rem" className="shadow-sm hover:shadow-2xl transition-all duration-500 h-full">
        <Card className="group overflow-hidden rounded-[2.5rem] border-none bg-white h-full relative z-10 flex flex-col">
          <div className="aspect-[16/10] relative overflow-hidden shrink-0">
            <Image
              src={facility.imageUrl || 'https://picsum.photos/seed/facility/800/500'}
              alt={facility.title}
              fill
              className="object-cover transition-transform duration-1000 group-hover:scale-110"
              sizes="(max-width: 768px) 100vw, 33vw"
            />
            <div className="absolute top-4 left-6">
              <span className="text-6xl font-black text-white/20 font-sans tracking-tighter drop-shadow-sm select-none">
                {(facility.order || index + 1).toString().padStart(2, '0')}
              </span>
            </div>
          </div>
          <CardContent className="p-8 space-y-3 flex-1 flex flex-col">
            <h3 className="text-2xl font-bold font-headline text-stone-900 leading-none">
              {facility.title}
            </h3>
            <p className="text-[10px] text-primary font-black uppercase tracking-widest">
              {facility.caption}
            </p>
            
            <div className="relative flex-1">
              <motion.div
                initial={false}
                animate={{ height: isExpanded ? 'auto' : '3rem' }}
                className="overflow-hidden"
              >
                <p className={cn(
                  "text-sm text-stone-500 font-light leading-relaxed",
                  !isExpanded && "line-clamp-2"
                )}>
                  {facility.description}
                </p>
              </motion.div>
              
              <Button
                variant="ghost"
                onClick={handleToggle}
                className="mt-3 h-auto p-0 text-[10px] font-black uppercase tracking-[0.2em] text-primary hover:bg-transparent hover:text-rose-700 transition-colors group/btn"
              >
                {isExpanded ? (
                  <>View Less <ChevronUp className="ml-1 h-3 w-3 transition-transform group-hover/btn:-translate-y-0.5" /></>
                ) : (
                  <>View More <ChevronDown className="ml-1 h-3 w-3 transition-transform group-hover/btn:translate-y-0.5" /></>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </ArtisanPerimeter>
    </motion.div>
  );
}

export function InsideRoseberryPreview() {
  const firestore = useFirestore();

  const facilitiesQuery = React.useMemo(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'facilities'),
      where('isActive', '==', true)
    );
  }, [firestore]);

  const settingsRef = React.useMemo(() => {
    if (!firestore) return null;
    return doc(firestore, 'settings', 'facilities');
  }, [firestore]);

  const { data: allActiveFacilities, loading: facilitiesLoading } = useCollection<Facility>(facilitiesQuery);
  const { data: settings, loading: settingsLoading } = useDoc<FacilitiesPageSettings>(settingsRef as any);

  const facilities = React.useMemo(() => {
    if (!allActiveFacilities) return [];
    return allActiveFacilities
      .filter(f => f.showOnHomepage)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [allActiveFacilities]);

  if (facilitiesLoading || settingsLoading) {
    return (
      <section className="py-24 px-6 bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto flex justify-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      </section>
    );
  }

  if (!facilities || facilities.length === 0) return null;

  const displaySettings = settings || {
    eyebrowText: "INSIDE ROSEBERRY",
    homepageTitle: "Inside Roseberry Chocolate",
    homepageSubtitle: "A Journey of Care, Craft and Commitment",
    homepageDescription: "From the finest ingredients to the final delivery, every step at Roseberry Chocolate is handled with passion, precision and care.",
    homepageButtonText: "Explore Our Facilities",
    homepageButtonEnabled: true
  };

  return (
    <section className="py-32 px-6 bg-white/40 backdrop-blur-md relative overflow-hidden">
      <div className="absolute top-0 left-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl translate-x-1/3 translate-y-1/3"></div>

      <div className="max-w-7xl mx-auto space-y-20 relative z-10">
        <div className="text-center space-y-6 max-w-4xl mx-auto">
          <Badge className="bg-primary/10 text-primary border-none px-6 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.4em] shadow-sm">
            <Sparkles className="h-3.5 w-3.5 mr-2 inline" /> {displaySettings.eyebrowText}
          </Badge>
          <h2 className="text-5xl md:text-7xl font-bold font-headline text-stone-900 tracking-tight leading-tight">
            {displaySettings.homepageTitle}
          </h2>
          <p className="text-xl md:text-2xl text-primary font-light italic">
            {displaySettings.homepageSubtitle}
          </p>
          <p className="text-stone-500 text-lg font-light leading-relaxed max-w-2xl mx-auto">
            {displaySettings.homepageDescription}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 items-start">
          {facilities.map((facility, index) => (
            <FacilityPreviewCard key={facility.id} facility={facility} index={index} />
          ))}
        </div>

        {displaySettings.homepageButtonEnabled && (
          <div className="flex justify-center pt-10">
            <Button
              asChild
              size="lg"
              className="h-16 px-12 text-lg rounded-2xl bg-[#3D1E16] hover:bg-[#4A251B] text-[#D4AF37] shadow-2xl shadow-stone-900/20 transition-all hover:scale-105 group"
            >
              <Link href="/inside-roseberry">
                {displaySettings.homepageButtonText}
                <ArrowRight className="ml-3 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
