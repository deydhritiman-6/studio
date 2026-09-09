'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { 
  Mail, 
  Phone, 
  MapPin, 
  Instagram, 
  Facebook, 
  Youtube, 
  Linkedin, 
  Twitter, 
  ExternalLink,
  MessageCircle,
  CreditCard,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { useDoc, useFirestore } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Logo } from '@/components/logo';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

/**
 * Modern Light Colorful Background Decorations over a Biscuit base.
 */
function BackgroundDecorations() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {/* 1. Base Layer - Warm Artisan Biscuit */}
      <div className="absolute inset-0 bg-[#f1e5d1]" /> 
      
      {/* 2. Soft Modern Colorful Aura orbs - Vibrant yet Premium */}
      {!shouldReduceMotion && (
        <>
          {/* Cyan Glow - Left */}
          <motion.div 
            animate={{ 
              x: [0, 40, -30, 0], 
              y: [0, -30, 20, 0],
              opacity: [0.15, 0.25, 0.15]
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute top-[-10%] left-[-5%] w-[800px] h-[800px] bg-cyan-400/30 rounded-full blur-[120px]"
          />
          
          {/* Magenta Glow - Center */}
          <motion.div 
            animate={{ 
              opacity: [0.1, 0.2, 0.1],
              scale: [1, 1.1, 1]
            }}
            transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-[10%] left-[30%] w-[600px] h-[600px] bg-fuchsia-400/25 rounded-full blur-[140px]"
          />

          {/* Green Glow - Right */}
          <motion.div 
            animate={{ 
              x: [0, -40, 30, 0], 
              y: [0, 40, -20, 0],
              opacity: [0.12, 0.22, 0.12]
            }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            className="absolute bottom-[-10%] right-[-5%] w-[700px] h-[700px] bg-emerald-400/30 rounded-full blur-[120px]"
          />
        </>
      )}
      
      {/* 3. Subtle Texture Overlay - Paper/Parchment feel */}
      <div className="absolute inset-0 opacity-[0.04] bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')]" />
    </div>
  );
}

export function Footer() {
  const firestore = useFirestore();
  const settingsRef = useMemo(() => (firestore ? doc(firestore, 'settings', 'footer') : null), [firestore]);
  const { data: footerData, loading } = useDoc<any>(settingsRef as any);
  const shouldReduceMotion = useReducedMotion();

  const socialIcons: Record<string, any> = {
    instagram: { icon: Instagram, color: 'text-fuchsia-600', aura: 'rgba(217, 70, 239, 0.4)', hoverBg: 'bg-fuchsia-50' },
    facebook: { icon: Facebook, color: 'text-cyan-600', aura: 'rgba(6, 182, 212, 0.4)', hoverBg: 'bg-cyan-50' },
    whatsapp: { icon: MessageCircle, color: 'text-emerald-600', aura: 'rgba(16, 185, 129, 0.4)', hoverBg: 'bg-emerald-50' },
    youtube: { icon: Youtube, color: 'text-rose-600', aura: 'rgba(225, 29, 72, 0.4)', hoverBg: 'bg-rose-50' },
    linkedin: { icon: Linkedin, color: 'text-blue-600', aura: 'rgba(37, 99, 235, 0.4)', hoverBg: 'bg-blue-50' },
    twitter: { icon: Twitter, color: 'text-sky-600', aura: 'rgba(2, 132, 199, 0.4)', hoverBg: 'bg-sky-50' },
  };

  const activeSocials = useMemo(() => {
    const social = footerData?.social || {};
    const entries = Object.entries(social)
      .filter(([_, url]) => url && typeof url === 'string' && url.trim().length > 0)
      .map(([platform, url]) => ({
        platform,
        url: url as string,
        config: socialIcons[platform.toLowerCase()] || { icon: ExternalLink, color: 'text-stone-600', aura: 'rgba(0,0,0,0.1)', hoverBg: 'bg-stone-50' }
      }));

    if (entries.length === 0) {
      return [
        { platform: 'instagram', url: 'https://instagram.com', config: socialIcons.instagram },
        { platform: 'facebook', url: 'https://facebook.com', config: socialIcons.facebook },
        { platform: 'whatsapp', url: 'https://wa.me', config: socialIcons.whatsapp },
      ];
    }
    return entries;
  }, [footerData]);

  if (loading) return null;

  const {
    brand = {},
    address = {},
    contact = {},
    legal = {},
    bank = {},
    maps = {},
    links = [],
    policies = [],
    visibility = {}
  } = footerData || {};

  return (
    <footer className="relative text-stone-900 pt-32 overflow-hidden border-t border-stone-200">
      <BackgroundDecorations />

      <div className="container max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-10 mb-24">
          
          <div className="group space-y-8 bg-white/45 backdrop-blur-xl p-10 rounded-[2.5rem] border border-white/60 shadow-xl transition-all duration-700 hover:shadow-2xl">
            <div className="space-y-6">
              <Link href="/" className="inline-block transition-transform duration-500 hover:scale-105">
                <Logo className="h-12 w-auto" />
              </Link>
              <p className="text-stone-900 text-[15px] leading-relaxed font-bold italic">
                {brand.description || "Every piece is a story of artisanal excellence, meticulously hand-tempered in our Kolkata studio using ethical, single-origin cacao."}
              </p>
              <div className="pt-2 flex items-center gap-3">
                 <div className="h-px flex-1 bg-primary/20" />
                 <p className="text-stone-600 text-[15px] font-black uppercase tracking-[0.4em] whitespace-nowrap">
                   {brand.tagline || "Handmade with Love."}
                 </p>
              </div>
            </div>
            
            <div className="space-y-6 pt-4">
              <h4 className="text-[15px] font-black uppercase tracking-[0.4em] text-stone-500">Patron Communities</h4>
              <div className="flex flex-wrap gap-5">
                {activeSocials.map(({ platform, url, config }) => (
                  <motion.a 
                    key={platform} 
                    href={url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.15, rotate: 5 }}
                    whileTap={{ scale: 0.9 }}
                    animate={!shouldReduceMotion ? {
                      boxShadow: [
                        `0 0 0px ${config.aura}`,
                        `0 0 15px ${config.aura}`,
                        `0 0 0px ${config.aura}`
                      ]
                    } : {}}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    className="h-12 w-12 rounded-2xl bg-white/80 border border-stone-100 flex items-center justify-center transition-all duration-500 shadow-sm relative group/soc overflow-hidden"
                  >
                    <div className={cn("absolute inset-0 opacity-0 group-hover/soc:opacity-100 transition-opacity duration-500", config.hoverBg)} />
                    <config.icon className={cn("h-5 w-5 transition-all duration-500 relative z-10 text-stone-500", `group-hover/soc:${config.color}`)} />
                  </motion.a>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 py-6">
            <div className="space-y-10">
              <h4 className="text-[15px] font-black uppercase tracking-[0.4em] text-stone-600">Discovery</h4>
              <ul className="space-y-5">
                {(links.length > 0 ? links : [
                  { text: 'Our Story', url: '/#story' },
                  { text: 'Collections', url: '/shop' },
                  { text: 'Artisan Journey', url: '/shop/my-orders' },
                  { text: 'Our Facilities', url: '/inside-roseberry' },
                ]).map((link: any) => (
                  <li key={link.text}>
                    <Link href={link.url} className="text-stone-900 text-[15px] hover:text-primary transition-all duration-300 font-bold tracking-wide">
                      {link.text}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="space-y-10">
              <h4 className="text-[15px] font-black uppercase tracking-[0.4em] text-stone-600">Assistance</h4>
              <ul className="space-y-5">
                {(policies.length > 0 ? policies : [
                  { text: 'Privacy Policy', url: '#' },
                  { text: 'Terms of Service', url: '#' },
                  { text: 'Shipping Policy', url: '#' },
                  { text: 'Return Policy', url: '#' },
                ]).map((policy: any) => (
                  <li key={policy.text}>
                    <Link href={policy.url} className="text-stone-900 text-[15px] hover:text-primary transition-all duration-300 font-bold tracking-wide">
                      {policy.text}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="space-y-12 bg-white/40 backdrop-blur-md border border-white/60 p-10 rounded-[2.5rem] shadow-sm">
            <div className="space-y-6">
              <h4 className="text-[15px] font-black uppercase tracking-[0.4em] text-primary flex items-center gap-3">
                 <MapPin className="h-3.5 w-3.5" /> Headquarters
              </h4>
              <div className="space-y-3">
                  <p className="text-[16px] text-stone-900 font-black leading-tight">
                    {address.businessName || "Roseberry Chocolate Studio"}
                  </p>
                  <p className="text-[15px] text-stone-900 font-bold leading-relaxed tracking-wide">
                    {address.line1 || "123 Chocolate Lane"}<br />
                    {address.line2 && <>{address.line2}<br /></>}
                    {address.city || "Kolkata"}, {address.state || "West Bengal"} {address.zip || "700001"}
                  </p>
              </div>
            </div>

            <div className="space-y-6">
              <h4 className="text-[15px] font-black uppercase tracking-[0.4em] text-primary flex items-center gap-3">
                <Phone className="h-3.5 w-3.5" /> Communication
              </h4>
              <div className="space-y-5">
                {contact.phone && (
                  <a href={`tel:${contact.phone}`} className="flex items-center gap-4 group/contact">
                    <div className="h-10 w-10 rounded-xl bg-white border border-stone-200 flex items-center justify-center text-stone-600 group-hover/contact:text-primary group-hover/contact:border-primary/20 transition-all shadow-sm">
                      <Phone className="h-4 w-4" />
                    </div>
                    <span className="text-[15px] text-stone-900 font-bold tracking-wide">{contact.phone}</span>
                  </a>
                )}
                {contact.email && (
                  <a href={`mailto:${contact.email}`} className="flex items-center gap-4 group/contact">
                    <div className="h-10 w-10 rounded-xl bg-white border border-stone-200 flex items-center justify-center text-stone-600 group-hover/contact:text-primary group-hover/contact:border-primary/20 transition-all shadow-sm">
                      <Mail className="h-4 w-4" />
                    </div>
                    <span className="text-[15px] text-stone-900 font-bold tracking-wide break-all leading-none">{contact.email}</span>
                  </a>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-12">
            <div className="space-y-6">
              <h4 className="text-[15px] font-black uppercase tracking-[0.4em] text-stone-600">Location Matrix</h4>
              {visibility.showMap !== false && (maps.embedUrl || maps.mapUrl) ? (
                <div className="relative group overflow-hidden rounded-[2.5rem] border-2 border-white/60 shadow-xl bg-white/40 backdrop-blur-md">
                  <div className="aspect-[16/10] w-full opacity-90 group-hover:opacity-100 transition-all duration-700">
                    {maps.embedUrl ? (
                      <iframe src={maps.embedUrl} width="100%" height="100%" style={{ border: 0 }} allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center bg-stone-100">
                        <MapPin className="h-8 w-8 text-stone-300" />
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-10 rounded-[2.5rem] border-2 border-dashed border-stone-200 bg-white/30 backdrop-blur-sm text-center">
                  <Sparkles className="h-6 w-6 text-primary mx-auto mb-4" />
                  <p className="text-[12px] font-black text-stone-600 uppercase tracking-[0.3em]">Artisanal Studio • Kolkata</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <Separator className="bg-stone-200/50 mb-12" />

        <div className="flex flex-col md:flex-row justify-between items-center gap-10 text-center md:text-left pb-16">
          <p className="text-stone-600 text-[12px] font-black uppercase tracking-[0.3em]">
            © {new Date().getFullYear()} {address.businessName || "Roseberry Chocolate"}. Crafted with patience.
          </p>
          <div className="flex gap-10 text-[12px] font-black uppercase tracking-[0.4em] text-stone-600">
            <Link href="/login" className="px-7 py-2.5 rounded-full border border-stone-200 bg-white/80 hover:border-primary transition-all duration-500 shadow-sm">Portal</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
