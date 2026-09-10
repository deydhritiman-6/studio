
'use client';

import React, { useMemo } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useDoc, useFirestore } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Quote, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { DirectorSettings } from '@/lib/types';
import { cn } from '@/lib/utils';

export function DirectorMessage() {
  const firestore = useFirestore();
  const settingsRef = useMemo(() => (firestore ? doc(firestore, 'settings', 'director') : null), [firestore]);
  const { data: settings, loading } = useDoc<DirectorSettings>(settingsRef as any);

  if (loading || !settings || !settings.enabled || !settings.name || !settings.message) {
    return null;
  }

  return (
    <section className="py-24 md:py-32 px-6 bg-stone-50 relative overflow-hidden">
      {/* Background Texture */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')]"></div>
      
      {/* Decorative Aura */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-7xl aspect-square bg-primary/5 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-24 items-center relative z-10">
        
        {/* Left: Director Portrait */}
        <motion.div 
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          viewport={{ once: true }}
          className="lg:col-span-5 relative"
        >
          <div className="aspect-[3/4] relative rounded-[3rem] overflow-hidden border-[12px] border-white shadow-[0_50px_100px_-20px_rgba(0,0,0,0.15)] group">
            <Image 
              src={settings.photoUrl} 
              alt={settings.name} 
              fill 
              className="object-cover transition-transform duration-[2s] group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, 500px"
            />
            {/* Glossy Overlay */}
            <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-50"></div>
          </div>
          
          {/* Decorative Rose-Gold Accent */}
          <motion.div 
            animate={{ y: [0, -10, 0], rotate: [0, 5, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-6 -left-6 h-20 w-20 bg-primary/10 backdrop-blur-md rounded-full flex items-center justify-center shadow-xl border border-primary/20"
          >
            <Sparkles className="h-8 w-8 text-primary/60" />
          </motion.div>
        </motion.div>

        {/* Right: Personal Message */}
        <div className="lg:col-span-7 space-y-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            <Badge variant="outline" className="border-primary/20 text-primary px-5 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.4em] bg-white shadow-sm">
              From the Director
            </Badge>
            <h2 className="text-4xl md:text-6xl font-bold font-headline text-stone-900 tracking-tight leading-tight">
              A Message from <br /> Our Director
            </h2>
          </motion.div>

          <motion.article 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.4 }}
            viewport={{ once: true }}
            className="relative"
          >
            <Quote className="absolute -top-8 -left-8 h-24 w-24 text-primary/5 -z-10" />
            <div className="space-y-6 text-stone-600 text-lg md:text-xl font-light leading-relaxed italic border-l-4 border-primary/20 pl-8 md:pl-10">
              <p className="whitespace-pre-wrap">{settings.message}</p>
            </div>
          </motion.article>

          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.8 }}
            viewport={{ once: true }}
            className="pt-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-8"
          >
            <div className="space-y-1">
              <p className="text-2xl font-bold font-headline text-stone-900">{settings.name}</p>
              {settings.designation && (
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-stone-400">{settings.designation}</p>
              )}
            </div>

            {settings.signatureUrl && (
              <div className="relative h-24 w-48 opacity-70 grayscale contrast-125">
                <Image 
                  src={settings.signatureUrl} 
                  alt="Artisan Signature" 
                  fill 
                  className="object-contain object-left md:object-right" 
                />
              </div>
            )}
          </motion.div>
        </div>

      </div>
    </section>
  );
}
