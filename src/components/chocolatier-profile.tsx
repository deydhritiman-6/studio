'use client';

import React, { useMemo } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useDoc, useFirestore } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Quote, Sparkles, Award } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { ChocolatierSettings } from '@/lib/types';

/**
 * @fileOverview A premium, artisanal profile section for the Master Chocolatier.
 * Fetches data dynamically from siteContent/chocolatier.
 */
export function ChocolatierProfile() {
  const firestore = useFirestore();
  const contentRef = useMemo(() => (firestore ? doc(firestore, 'siteContent', 'chocolatier') : null), [firestore]);
  const { data: profile, loading } = useDoc<ChocolatierSettings>(contentRef as any);

  if (loading || !profile || !profile.isVisible || !profile.name) {
    return null;
  }

  return (
    <section className="py-24 md:py-32 px-6 bg-white relative overflow-hidden">
      {/* Background Texture */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')]"></div>
      
      {/* Decorative Warm Aura */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-6xl aspect-square bg-accent/5 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-24 items-center relative z-10">
        
        {/* Left: Chocolatier Content */}
        <div className="lg:col-span-7 order-2 lg:order-1 space-y-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            <Badge variant="outline" className="border-accent/30 text-accent px-6 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.4em] bg-accent/5 shadow-sm">
              The Artisan Spirit
            </Badge>
            <h2 className="text-4xl md:text-6xl font-bold font-headline text-stone-900 tracking-tight leading-tight">
              Meet Our Chocolatier
            </h2>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <div className="space-y-2">
              <p className="text-2xl md:text-3xl font-bold font-headline text-stone-900">{profile.name}</p>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-accent font-sans">{profile.designation}</p>
            </div>

            <p className="text-stone-600 text-lg md:text-xl font-light leading-relaxed">
              {profile.description}
            </p>

            {profile.quote && (
              <div className="relative pt-4">
                <Quote className="absolute -top-4 -left-4 h-12 w-12 text-accent/10 -z-10" />
                <p className="text-xl md:text-2xl font-headline italic text-stone-800 leading-relaxed border-l-4 border-accent/20 pl-8">
                  "{profile.quote}"
                </p>
              </div>
            )}
          </motion.div>

          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.6 }}
            viewport={{ once: true }}
            className="pt-4 flex items-center gap-6"
          >
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 bg-accent/10 rounded-full flex items-center justify-center text-accent shadow-inner">
                <Award className="h-5 w-5" />
              </div>
              <span className="text-[9px] font-black uppercase tracking-widest text-stone-400">Master Craftsmanship</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 bg-accent/10 rounded-full flex items-center justify-center text-accent shadow-inner">
                <Sparkles className="h-5 w-5" />
              </div>
              <span className="text-[9px] font-black uppercase tracking-widest text-stone-400">Handmade with Love</span>
            </div>
          </motion.div>
        </div>

        {/* Right: Chocolatier Portrait */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          viewport={{ once: true }}
          className="lg:col-span-5 order-1 lg:order-2 relative"
        >
          <div className="aspect-[4/5] relative rounded-[4rem] overflow-hidden border-[12px] border-stone-50 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.15)] group">
            <Image 
              src={profile.imageUrl} 
              alt={profile.name} 
              fill 
              className="object-cover transition-transform duration-[2.5s] group-hover:scale-110"
              sizes="(max-width: 768px) 100vw, 500px"
            />
            {/* Soft Warm Vignette */}
            <div className="absolute inset-0 bg-gradient-to-tr from-accent/10 via-transparent to-transparent opacity-40"></div>
          </div>
          
          {/* Floating Artisan Emblem */}
          <motion.div 
            animate={{ y: [0, 15, 0], rotate: [0, -5, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -bottom-8 -left-8 h-24 w-24 bg-stone-900 rounded-[2rem] flex flex-col items-center justify-center shadow-2xl border-4 border-white"
          >
            <Sparkles className="h-8 w-8 text-primary mb-1" />
            <span className="text-[7px] font-black text-white uppercase tracking-[0.2em]">Artisan</span>
          </motion.div>
        </motion.div>

      </div>
    </section>
  );
}