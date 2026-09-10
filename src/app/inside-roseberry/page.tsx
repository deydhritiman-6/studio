'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  Sparkles, 
  CheckCircle2, 
  Loader2, 
  ShieldCheck, 
  MapPin, 
  Package, 
  Truck, 
  Heart,
  Droplets,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Logo } from '@/components/logo';
import { useCollection, useDoc, useFirestore } from '@/firebase';
import { collection, query, where, doc } from 'firebase/firestore';
import type { Facility, FacilitiesPageSettings } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Footer } from '@/components/footer';
import { ArtisanPerimeter } from '@/components/artisan-perimeter';

function FacilityMainCard({ facility, index }: { facility: Facility; index: number }) {
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
      }, 8000); // Updated timeout to 8 seconds
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
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: index * 0.1 }}
      viewport={{ once: true }}
      className="group"
      onMouseEnter={clearCollapseTimer}
      onMouseLeave={startCollapseTimer}
    >
      <div className="space-y-8 h-full flex flex-col">
        <ArtisanPerimeter radius="3rem" className="shadow-xl transition-transform duration-700 group-hover:scale-[1.02] shrink-0" speed={2.5}>
          <div className="aspect-[4/3] relative rounded-[3rem] overflow-hidden bg-white relative z-10">
            <Image 
              src={facility.imageUrl || 'https://picsum.photos/seed/fac/800/600'} 
              alt={facility.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 33vw"
            />
            <div className="absolute top-6 left-8">
              <span className="text-7xl font-black text-white/30 font-sans tracking-tighter drop-shadow-sm select-none">
                {(facility.order || index + 1).toString().padStart(2, '0')}
              </span>
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
          </div>
        </ArtisanPerimeter>
        
        <div className="space-y-4 px-4 flex-1 flex flex-col">
          <div className="space-y-1">
            <Badge variant="outline" className="border-primary/20 text-primary uppercase text-[8px] font-black tracking-[0.3em] px-3">
              {facility.caption}
            </Badge>
            <h3 className="text-3xl font-bold font-headline text-stone-900 group-hover:text-primary transition-colors">
              {facility.title}
            </h3>
          </div>
          
          <div className="relative">
            <motion.div
              initial={false}
              animate={{ height: isExpanded ? 'auto' : '4.5rem' }} // approx 3 lines for base text
              className="overflow-hidden"
            >
              <p className={cn(
                "text-stone-500 font-light leading-relaxed text-base",
                !isExpanded && "line-clamp-3"
              )}>
                {facility.description}
              </p>
            </motion.div>
            
            <Button
              variant="ghost"
              onClick={handleToggle}
              className="mt-4 h-auto p-0 text-xs font-black uppercase tracking-[0.2em] text-primary hover:bg-transparent hover:text-rose-700 transition-all group/btn"
            >
              {isExpanded ? (
                <>View Less <ChevronUp className="ml-1 h-3.5 w-3.5 transition-transform group-hover/btn:-translate-y-0.5" /></>
              ) : (
                <>View More <ChevronDown className="ml-1 h-3.5 w-3.5 transition-transform group-hover/btn:translate-y-0.5" /></>
              )}
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function InsideRoseberryPage() {
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
    return [...allActiveFacilities].sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [allActiveFacilities]);

  if (facilitiesLoading || settingsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  const displaySettings = settings || {
    eyebrowText: "INSIDE",
    title: "Inside Roseberry Chocolate",
    subtitle: "A Journey of Care, Craft and Commitment",
    description: "From the finest ingredients to the final delivery, every step at Roseberry Chocolate is handled with passion, precision and care.",
    heroImageUrl: "/Roseberry Chocolate Inside Story.jpeg",
    bottomStatement: "Crafted with Passion. Handled with Care. Delivered with Love.",
    bottomDescription: "Every piece tells a story of artisanal excellence and dedication to quality."
  };

  const highlights = [
    { icon: Droplets, text: "Premium Ingredients" },
    { icon: ShieldCheck, text: "Hygiene & Safe Processes" },
    { icon: Package, text: "Beautiful Packaging" },
    { icon: Truck, text: "On-Time Delivery" }
  ];

  return (
    <div className="min-h-screen bg-stone-50 font-body relative overflow-x-hidden">
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-0 bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')]"></div>

      <header className="sticky top-0 z-50 w-full border-b bg-white/70 backdrop-blur-xl px-6 h-20 flex items-center justify-between shadow-sm">
        <Link href="/" className="flex items-center gap-3 group">
          <ArrowLeft className="h-5 w-5 text-stone-400 group-hover:text-primary transition-colors group-hover:-translate-x-1" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400 group-hover:text-stone-900 transition-colors">Return to Home</span>
        </Link>
        <div className="flex-1 flex justify-center mr-20">
          <Logo className="h-10 w-auto" />
        </div>
      </header>

      <main className="relative z-10">
        <section className="relative h-[80vh] flex flex-col items-center justify-center px-6 overflow-hidden">
          <Image 
            src={displaySettings.heroImageUrl} 
            alt="Artisan Showcase" 
            fill 
            className="object-cover" 
            priority
          />
          <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-[2px]"></div>
          
          <div className="max-w-5xl mx-auto text-center space-y-8 relative z-20 text-white">
            <Badge className="bg-primary/20 text-primary border-none px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.5em] backdrop-blur-md">
              {displaySettings.eyebrowText}
            </Badge>
            <h1 className="text-6xl md:text-8xl font-bold font-headline tracking-tight leading-[1.05] drop-shadow-2xl">
              {displaySettings.title}
            </h1>
            <p className="text-2xl md:text-3xl text-primary font-light italic drop-shadow-lg">
              {displaySettings.subtitle}
            </p>
            <p className="text-stone-300 text-lg md:text-xl font-light max-w-2xl mx-auto leading-relaxed drop-shadow-md">
              {displaySettings.description}
            </p>
          </div>
          
          {displaySettings.logoUrl && (
            <div className="absolute bottom-10 right-10 z-20 h-20 w-auto opacity-50 grayscale invert">
              <Image src={displaySettings.logoUrl} alt="Facilities Logo" width={100} height={100} className="object-contain" />
            </div>
          )}
        </section>

        <section className="py-32 px-6">
          <div className="max-w-7xl mx-auto space-y-24">
            {!facilities || facilities.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-[3rem] border-2 border-dashed border-stone-200">
                <p className="text-stone-400 font-headline text-2xl italic">Our facilities are being updated. Please check back soon.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 lg:gap-16 items-start">
                {facilities.map((facility, index) => (
                  <FacilityMainCard key={facility.id} facility={facility} index={index} />
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="py-32 px-6 bg-stone-900 text-white rounded-[4rem] mx-4 md:mx-8 mb-20 shadow-2xl relative overflow-hidden">
           <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-[100px] -mr-48 -mt-48"></div>
           
           <div className="max-w-4xl mx-auto text-center space-y-16 relative z-10">
              <div className="space-y-6">
                <h2 className="text-4xl md:text-6xl font-bold font-headline leading-tight italic">
                  "{displaySettings.bottomStatement}"
                </h2>
                <p className="text-stone-400 text-lg md:text-xl font-light leading-relaxed">
                  {displaySettings.bottomDescription}
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                {highlights.map((item, i) => (
                  <div key={i} className="space-y-4 group">
                    <div className="h-16 w-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto text-primary group-hover:bg-primary group-hover:text-stone-950 transition-all duration-500">
                      <item.icon className="h-8 w-8" />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-500 group-hover:text-white transition-colors">
                      {item.text}
                    </p>
                  </div>
                ))}
              </div>
           </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
