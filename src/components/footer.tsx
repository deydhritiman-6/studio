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
      {/* 1. Deep Base Layer - Luxury Chocolate Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0f0807] via-[#1a0f0d] to-[#2d110b]" />
      
      {/* 2. Cocoa/Noise Texture Overlay */}
      <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]" />

      {!shouldReduceMotion && (
        <>
          {/* 3. Luminous Colorful Orbs - Subdued Luxury Tones */}
          {/* Muted Rose/Burgundy Glow */}
          <motion.div 
            animate={{ 
              x: [0, 40, -30, 0], 
              y: [0, -30, 20, 0],
              opacity: [0.1, 0.15, 0.1]
            }}
            transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
            className="absolute top-[-5%] left-[-5%] w-[500px] h-[500px] bg-rose-900/40 rounded-full blur-[120px]"
          />
          
          {/* Deep Caramel Glow */}
          <motion.div 
            animate={{ 
              x: [0, -50, 30, 0], 
              y: [0, 40, -30, 0],
              opacity: [0.05, 0.1, 0.05]
            }}
            transition={{ duration: 35, repeat: Infinity, ease: "linear" }}
            className="absolute bottom-[-10%] right-[5%] w-[600px] h-[600px] bg-[#bc9142]/30 rounded-full blur-[140px]"
          />

          {/* Champagne Gold Accents */}
          <motion.div 
            animate={{ 
              opacity: [0.03, 0.1, 0.05],
              scale: [1, 1.1, 1]
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-[30%] left-[35%] w-[400px] h-[400px] bg-[#D4AF37]/20 rounded-full blur-[100px]"
          />
        </>
      )}
      
      {/* 4. Elegant Flowing Shapes - "Chocolate Ribbon" */}
      <svg className="absolute bottom-0 left-0 w-full h-auto text-white/[0.02] opacity-30" viewBox="0 0 1440 320" preserveAspectRatio="none">
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
    <footer className="relative bg-[#0f0807] text-stone-200 pt-32 overflow-hidden selection:bg-primary/40 border-t border-[#D4AF37]/30 shadow-[0_-20px_100px_rgba(0,0,0,0.5)]">
      {/* Artistic Layered Background */}
      <BackgroundDecorations />

      <div className="container max-w-7xl mx-auto px-6 relative z-10">
        {/* Main Information Matrix */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-10 mb-24">
          
          {/* Brand/Identity Block - Premium "Foil" Label Styling */}
          <div className="group space-y-8 bg-black/20 backdrop-blur-3xl p-10 rounded-[2.5rem] border border-white/[0.05] shadow-2xl transition-all duration-700 hover:border-[#D4AF37]/40">
            <div className="space-y-6">
              <Link href="/" className="inline-block transition-transform duration-500 hover:scale-105">
                <Logo className="h-12 w-auto brightness-0 invert" />
              </Link>
              <p className="text-stone-400 text-[13px] leading-relaxed font-light tracking-wide italic">
                {brand.description || "Every piece is a story of artisanal excellence, meticulously hand-tempered in our Kolkata studio using ethical, single-origin cacao."}
              </p>
              <div className="pt-2 flex items-center gap-3">
                 <div className="h-px flex-1 bg-gradient-to-r from-[#D4AF37]/50 to-transparent" />
                 <p className="text-[#D4AF37] text-[9px] font-black uppercase tracking-[0.4em] whitespace-nowrap">
                   {brand.tagline || "Handmade with Love."}
                 </p>
              </div>
            </div>
            
            <div className="space-y-5 pt-4">
              <h4 className="text-[8px] font-black uppercase tracking-[0.4em] text-stone-600">Patron Communities</h4>
              <div className="flex flex-wrap gap-4">
                {activeSocials.map(({ platform, url, Icon }) => (
                  <a 
                    key={platform} 
                    href={url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="h-10 w-10 rounded-xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center text-stone-500 hover:text-[#D4AF37] hover:border-[#D4AF37]/50 hover:bg-[#D4AF37]/10 transition-all duration-500 hover:-translate-y-1 group/soc"
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
              <h4 className="text-[9px] font-black uppercase tracking-[0.4em] text-[#D4AF37]/80">Discovery</h4>
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
                      className="text-stone-400 text-[13px] hover:text-[#D4AF37] transition-all duration-300 flex items-center group/link"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] mr-3 opacity-0 -translate-x-4 group-hover/link:opacity-100 group-hover/link:translate-x-0 transition-all" />
                      <span className="group-hover/link:translate-x-1 transition-transform tracking-wide">{link.text}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="space-y-10">
              <h4 className="text-[9px] font-black uppercase tracking-[0.4em] text-[#D4AF37]/80">Assistance</h4>
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
                      className="text-stone-400 text-[13px] hover:text-[#D4AF37] transition-all duration-300 tracking-wide"
                    >
                      {policy.text}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Contact Details - "Gilded" Panel */}
          <div className="space-y-12 bg-white/[0.01] border border-white/[0.03] p-10 rounded-[2.5rem] shadow-xl">
            <div className="space-y-6">
              <h4 className="text-[9px] font-black uppercase tracking-[0.4em] text-[#D4AF37]/80 flex items-center gap-3">
                 <MapPin className="h-3 w-3" /> Headquarters
              </h4>
              <div className="space-y-3">
                  <p className="text-[14px] text-stone-100 font-bold leading-tight">
                    {address.businessName || "Roseberry Chocolate Studio"}
                  </p>
                  <p className="text-[13px] text-stone-500 font-light leading-relaxed tracking-wide">
                    {address.line1 || "123 Chocolate Lane"}<br />
                    {address.line2 && <>{address.line2}<br /></>}
                    {address.area && <>{address.area}, </>}{address.city || "Kolkata"}<br />
                    {address.state || "West Bengal"} {address.zip || "700001"}
                  </p>
              </div>
            </div>

            <div className="space-y-6">
              <h4 className="text-[9px] font-black uppercase tracking-[0.4em] text-[#D4AF37]/80 flex items-center gap-3">
                <Phone className="h-3 w-3" /> Communication
              </h4>
              <div className="space-y-5">
                {contact.phone && (
                  <a href={`tel:${contact.phone}`} className="flex items-center gap-4 group/contact">
                    <div className="h-8 w-8 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center text-stone-600 group-hover/contact:text-[#D4AF37] group-hover/contact:border-[#D4AF37]/30 transition-all">
                      <Phone className="h-3 w-3" />
                    </div>
                    <span className="text-[13px] text-stone-400 group-hover/contact:text-stone-200 transition-colors font-medium tracking-wide">{contact.phone}</span>
                  </a>
                )}
                {contact.email && (
                  <a href={`mailto:${contact.email}`} className="flex items-center gap-4 group/contact">
                    <div className="h-8 w-8 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center text-stone-600 group-hover/contact:text-[#D4AF37] group-hover/contact:border-[#D4AF37]/30 transition-all">
                      <Mail className="h-3 w-3" />
                    </div>
                    <span className="text-[13px] text-stone-400 group-hover/contact:text-stone-200 transition-colors break-all font-medium tracking-wide leading-none">{contact.email}</span>
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Location & Bulletin */}
          <div className="space-y-12">
            <div className="space-y-6">
              <h4 className="text-[9px] font-black uppercase tracking-[0.4em] text-[#D4AF37]/80">Interactive Maps</h4>
              {visibility.showMap !== false && (maps.embedUrl || maps.mapUrl) ? (
                <div className="relative group overflow-hidden rounded-[2rem] border border-white/[0.08] shadow-2xl bg-black">
                  <div className="aspect-[16/10] w-full grayscale opacity-40 group-hover:opacity-70 group-hover:grayscale-0 transition-all duration-700">
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
                      <div className="h-full w-full flex items-center justify-center bg-stone-900">
                        <MapPin className="h-8 w-8 text-stone-800" />
                      </div>
                    )}
                  </div>
                  {maps.mapUrl && (
                    <a 
                      href={maps.mapUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="absolute inset-0 bg-stone-950/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all duration-500 backdrop-blur-[2px]"
                    >
                      <Button variant="outline" className="rounded-full font-bold uppercase text-[9px] tracking-[0.2em] border-[#D4AF37]/40 text-[#D4AF37] bg-stone-950 hover:bg-[#D4AF37] hover:text-stone-950 transition-all shadow-2xl">
                        Open in Google Maps <ExternalLink className="ml-2 h-3 w-3" />
                      </Button>
                    </a>
                  )}
                </div>
              ) : (
                <div className="p-10 rounded-[2.5rem] border-2 border-dashed border-white/[0.06] bg-white/[0.02] text-center space-y-4">
                  <Sparkles className="h-6 w-6 text-[#D4AF37]/30 mx-auto" />
                  <p className="text-[9px] font-black text-stone-600 uppercase tracking-[0.3em] leading-relaxed">
                    Artisanal Studio • Kolkata
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-6">
              <h4 className="text-[9px] font-black uppercase tracking-[0.4em] text-[#D4AF37]/80">Artisan Bulletin</h4>
              <div className="space-y-4">
                <p className="text-[12px] text-stone-500 italic font-light">Be first to discover seasonal limited editions.</p>
                <div className="flex gap-2 bg-white/[0.02] p-1.5 rounded-2xl border border-white/[0.06] group focus-within:border-[#D4AF37]/30 transition-all shadow-inner">
                  <input 
                    type="email" 
                    placeholder="patron@luxury.com" 
                    className="flex-1 bg-transparent border-none rounded-xl px-4 text-xs text-stone-300 focus:outline-none placeholder:text-stone-800" 
                  />
                  <Button size="icon" className="h-10 w-10 rounded-xl shrink-0 bg-[#D4AF37] hover:bg-[#bc9142] text-stone-950 shadow-xl transition-all hover:scale-105 active:scale-95">
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Registry Panel - Hidden if empty */}
        {(visibility.showGST || visibility.showFSSAI || visibility.showBankDetails) && (
          <div className="mb-24 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
            {/* Regulatory Identity */}
            {(visibility.showGST || visibility.showFSSAI) && (
              <div className="lg:col-span-5 p-10 rounded-[2.5rem] bg-white/[0.01] border border-white/[0.05] shadow-2xl space-y-8">
                <h4 className="text-[9px] font-black uppercase tracking-[0.4em] text-[#D4AF37]/60 flex items-center gap-3">
                  <ShieldCheck className="h-3.5 w-3.5" /> Registry Identity
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
                  {visibility.showGST && legal.gstin && (
                    <div className="space-y-1.5">
                      <span className="text-[8px] font-black text-stone-600 uppercase tracking-tighter">Tax Identity (GSTIN)</span>
                      <p className="text-sm font-mono font-bold text-stone-300 tracking-wider uppercase">{legal.gstin}</p>
                    </div>
                  )}
                  {visibility.showFSSAI && legal.fssaiNumber && (
                    <div className="space-y-1.5">
                      <span className="text-[8px] font-black text-stone-600 uppercase tracking-tighter">Artisanal Food Safety</span>
                      <p className="text-sm font-mono font-bold text-stone-300 tracking-wider">{legal.fssaiNumber}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Private/Masked Banking - Handled securely */}
            {visibility.showBankDetails && bank.enabled && (
              <div className="lg:col-span-7 p-10 rounded-[2.5rem] bg-[#D4AF37]/[0.01] border border-[#D4AF37]/10 shadow-2xl space-y-8 group transition-colors hover:border-[#D4AF37]/20">
                <h4 className="text-[9px] font-black uppercase tracking-[0.4em] text-[#D4AF37]/60 flex items-center gap-3">
                  <CreditCard className="h-3.5 w-3.5" /> Transfer Facilitation
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
                  <div className="space-y-1.5">
                    <span className="text-[8px] font-black text-stone-600 uppercase tracking-tighter">Beneficiary</span>
                    <p className="text-[13px] font-bold text-stone-300 truncate">{bank.accountName}</p>
                  </div>
                  <div className="space-y-1.5">
                    <span className="text-[8px] font-black text-stone-600 uppercase tracking-tighter">Bank / IFSC</span>
                    <p className="text-[12px] font-medium text-stone-400 truncate">{bank.bankName} • {bank.ifsc}</p>
                  </div>
                  <div className="space-y-1.5">
                    <span className="text-[8px] font-black text-stone-600 uppercase tracking-tighter">Acct Num</span>
                    <p className="text-sm font-mono font-bold text-stone-300">
                      {bank.masked !== false ? `•••• •••• ${bank.accountNumber?.slice(-4)}` : bank.accountNumber}
                    </p>
                  </div>
                  {bank.upiId && (
                    <div className="space-y-1.5">
                      <span className="text-[8px] font-black text-[#D4AF37]/70 uppercase tracking-tighter">VPA / UPI ID</span>
                      <p className="text-sm font-mono font-bold text-[#D4AF37]">{bank.upiId}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        <Separator className="bg-white/[0.04] mb-12" />

        {/* Global Exit Bar - Refined Typography */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-10 text-center md:text-left pb-16">
          <div className="space-y-4">
            <p className="text-stone-600 text-[10px] font-black uppercase tracking-[0.3em]">
              © {currentYear} {address.businessName || "Roseberry Chocolate"}. Crafted with patience.
            </p>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 text-stone-700 text-[9px] font-black uppercase tracking-widest">
              <span className="flex items-center gap-2 group/heart cursor-default">
                <Heart className="h-3 w-3 text-rose-950 group-hover/heart:text-rose-800 transition-colors" /> 
                Artisan-Led in Kolkata
              </span>
              <Separator orientation="vertical" className="h-3 bg-white/5 hidden sm:block" />
              <span className="flex items-center gap-2 cursor-default">
                <ShieldCheck className="h-3 w-3 text-[#D4AF37]/40" /> 
                Certified Excellence
              </span>
            </div>
          </div>
          
          <div className="flex flex-wrap justify-center gap-10 text-[9px] font-black uppercase tracking-[0.4em] text-stone-600">
            <Link href="#" className="hover:text-[#D4AF37] transition-all duration-300">Privacy</Link>
            <Link href="#" className="hover:text-[#D4AF37] transition-all duration-300">Terms</Link>
            <Link href="#" className="hover:text-[#D4AF37] transition-all duration-300">Registry</Link>
            <Link href="/login" className="px-6 py-2 rounded-full border border-white/[0.04] hover:border-[#D4AF37]/30 hover:text-[#D4AF37] transition-all duration-500">Portal</Link>
          </div>
        </div>
      </div>
      
      {/* Visual Terminal Shimmer */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-[#D4AF37]/20 to-transparent opacity-20" />
    </footer>
  );
}
