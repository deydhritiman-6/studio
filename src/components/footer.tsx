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
 * Features multi-color moving orbs, chocolate textures, and flowing shapes.
 */
function BackgroundDecorations() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {/* 1. Deep Base Layer */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#1a0f0d] via-[#2d110b] to-[#3D1E16]" />
      
      {/* 2. Cocoa/Noise Texture Overlay */}
      <div className="absolute inset-0 opacity-[0.04] mix-blend-overlay bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]" />

      {!shouldReduceMotion && (
        <>
          {/* 3. Luminous Colorful Orbs */}
          {/* Muted Rose Orb */}
          <motion.div 
            animate={{ 
              x: [0, 80, -50, 0], 
              y: [0, -60, 40, 0],
              scale: [1, 1.2, 0.9, 1]
            }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-rose-900/30 rounded-full blur-[120px]"
          />
          
          {/* Warm Caramel Orb */}
          <motion.div 
            animate={{ 
              x: [0, -100, 50, 0], 
              y: [0, 100, -50, 0],
              scale: [1, 1.1, 1.3, 1]
            }}
            transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
            className="absolute bottom-[-15%] right-[10%] w-[700px] h-[700px] bg-[#bc9142]/20 rounded-full blur-[140px]"
          />

          {/* Champagne Gold Orb */}
          <motion.div 
            animate={{ 
              opacity: [0.1, 0.3, 0.2, 0.1],
              scale: [0.8, 1, 0.9, 0.8]
            }}
            transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-[20%] left-[40%] w-[450px] h-[450px] bg-[#D4AF37]/15 rounded-full blur-[100px]"
          />

          {/* Wine/Burgundy Glow */}
          <motion.div 
            animate={{ 
              x: [100, 0, 100], 
              y: [-50, 50, -50]
            }}
            transition={{ duration: 35, repeat: Infinity, ease: "linear" }}
            className="absolute top-[40%] right-[-5%] w-[500px] h-[500px] bg-[#800020]/20 rounded-full blur-[120px]"
          />

          {/* Warm Cream Highlight */}
          <motion.div 
            animate={{ 
              opacity: [0.05, 0.2, 0.05]
            }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-[20%] left-[10%] w-[350px] h-[350px] bg-[#fdfbf3]/10 rounded-full blur-[90px]"
          />
        </>
      )}
      
      {/* 4. Elegant Flowing Shapes (SVG) */}
      <svg className="absolute bottom-0 left-0 w-full h-auto text-white/5 opacity-50" viewBox="0 0 1440 320" preserveAspectRatio="none">
        <path fill="currentColor" d="M0,160L48,176C96,192,192,208,288,186.7C384,165,480,107,576,101.3C672,96,768,144,864,165.3C960,187,1056,181,1152,160C1248,139,1344,101,1392,90.7L1440,80L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
      </svg>
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
    hours = {},
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
    <footer className="relative bg-[#1a0f0d] text-stone-200 pt-32 overflow-hidden selection:bg-primary/40 border-t border-[#D4AF37]/20">
      {/* Artistic Layered Background */}
      <BackgroundDecorations />

      <div className="container max-w-7xl mx-auto px-6 relative z-10">
        {/* Main Information Matrix */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-10 mb-24">
          
          {/* Identity Block - Glassmorphism */}
          <div className="group space-y-8 bg-white/[0.03] backdrop-blur-2xl p-10 rounded-[3rem] border border-white/10 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] transition-all duration-500 hover:bg-white/[0.06] hover:border-[#D4AF37]/30">
            <div className="space-y-6">
              <Link href="/" className="inline-block hover:opacity-80 transition-opacity">
                <Logo className="h-11 w-auto brightness-0 invert" />
              </Link>
              <p className="text-stone-300 text-sm leading-relaxed font-light">
                {brand.description || "Handcrafted single-origin truffles, pralines, and gift boxes made with love and extraordinary patience in the heart of Kolkata."}
              </p>
              <div className="flex items-center gap-3">
                 <div className="h-px flex-1 bg-gradient-to-r from-[#D4AF37]/40 to-transparent" />
                 <p className="text-[#D4AF37] text-[10px] font-black uppercase tracking-[0.4em] italic whitespace-nowrap">
                   {brand.tagline || "Handmade with Love."}
                 </p>
              </div>
            </div>
            
            <div className="space-y-5">
              <h4 className="text-[9px] font-black uppercase tracking-[0.3em] text-stone-500">Connect with Us</h4>
              <div className="flex flex-wrap gap-4">
                {activeSocials.map(({ platform, url, Icon }) => (
                  <a 
                    key={platform} 
                    href={url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="h-11 w-11 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-stone-400 hover:text-[#D4AF37] hover:border-[#D4AF37]/50 hover:bg-[#D4AF37]/10 transition-all duration-500 hover:-translate-y-1"
                    aria-label={`Follow us on ${platform}`}
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Navigation Intelligence */}
          <div className="grid grid-cols-2 gap-8 py-6">
            <div className="space-y-10">
              <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-[#D4AF37]">The Studio</h4>
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
                      className="text-stone-300 text-sm hover:text-white transition-all duration-300 flex items-center group/link"
                    >
                      <ArrowRight className="h-3 w-3 mr-3 text-[#D4AF37] opacity-0 -translate-x-4 group-hover/link:opacity-100 group-hover/link:translate-x-0 transition-all" />
                      <span className="group-hover/link:translate-x-1 transition-transform">{link.text}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="space-y-10">
              <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-[#D4AF37]">Patron Care</h4>
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
                      className="text-stone-300 text-sm hover:text-white transition-all duration-300"
                    >
                      {policy.text}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Contact Logic - Glass Panel */}
          <div className="space-y-12 bg-white/[0.02] backdrop-blur-xl p-10 rounded-[3rem] border border-white/5 shadow-2xl">
            <div className="space-y-6">
              <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-[#D4AF37]">Visit the Studio</h4>
              <div className="flex gap-5">
                <div className="h-11 w-11 rounded-2xl bg-[#D4AF37]/10 border border-[#D4AF37]/20 flex items-center justify-center shrink-0 shadow-[0_10px_20px_rgba(212,175,55,0.15)]">
                  <MapPin className="h-4 w-4 text-[#D4AF37]" />
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-stone-100 font-bold leading-tight">
                    {address.businessName || "Roseberry Chocolate Studio"}
                  </p>
                  <p className="text-[13px] text-stone-400 font-light leading-relaxed">
                    {address.line1 || "123 Chocolate Lane"}<br />
                    {address.line2 && <>{address.line2}<br /></>}
                    {address.area && <>{address.area}, </>}{address.city || "Kolkata"}<br />
                    {address.state || "West Bengal"} {address.zip || "700001"}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-[#D4AF37]">Direct Inquiry</h4>
              <div className="space-y-5">
                {contact.phone && (
                  <a href={`tel:${contact.phone}`} className="flex items-center gap-5 group/contact">
                    <div className="h-9 w-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-stone-500 group-hover/contact:text-[#D4AF37] group-hover/contact:border-[#D4AF37]/30 transition-all">
                      <Phone className="h-3.5 w-3.5" />
                    </div>
                    <span className="text-sm text-stone-300 group-hover/contact:text-white transition-colors font-medium">{contact.phone}</span>
                  </a>
                )}
                {contact.email && (
                  <a href={`mailto:${contact.email}`} className="flex items-center gap-5 group/contact">
                    <div className="h-9 w-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-stone-500 group-hover/contact:text-[#D4AF37] group-hover/contact:border-[#D4AF37]/30 transition-all">
                      <Mail className="h-3.5 w-3.5" />
                    </div>
                    <span className="text-sm text-stone-300 group-hover/contact:text-white transition-colors break-all font-medium leading-none">{contact.email}</span>
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Location & Bulletin */}
          <div className="space-y-12">
            <div className="space-y-6">
              <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-[#D4AF37]">Find Us</h4>
              {visibility.showMap !== false && (maps.embedUrl || maps.mapUrl) ? (
                <div className="relative group overflow-hidden rounded-[2rem] border-2 border-[#D4AF37]/20 shadow-2xl">
                  <div className="aspect-[16/10] w-full bg-stone-950">
                    {maps.embedUrl ? (
                      <iframe 
                        src={maps.embedUrl} 
                        width="100%" 
                        height="100%" 
                        style={{ border: 0, filter: 'grayscale(1) invert(0.92) contrast(1.1) brightness(0.9)' }} 
                        allowFullScreen 
                        loading="lazy" 
                        referrerPolicy="no-referrer-when-downgrade"
                        title="Google Maps Location"
                      />
                    ) : (
                      <div className="h-full w-full flex flex-col items-center justify-center p-6 text-center space-y-4">
                        <MapPin className="h-8 w-8 text-stone-800" />
                        <p className="text-[10px] text-stone-600 uppercase tracking-widest">Map Preview Unavailable</p>
                      </div>
                    )}
                  </div>
                  {maps.mapUrl && (
                    <a 
                      href={maps.mapUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="absolute inset-0 bg-stone-950/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all duration-500 backdrop-blur-sm"
                    >
                      <Button variant="outline" className="rounded-full font-bold uppercase text-[9px] tracking-[0.2em] border-primary/50 text-primary bg-stone-900 shadow-2xl hover:bg-primary hover:text-stone-950 transition-all">
                        Navigate to Studio <ExternalLink className="ml-2 h-3 w-3" />
                      </Button>
                    </a>
                  )}
                </div>
              ) : (
                <div className="p-10 rounded-[2.5rem] border-2 border-dashed border-[#D4AF37]/20 bg-[#D4AF37]/5 text-center space-y-5">
                  <ShieldCheck className="h-9 w-9 text-[#D4AF37]/30 mx-auto" />
                  <p className="text-[10px] font-black text-stone-500 uppercase tracking-[0.3em] leading-relaxed">
                    Kolkata's Premier Artisan <br /> Chocolate Studio
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-6">
              <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-[#D4AF37]">Artisan Bulletin</h4>
              <div className="space-y-4">
                <p className="text-[13px] text-stone-400 italic">Be first to discover seasonal collections.</p>
                <div className="flex gap-3 bg-white/5 p-1.5 rounded-2xl border border-white/10 group focus-within:border-[#D4AF37]/40 transition-colors">
                  <input 
                    type="email" 
                    placeholder="patron@luxury.com" 
                    className="flex-1 bg-transparent border-none rounded-xl px-4 text-sm text-stone-200 focus:outline-none placeholder:text-stone-700" 
                  />
                  <Button size="icon" className="h-11 w-11 rounded-xl shrink-0 bg-[#D4AF37] hover:bg-[#bc9142] text-stone-950 shadow-xl transition-all hover:scale-105 active:scale-95">
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Global Business Registry Panel */}
        {(visibility.showGST || visibility.showFSSAI || visibility.showBankDetails) && (
          <div className="mb-24 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">
            {/* Regulatory Identity */}
            {(visibility.showGST || visibility.showFSSAI) && (
              <div className="lg:col-span-5 p-10 rounded-[3rem] bg-white/[0.03] backdrop-blur-3xl border border-white/10 shadow-2xl space-y-8 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors" />
                <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-[#D4AF37] flex items-center gap-3">
                  <Info className="h-3.5 w-3.5" /> Business Registry
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
                  {visibility.showGST && legal.gstin && (
                    <div className="space-y-1.5">
                      <span className="text-[9px] font-black text-stone-500 uppercase tracking-tighter">Tax Identity (GSTIN)</span>
                      <p className="text-sm font-mono font-bold text-stone-100 tracking-wider">{legal.gstin}</p>
                    </div>
                  )}
                  {visibility.showFSSAI && legal.fssaiNumber && (
                    <div className="space-y-1.5">
                      <span className="text-[9px] font-black text-stone-500 uppercase tracking-tighter">Food Safety License</span>
                      <p className="text-sm font-mono font-bold text-stone-100 tracking-wider">{legal.fssaiNumber}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Financial Facilitation */}
            {visibility.showBankDetails && bank.enabled && (
              <div className="lg:col-span-7 p-10 rounded-[3rem] bg-[#D4AF37]/[0.03] backdrop-blur-3xl border border-[#D4AF37]/20 shadow-2xl space-y-8 relative group">
                <div className="absolute top-[-20%] left-[-10%] w-[200px] h-[200px] bg-[#bc9142]/10 rounded-full blur-[80px]" />
                <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-[#D4AF37] flex items-center gap-3">
                  <CreditCard className="h-3.5 w-3.5" /> Payment Facilitation
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
                  <div className="space-y-1.5">
                    <span className="text-[9px] font-black text-stone-500 uppercase tracking-tighter">Beneficiary</span>
                    <p className="text-[13px] font-bold text-stone-100 truncate">{bank.accountName}</p>
                  </div>
                  <div className="space-y-1.5">
                    <span className="text-[9px] font-black text-stone-500 uppercase tracking-tighter">Bank / IFSC</span>
                    <p className="text-[13px] font-bold text-stone-100 truncate">{bank.bankName} • {bank.ifsc}</p>
                  </div>
                  <div className="space-y-1.5">
                    <span className="text-[9px] font-black text-stone-500 uppercase tracking-tighter">Acct Number</span>
                    <p className="text-sm font-mono font-bold text-stone-100">
                      {bank.masked !== false ? `XXXX XXXX ${bank.accountNumber?.slice(-4)}` : bank.accountNumber}
                    </p>
                  </div>
                  {bank.upiId && (
                    <div className="space-y-1.5">
                      <span className="text-[9px] font-black text-[#D4AF37] uppercase tracking-tighter">UPI / VPA ID</span>
                      <p className="text-sm font-mono font-bold text-[#D4AF37]">{bank.upiId}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        <Separator className="bg-white/10 mb-12" />

        {/* Global Exit Bar */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-10 text-center md:text-left pb-16">
          <div className="space-y-4">
            <p className="text-stone-500 text-[10px] font-black uppercase tracking-[0.3em]">
              © {currentYear} {address.businessName || "Roseberry Chocolate"}. All Rights Reserved.
            </p>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-5 text-stone-600 text-[9px] font-black uppercase tracking-widest">
              <span className="flex items-center gap-2 hover:text-rose-400 transition-all duration-700 cursor-default group/love">
                <Heart className="h-3 w-3 text-rose-800 group-hover/love:scale-125 transition-transform" /> 
                Handmade with Love in Kolkata
              </span>
              <Separator orientation="vertical" className="h-3 bg-white/10 hidden sm:block" />
              <span className="flex items-center gap-2 cursor-default">
                <ShieldCheck className="h-3 w-3 text-[#D4AF37]" /> 
                Certified Artisan Studio
              </span>
            </div>
          </div>
          
          <div className="flex flex-wrap justify-center gap-8 text-[9px] font-black uppercase tracking-[0.4em] text-stone-500">
            <Link href="#" className="hover:text-[#D4AF37] transition-all hover:scale-105">Privacy</Link>
            <Link href="#" className="hover:text-[#D4AF37] transition-all hover:scale-105">Terms</Link>
            <Link href="#" className="hover:text-[#D4AF37] transition-all hover:scale-105">Shipping</Link>
            <Link href="/login" className="px-5 py-2 rounded-full border border-white/10 hover:border-[#D4AF37]/50 hover:text-[#D4AF37] transition-all">Portal Access</Link>
          </div>
        </div>
      </div>
      
      {/* Visual Terminal Shimmer */}
      <div className="h-1.5 w-full bg-gradient-to-r from-transparent via-[#D4AF37]/40 to-transparent opacity-30 blur-sm" />
    </footer>
  );
}
