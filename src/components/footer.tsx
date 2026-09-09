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
  Sparkles,
  Heart
} from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { useDoc, useFirestore } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Logo } from '@/components/logo';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

/**
 * Premium Layered Background with Drifting Auras and Textures.
 */
function PremiumBackground() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {/* 1. Base Layer - Artisan Biscuit Brown */}
      <div className="absolute inset-0 bg-[#f1e5d1]" /> 
      
      {/* 2. Soft Textured Overlay */}
      <div className="absolute inset-0 opacity-[0.05] bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')]" />

      {/* 3. Drifting Premium Auras */}
      {!shouldReduceMotion && (
        <>
          {/* Cyan Glow - Upper Left */}
          <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-cyan-400/20 rounded-full blur-[100px] animate-drifting-glow" />
          
          {/* Magenta Glow - Center */}
          <div className="absolute top-[20%] left-[30%] w-[500px] h-[500px] bg-fuchsia-400/15 rounded-full blur-[120px] animate-drifting-glow-reverse" />

          {/* Olive Green Glow - Right */}
          <div className="absolute top-[-5%] right-[-10%] w-[600px] h-[600px] bg-emerald-400/20 rounded-full blur-[110px] animate-drifting-glow" />

          {/* Cherry Red Glow - Lower / Selective */}
          <div className="absolute bottom-[-15%] left-[45%] w-[400px] h-[400px] bg-rose-400/10 rounded-full blur-[90px] animate-drifting-glow-reverse" />
        </>
      )}

      {/* 4. Elegant Abstract Chocolate Ribbons (SVG) */}
      <svg className="absolute bottom-0 left-0 w-full h-auto opacity-[0.03] text-stone-900" viewBox="0 0 1440 320" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M0,192L48,197.3C96,203,192,213,288,192C384,171,480,117,576,122.7C672,128,768,192,864,229.3C960,267,1056,277,1152,256C1248,235,1344,181,1392,154.7L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z" fill="currentColor" />
      </svg>
    </div>
  );
}

/**
 * Subtle Floating Light Particles.
 */
function FloatingParticles() {
  const shouldReduceMotion = useReducedMotion();
  if (shouldReduceMotion) return null;

  const particles = [
    { left: '10%', delay: '0s', color: 'bg-cyan-300' },
    { left: '30%', delay: '4s', color: 'bg-fuchsia-300' },
    { left: '55%', delay: '2s', color: 'bg-emerald-300' },
    { left: '80%', delay: '7s', color: 'bg-rose-300' },
    { left: '90%', delay: '1s', color: 'bg-white' },
  ];

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-10">
      {particles.map((p, i) => (
        <div 
          key={i}
          className={cn("absolute bottom-0 w-1.5 h-1.5 rounded-full blur-[1px] opacity-0 animate-particle-float", p.color)}
          style={{ left: p.left, animationDelay: p.delay }}
        />
      ))}
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
      <PremiumBackground />
      <FloatingParticles />

      <div className="container max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-10 mb-24">
          
          {/* Brand Identity Panel */}
          <div className="group space-y-8 bg-white/45 backdrop-blur-xl p-10 rounded-[2.5rem] border border-white/60 shadow-xl transition-all duration-700 hover:shadow-2xl">
            <div className="space-y-6">
              <Link href="/" className="inline-block transition-transform duration-500 hover:scale-105">
                <Logo className="h-12 w-auto" />
              </Link>
              <p className="text-[#3D1E16] text-[15px] leading-relaxed font-bold italic">
                {brand.description || "Every piece is a story of artisanal excellence, meticulously hand-tempered in our Kolkata studio using ethical, single-origin cacao."}
              </p>
              <div className="pt-2 flex items-center gap-3">
                 <div className="h-px flex-1 bg-primary/20" />
                 <p className="text-stone-600 text-[11px] font-black uppercase tracking-[0.4em] whitespace-nowrap">
                   {brand.tagline || "Handmade with Love."}
                 </p>
              </div>
            </div>
            
            <div className="space-y-6 pt-4">
              <h4 className="text-[11px] font-black uppercase tracking-[0.4em] text-stone-500">Patron Communities</h4>
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

          {/* Links Section */}
          <div className="grid grid-cols-2 gap-8 py-6">
            <div className="space-y-10">
              <h4 className="text-[11px] font-black uppercase tracking-[0.4em] text-fuchsia-700">Discovery</h4>
              <ul className="space-y-5">
                {(links.length > 0 ? links : [
                  { text: 'Our Story', url: '/#story' },
                  { text: 'Collections', url: '/shop' },
                  { text: 'Artisan Journey', url: '/shop/my-orders' },
                  { text: 'Our Facilities', url: '/inside-roseberry' },
                ]).map((link: any) => (
                  <li key={link.text}>
                    <Link href={link.url} className="text-stone-900 text-[15px] hover:text-fuchsia-600 transition-all duration-300 font-bold tracking-wide">
                      {link.text}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="space-y-10">
              <h4 className="text-[11px] font-black uppercase tracking-[0.4em] text-fuchsia-700">Assistance</h4>
              <ul className="space-y-5">
                {(policies.length > 0 ? policies : [
                  { text: 'Privacy Policy', url: '#' },
                  { text: 'Terms of Service', url: '#' },
                  { text: 'Shipping Policy', url: '#' },
                  { text: 'Return Policy', url: '#' },
                ]).map((policy: any) => (
                  <li key={policy.text}>
                    <Link href={policy.url} className="text-stone-900 text-[15px] hover:text-fuchsia-600 transition-all duration-300 font-bold tracking-wide">
                      {policy.text}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Contact Section */}
          <div className="space-y-12 bg-white/40 backdrop-blur-md border border-white/60 p-10 rounded-[2.5rem] shadow-sm">
            <div className="space-y-6">
              <h4 className="text-[11px] font-black uppercase tracking-[0.4em] text-emerald-700 flex items-center gap-3">
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
              <h4 className="text-[11px] font-black uppercase tracking-[0.4em] text-emerald-700 flex items-center gap-3">
                <Phone className="h-3.5 w-3.5" /> Communication
              </h4>
              <div className="space-y-5">
                {contact.phone && (
                  <a href={`tel:${contact.phone}`} className="flex items-center gap-4 group/contact">
                    <div className="h-10 w-10 rounded-xl bg-white border border-stone-200 flex items-center justify-center text-stone-600 group-hover/contact:text-emerald-600 group-hover/contact:border-emerald-200 transition-all shadow-sm">
                      <Phone className="h-4 w-4" />
                    </div>
                    <span className="text-[15px] text-stone-900 font-bold tracking-wide">{contact.phone}</span>
                  </a>
                )}
                {contact.email && (
                  <a href={`mailto:${contact.email}`} className="flex items-center gap-4 group/contact">
                    <div className="h-10 w-10 rounded-xl bg-white border border-stone-200 flex items-center justify-center text-stone-600 group-hover/contact:text-emerald-600 group-hover/contact:border-emerald-200 transition-all shadow-sm">
                      <Mail className="h-4 w-4" />
                    </div>
                    <span className="text-[15px] text-stone-900 font-bold tracking-wide break-all leading-none">{contact.email}</span>
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Maps Section */}
          <div className="space-y-12">
            <div className="space-y-6">
              <h4 className="text-[11px] font-black uppercase tracking-[0.4em] text-cyan-700">Location Matrix</h4>
              {visibility.showMap !== false && (maps.embedUrl) ? (
                <div className="relative group overflow-hidden rounded-[2.5rem] border-2 border-white/60 shadow-xl bg-white/40 backdrop-blur-md">
                  <div className="aspect-[16/10] w-full opacity-90 group-hover:opacity-100 transition-all duration-700">
                    <iframe src={maps.embedUrl} width="100%" height="100%" style={{ border: 0 }} allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
                  </div>
                </div>
              ) : (
                <div className="p-10 rounded-[2.5rem] border-2 border-dashed border-stone-200 bg-white/30 backdrop-blur-sm text-center">
                  <Sparkles className="h-6 w-6 text-cyan-600 mx-auto mb-4" />
                  <p className="text-[12px] font-black text-stone-600 uppercase tracking-[0.3em]">Artisanal Studio • Kolkata</p>
                </div>
              )}
            </div>

            {/* Cherry Red Accent - Secure Badge */}
            <div className="p-6 bg-rose-500/5 rounded-2xl border border-rose-500/10 flex items-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                <div className="h-10 w-10 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-600 shadow-inner">
                    <Heart className="h-5 w-5 fill-current" />
                </div>
                <div className="space-y-0.5">
                    <p className="text-[10px] font-black uppercase tracking-widest text-rose-700 leading-none">Artisan Commitment</p>
                    <p className="text-[12px] font-bold text-rose-900/60 leading-tight">Handmade with Extraordinary Patience</p>
                </div>
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
