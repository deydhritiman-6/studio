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
  Info,
  Clock,
  ArrowRight,
  ShieldCheck,
  Heart,
  ExternalLink,
  MessageCircle,
  CreditCard,
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
 * Enhanced Artistic Background Decorations
 * Features a light premium base with large, blurred Cyan, Magenta, and Green glows.
 */
function BackgroundDecorations() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {/* 1. Base Layer - Clean White Canvas */}
      <div className="absolute inset-0 bg-white" />
      
      {/* 2. Soft Modern Colorful Aura orbs */}
      {!shouldReduceMotion && (
        <>
          {/* Cyan / Aqua Glow - Left */}
          <motion.div 
            animate={{ 
              x: [0, 40, -30, 0], 
              y: [0, -30, 20, 0],
              opacity: [0.15, 0.25, 0.15]
            }}
            transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
            className="absolute top-[-10%] left-[-10%] w-[900px] h-[900px] bg-cyan-300/30 rounded-full blur-[140px]"
          />
          
          {/* Magenta / Pink Glow - Center */}
          <motion.div 
            animate={{ 
              x: [0, -50, 30, 0], 
              y: [0, 40, -30, 0],
              opacity: [0.1, 0.2, 0.1]
            }}
            transition={{ duration: 35, repeat: Infinity, ease: "linear" }}
            className="absolute top-[20%] left-[20%] w-[700px] h-[700px] bg-fuchsia-300/25 rounded-full blur-[160px]"
          />

          {/* Green / Mint Glow - Right */}
          <motion.div 
            animate={{ 
              opacity: [0.12, 0.22, 0.12],
              scale: [1, 1.1, 1]
            }}
            transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-[-10%] right-[-10%] w-[800px] h-[800px] bg-emerald-200/30 rounded-full blur-[140px]"
          />
        </>
      )}
      
      {/* 3. Subtle Texture Overlay */}
      <div className="absolute inset-0 opacity-[0.02] bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]" />
    </div>
  );
}

export function Footer() {
  const firestore = useFirestore();
  const settingsRef = useMemo(() => (firestore ? doc(firestore, 'settings', 'footer') : null), [firestore]);
  const { data: footerData, loading } = useDoc<any>(settingsRef as any);

  if (loading) return null;

  const {
    brand = {},
    address = {},
    contact = {},
    legal = {},
    bank = {},
    maps = {},
    social = {},
    links = [],
    policies = [],
    visibility = {}
  } = footerData || {};

  const currentYear = new Date().getFullYear();

  const socialIcons: Record<string, any> = {
    instagram: Instagram,
    facebook: Facebook,
    youtube: Youtube,
    linkedin: Linkedin,
    twitter: Twitter,
    whatsapp: MessageCircle,
  };

  const activeSocials = Object.entries(social)
    .filter(([_, url]) => url)
    .map(([platform, url]) => ({
      platform,
      url: url as string,
      Icon: socialIcons[platform.toLowerCase()] || ExternalLink
    }));

  return (
    <footer className="relative bg-white text-stone-900 pt-32 overflow-hidden selection:bg-primary/20 border-t border-stone-100 shadow-[0_-10px_50px_rgba(0,0,0,0.02)]">
      {/* Artistic Modern Background */}
      <BackgroundDecorations />

      <div className="container max-w-7xl mx-auto px-6 relative z-10">
        {/* Main Information Matrix */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-10 mb-24">
          
          {/* Brand/Identity Block - Premium Light Glass Panel */}
          <div className="group space-y-8 bg-white/40 backdrop-blur-3xl p-10 rounded-[2.5rem] border border-white/60 shadow-[0_8px_30px_rgba(0,0,0,0.04)] transition-all duration-700 hover:border-cyan-200/50 hover:shadow-2xl hover:shadow-cyan-500/5">
            <div className="space-y-6">
              <Link href="/" className="inline-block transition-transform duration-500 hover:scale-105">
                <Logo className="h-12 w-auto" />
              </Link>
              <p className="text-stone-600 text-[13px] leading-relaxed font-medium tracking-wide italic">
                {brand.description || "Every piece is a story of artisanal excellence, meticulously hand-tempered in our Kolkata studio using ethical, single-origin cacao."}
              </p>
              <div className="pt-2 flex items-center gap-3">
                 <div className="h-px flex-1 bg-gradient-to-r from-cyan-400/50 to-transparent" />
                 <p className="text-stone-400 text-[9px] font-black uppercase tracking-[0.4em] whitespace-nowrap">
                   {brand.tagline || "Handmade with Love."}
                 </p>
              </div>
            </div>
            
            <div className="space-y-5 pt-4">
              <h4 className="text-[8px] font-black uppercase tracking-[0.4em] text-stone-400">Patron Communities</h4>
              <div className="flex flex-wrap gap-4">
                {activeSocials.map(({ platform, url, Icon }) => (
                  <a 
                    key={platform} 
                    href={url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="h-10 w-10 rounded-xl bg-white border border-stone-100 flex items-center justify-center text-stone-400 hover:text-cyan-500 hover:border-cyan-200 hover:bg-cyan-50/50 transition-all duration-500 hover:-translate-y-1 group/soc shadow-sm"
                    aria-label={`Follow us on ${platform}`}
                  >
                    <Icon className="h-4 w-4 transition-transform group-hover/soc:scale-110" />
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Navigation Intelligence */}
          <div className="grid grid-cols-2 gap-8 py-6">
            <div className="space-y-10">
              <h4 className="text-[9px] font-black uppercase tracking-[0.4em] text-cyan-600">Discovery</h4>
              <ul className="space-y-5">
                {(links.length > 0 ? links : [
                  { text: 'Our Story', url: '/#story' },
                  { text: 'Collections', url: '/shop' },
                  { text: 'Artisan Journey', url: '/shop/my-orders' },
                  { text: 'Our Facilities', url: '/inside-roseberry' },
                ]).filter((l: any) => l.enabled !== false).map((link: any) => (
                  <li key={link.text}>
                    <Link 
                      href={link.url} 
                      className="text-stone-500 text-[13px] hover:text-cyan-600 transition-all duration-300 flex items-center group/link font-medium"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 mr-3 opacity-0 -translate-x-4 group-hover/link:opacity-100 group-hover/link:translate-x-0 transition-all" />
                      <span className="group-hover/link:translate-x-1 transition-transform tracking-wide">{link.text}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="space-y-10">
              <h4 className="text-[9px] font-black uppercase tracking-[0.4em] text-fuchsia-600">Assistance</h4>
              <ul className="space-y-5">
                {(policies.length > 0 ? policies : [
                  { text: 'Privacy Policy', url: '#' },
                  { text: 'Terms of Service', url: '#' },
                  { text: 'Shipping Policy', url: '#' },
                  { text: 'Return Policy', url: '#' },
                ]).filter((p: any) => p.enabled !== false).map((policy: any) => (
                  <li key={policy.text}>
                    <Link 
                      href={policy.url} 
                      className="text-stone-500 text-[13px] hover:text-fuchsia-600 transition-all duration-300 tracking-wide font-medium"
                    >
                      {policy.text}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Contact Details - Polished Panel */}
          <div className="space-y-12 bg-white/30 border border-white/50 p-10 rounded-[2.5rem] shadow-sm">
            <div className="space-y-6">
              <h4 className="text-[9px] font-black uppercase tracking-[0.4em] text-emerald-600 flex items-center gap-3">
                 <MapPin className="h-3 w-3" /> Headquarters
              </h4>
              <div className="space-y-3">
                  <p className="text-[14px] text-stone-900 font-bold leading-tight">
                    {address.businessName || "Roseberry Chocolate Studio"}
                  </p>
                  <p className="text-[13px] text-stone-500 font-medium leading-relaxed tracking-wide">
                    {address.line1 || "123 Chocolate Lane"}<br />
                    {address.line2 && <>{address.line2}<br /></>}
                    {address.area && <>{address.area}, </>}{address.city || "Kolkata"}<br />
                    {address.state || "West Bengal"} {address.zip || "700001"}
                  </p>
              </div>
            </div>

            <div className="space-y-6">
              <h4 className="text-[9px] font-black uppercase tracking-[0.4em] text-emerald-600 flex items-center gap-3">
                <Phone className="h-3 w-3" /> Communication
              </h4>
              <div className="space-y-5">
                {contact.phone && (
                  <a href={`tel:${contact.phone}`} className="flex items-center gap-4 group/contact">
                    <div className="h-8 w-8 rounded-xl bg-white border border-stone-100 flex items-center justify-center text-stone-400 group-hover/contact:text-emerald-500 group-hover/contact:border-emerald-200 group-hover/contact:bg-emerald-50/50 transition-all shadow-sm">
                      <Phone className="h-3 w-3" />
                    </div>
                    <span className="text-[13px] text-stone-600 group-hover/contact:text-stone-900 transition-colors font-semibold tracking-wide">{contact.phone}</span>
                  </a>
                )}
                {contact.email && (
                  <a href={`mailto:${contact.email}`} className="flex items-center gap-4 group/contact">
                    <div className="h-8 w-8 rounded-xl bg-white border border-stone-100 flex items-center justify-center text-stone-400 group-hover/contact:text-emerald-500 group-hover/contact:border-emerald-200 group-hover/contact:bg-emerald-50/50 transition-all shadow-sm">
                      <Mail className="h-3 w-3" />
                    </div>
                    <span className="text-[13px] text-stone-600 group-hover/contact:text-stone-900 transition-colors break-all font-semibold tracking-wide leading-none">{contact.email}</span>
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Location & Bulletin */}
          <div className="space-y-12">
            <div className="space-y-6">
              <h4 className="text-[9px] font-black uppercase tracking-[0.4em] text-cyan-600">Location Matrix</h4>
              {visibility.showMap !== false && (maps.embedUrl || maps.mapUrl) ? (
                <div className="relative group overflow-hidden rounded-[2rem] border border-stone-100 shadow-xl bg-stone-50">
                  <div className="aspect-[16/10] w-full opacity-80 group-hover:opacity-100 transition-all duration-700">
                    {maps.embedUrl ? (
                      <iframe 
                        src={maps.embedUrl} 
                        width="100%" 
                        height="100%" 
                        style={{ border: 0 }} 
                        allowFullScreen 
                        loading="lazy" 
                        referrerPolicy="no-referrer-when-downgrade"
                        title="Roseberry Studio Location"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center bg-stone-100">
                        <MapPin className="h-8 w-8 text-stone-300" />
                      </div>
                    )}
                  </div>
                  {maps.mapUrl && (
                    <a 
                      href={maps.mapUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all duration-500 backdrop-blur-[2px]"
                    >
                      <Button variant="default" className="rounded-full font-bold uppercase text-[9px] tracking-[0.2em] bg-stone-900 hover:bg-cyan-600 text-white transition-all shadow-2xl">
                        Open in Google Maps <ExternalLink className="ml-2 h-3 w-3" />
                      </Button>
                    </a>
                  )}
                </div>
              ) : (
                <div className="p-10 rounded-[2.5rem] border-2 border-dashed border-stone-100 bg-white/20 text-center space-y-4">
                  <Sparkles className="h-6 w-6 text-cyan-200 mx-auto" />
                  <p className="text-[9px] font-black text-stone-400 uppercase tracking-[0.3em] leading-relaxed">
                    Artisanal Studio • Kolkata
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-6">
              <h4 className="text-[9px] font-black uppercase tracking-[0.4em] text-fuchsia-600">Artisan Bulletin</h4>
              <div className="space-y-4">
                <p className="text-[12px] text-stone-500 italic font-medium">Be first to discover seasonal limited editions.</p>
                <div className="flex gap-2 bg-white p-1.5 rounded-2xl border border-stone-100 group focus-within:border-cyan-200 transition-all shadow-sm">
                  <input 
                    type="email" 
                    placeholder="patron@luxury.com" 
                    className="flex-1 bg-transparent border-none rounded-xl px-4 text-xs text-stone-900 focus:outline-none placeholder:text-stone-300 font-medium" 
                  />
                  <Button size="icon" className="h-10 w-10 rounded-xl shrink-0 bg-stone-900 hover:bg-cyan-600 text-white shadow-lg transition-all hover:scale-105 active:scale-95">
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Registry Panel */}
        {(visibility.showGST || visibility.showFSSAI || visibility.showBankDetails) && (
          <div className="mb-24 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
            {/* Regulatory Identity */}
            {(visibility.showGST || visibility.showFSSAI) && (
              <div className="lg:col-span-5 p-10 rounded-[2.5rem] bg-white/40 border border-white/60 shadow-sm space-y-8 backdrop-blur-3xl">
                <h4 className="text-[9px] font-black uppercase tracking-[0.4em] text-stone-400 flex items-center gap-3">
                  <ShieldCheck className="h-3.5 w-3.5" /> Registry Identity
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
                  {visibility.showGST && legal.gstin && (
                    <div className="space-y-1.5">
                      <span className="text-[8px] font-black text-stone-400 uppercase tracking-tighter">Tax Identity (GSTIN)</span>
                      <p className="text-sm font-mono font-bold text-stone-800 tracking-wider uppercase">{legal.gstin}</p>
                    </div>
                  )}
                  {visibility.showFSSAI && legal.fssaiNumber && (
                    <div className="space-y-1.5">
                      <span className="text-[8px] font-black text-stone-400 uppercase tracking-tighter">Artisanal Food Safety</span>
                      <p className="text-sm font-mono font-bold text-stone-800 tracking-wider">{legal.fssaiNumber}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Private/Masked Banking */}
            {visibility.showBankDetails && bank.enabled && (
              <div className="lg:col-span-7 p-10 rounded-[2.5rem] bg-white/40 border border-white/60 shadow-sm space-y-8 backdrop-blur-3xl group transition-colors hover:border-cyan-100">
                <h4 className="text-[9px] font-black uppercase tracking-[0.4em] text-stone-400 flex items-center gap-3">
                  <CreditCard className="h-3.5 w-3.5" /> Transfer Facilitation
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
                  <div className="space-y-1.5">
                    <span className="text-[8px] font-black text-stone-400 uppercase tracking-tighter">Beneficiary</span>
                    <p className="text-[13px] font-bold text-stone-800 truncate">{bank.accountName}</p>
                  </div>
                  <div className="space-y-1.5">
                    <span className="text-[8px] font-black text-stone-400 uppercase tracking-tighter">Bank / IFSC</span>
                    <p className="text-[12px] font-bold text-stone-500 truncate">{bank.bankName} • {bank.ifsc}</p>
                  </div>
                  <div className="space-y-1.5">
                    <span className="text-[8px] font-black text-stone-400 uppercase tracking-tighter">Acct Num</span>
                    <p className="text-sm font-mono font-bold text-stone-800">
                      {bank.masked !== false ? `•••• •••• ${bank.accountNumber?.slice(-4)}` : bank.accountNumber}
                    </p>
                  </div>
                  {bank.upiId && (
                    <div className="space-y-1.5">
                      <span className="text-[8px] font-black text-cyan-600 uppercase tracking-tighter">VPA / UPI ID</span>
                      <p className="text-sm font-mono font-bold text-cyan-700">{bank.upiId}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        <Separator className="bg-stone-100 mb-12" />

        {/* Global Exit Bar */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-10 text-center md:text-left pb-16">
          <div className="space-y-4">
            <p className="text-stone-400 text-[10px] font-black uppercase tracking-[0.3em]">
              © {currentYear} {address.businessName || "Roseberry Chocolate"}. Crafted with patience.
            </p>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 text-stone-500 text-[9px] font-black uppercase tracking-widest">
              <span className="flex items-center gap-2 group/heart cursor-default">
                <Heart className="h-3 w-3 text-rose-500 group-hover/heart:scale-110 transition-transform" /> 
                Artisan-Led in Kolkata
              </span>
              <Separator orientation="vertical" className="h-3 bg-stone-100 hidden sm:block" />
              <span className="flex items-center gap-2 cursor-default">
                <ShieldCheck className="h-3 w-3 text-cyan-400" /> 
                Certified Excellence
              </span>
            </div>
          </div>
          
          <div className="flex flex-wrap justify-center gap-10 text-[9px] font-black uppercase tracking-[0.4em] text-stone-400">
            <Link href="#" className="hover:text-cyan-600 transition-all duration-300">Privacy</Link>
            <Link href="#" className="hover:text-cyan-600 transition-all duration-300">Terms</Link>
            <Link href="#" className="hover:text-cyan-600 transition-all duration-300">Registry</Link>
            <Link href="/login" className="px-6 py-2 rounded-full border border-stone-100 bg-white hover:border-cyan-200 hover:text-cyan-600 transition-all duration-500 shadow-sm">Portal</Link>
          </div>
        </div>
      </div>
      
      {/* Visual Terminal Shimmer */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-cyan-100 to-transparent" />
    </footer>
  );
}
