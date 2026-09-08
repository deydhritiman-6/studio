
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
  CreditCard
} from 'lucide-react';
import { useDoc, useFirestore } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Logo } from '@/components/logo';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

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
    <footer className="relative bg-stone-950 text-stone-200 pt-24 pb-12 overflow-hidden selection:bg-primary/30">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-[120px] -mr-48 -mt-48 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-rose-900/5 rounded-full blur-[100px] -ml-32 -mb-32 pointer-events-none" />

      <div className="container max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16 lg:gap-12 mb-20">
          
          {/* Brand Section */}
          <div className="space-y-8">
            <div className="space-y-4">
              <Link href="/" className="inline-block hover:opacity-80 transition-opacity">
                <Logo className="h-10 w-auto brightness-0 invert" />
              </Link>
              <p className="text-stone-400 text-sm leading-relaxed font-light">
                {brand.description || "Handcrafted single-origin truffles, pralines, and gift boxes made with love and extraordinary patience in the heart of Kolkata."}
              </p>
              <p className="text-primary text-xs font-black uppercase tracking-[0.3em] italic">
                {brand.tagline || "Handmade with Love."}
              </p>
            </div>
            
            <div className="space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-500">Connect with Us</h4>
              <div className="flex flex-wrap gap-4">
                {activeSocials.map(({ platform, url, Icon }) => (
                  <a 
                    key={platform} 
                    href={url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-stone-400 hover:text-primary hover:border-primary/40 hover:bg-primary/5 transition-all duration-300 group"
                    aria-label={`Follow us on ${platform}`}
                  >
                    <Icon className="h-4 w-4 group-hover:scale-110 transition-transform" />
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Links & Policies */}
          <div className="grid grid-cols-2 gap-8 lg:gap-12">
            <div className="space-y-8">
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-500">The Studio</h4>
              <ul className="space-y-4">
                {(links.length > 0 ? links : [
                  { text: 'Our Story', url: '/#story' },
                  { text: 'Collections', url: '/shop' },
                  { text: 'Artisan Journey', url: '/shop/my-orders' },
                  { text: 'Our Facilities', url: '/inside-roseberry' },
                ]).filter((l: any) => l.enabled !== false).map((link: any) => (
                  <li key={link.text}>
                    <Link 
                      href={link.url} 
                      className="text-stone-400 text-sm hover:text-white transition-colors duration-300 flex items-center group"
                    >
                      <ArrowRight className="h-3 w-3 mr-2 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all duration-300 text-primary" />
                      {link.text}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="space-y-8">
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-500">Patron Care</h4>
              <ul className="space-y-4">
                {(policies.length > 0 ? policies : [
                  { text: 'Privacy Policy', url: '#' },
                  { text: 'Terms of Service', url: '#' },
                  { text: 'Shipping Policy', url: '#' },
                  { text: 'Return Policy', url: '#' },
                ]).filter((p: any) => p.enabled !== false).map((policy: any) => (
                  <li key={policy.text}>
                    <Link 
                      href={policy.url} 
                      className="text-stone-400 text-sm hover:text-white transition-colors duration-300"
                    >
                      {policy.text}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Contact & Address */}
          <div className="space-y-10">
            <div className="space-y-6">
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-500">Visit the Studio</h4>
              <div className="flex gap-4">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
                  <MapPin className="h-4 w-4 text-primary" />
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-stone-300 font-bold leading-tight">
                    {address.businessName || "Roseberry Chocolate Studio"}
                  </p>
                  <p className="text-sm text-stone-400 font-light leading-relaxed">
                    {address.line1 || "123 Chocolate Lane"}<br />
                    {address.line2 && <>{address.line2}<br /></>}
                    {address.area && <>{address.area}, </>}{address.city || "Kolkata"}<br />
                    {address.state || "West Bengal"} {address.zip || "700001"}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-500">Reach Out</h4>
              <div className="space-y-4">
                {contact.phone && (
                  <a href={`tel:${contact.phone}`} className="flex items-center gap-4 group">
                    <div className="h-8 w-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-stone-500 group-hover:text-primary transition-colors">
                      <Phone className="h-3.5 w-3.5" />
                    </div>
                    <span className="text-sm text-stone-400 group-hover:text-white transition-colors">{contact.phone}</span>
                  </a>
                )}
                {contact.email && (
                  <a href={`mailto:${contact.email}`} className="flex items-center gap-4 group">
                    <div className="h-8 w-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-stone-500 group-hover:text-primary transition-colors">
                      <Mail className="h-3.5 w-3.5" />
                    </div>
                    <span className="text-sm text-stone-400 group-hover:text-white transition-colors break-all">{contact.email}</span>
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Map & Newsletter */}
          <div className="space-y-10">
            <div className="space-y-6">
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-500">Find Us</h4>
              {visibility.showMap !== false && (maps.embedUrl || maps.mapUrl) ? (
                <div className="relative group">
                  <div className="aspect-[16/9] w-full rounded-2xl overflow-hidden bg-stone-900 border border-white/5 shadow-2xl">
                    {maps.embedUrl ? (
                      <iframe 
                        src={maps.embedUrl} 
                        width="100%" 
                        height="100%" 
                        style={{ border: 0, filter: 'grayscale(1) invert(0.9) contrast(1.2)' }} 
                        allowFullScreen 
                        loading="lazy" 
                        referrerPolicy="no-referrer-when-downgrade"
                        title="Google Maps Location"
                      />
                    ) : (
                      <div className="h-full w-full flex flex-col items-center justify-center p-6 text-center space-y-4">
                        <MapPin className="h-8 w-8 text-stone-700" />
                        <p className="text-xs text-stone-500 italic">View our studio location on Google Maps</p>
                      </div>
                    )}
                  </div>
                  {maps.mapUrl && (
                    <a 
                      href={maps.mapUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="absolute inset-0 bg-stone-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity backdrop-blur-sm"
                    >
                      <Button variant="secondary" className="rounded-full font-bold uppercase text-[9px] tracking-widest">
                        Open in Google Maps <ExternalLink className="ml-2 h-3 w-3" />
                      </Button>
                    </a>
                  )}
                </div>
              ) : (
                <div className="p-8 rounded-2xl border border-dashed border-white/10 bg-white/5 text-center space-y-4">
                  <ShieldCheck className="h-8 w-8 text-primary/40 mx-auto" />
                  <p className="text-[10px] font-bold text-stone-500 uppercase tracking-widest leading-relaxed">
                    Kolkata's Premier Artisan <br /> Chocolate Studio
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-6">
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-500">Artisan Bulletin</h4>
              <div className="space-y-3">
                <p className="text-xs text-stone-400 italic">Subscribe for seasonal collections and studio updates.</p>
                <div className="flex gap-2">
                  <input 
                    type="email" 
                    placeholder="patron@luxury.com" 
                    className="flex-1 h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-sm focus:outline-none focus:border-primary/40 transition-colors" 
                  />
                  <Button size="icon" className="h-12 w-12 rounded-xl shrink-0">
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Business, Legal & Bank Details */}
        {(visibility.showGST || visibility.showFSSAI || visibility.showBankDetails) && (
          <div className="mb-20 grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            {/* Legal Info */}
            {(visibility.showGST || visibility.showFSSAI) && (
              <div className="p-8 rounded-[2rem] bg-stone-900/50 border border-white/5 space-y-6">
                <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-500 flex items-center gap-2">
                  <Info className="h-3 w-3" /> Business Information
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {visibility.showGST && legal.gstin && (
                    <div className="space-y-1">
                      <span className="text-[9px] font-bold text-stone-500 uppercase tracking-tighter">GSTIN</span>
                      <p className="text-sm font-mono font-bold text-stone-300">{legal.gstin}</p>
                    </div>
                  )}
                  {visibility.showFSSAI && legal.fssaiNumber && (
                    <div className="space-y-1">
                      <span className="text-[9px] font-bold text-stone-500 uppercase tracking-tighter">FSSAI License</span>
                      <p className="text-sm font-mono font-bold text-stone-300">{legal.fssaiNumber}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Bank Details */}
            {visibility.showBankDetails && bank.enabled && (
              <div className="p-8 rounded-[2rem] bg-primary/5 border border-primary/10 space-y-6">
                <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary flex items-center gap-2">
                  <CreditCard className="h-3 w-3" /> Payment Facilitation
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-primary/60 uppercase tracking-tighter">Beneficiary</span>
                    <p className="text-sm font-bold text-stone-200">{bank.accountName}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-primary/60 uppercase tracking-tighter">Bank / IFSC</span>
                    <p className="text-sm font-bold text-stone-200">{bank.bankName} • {bank.ifsc}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-primary/60 uppercase tracking-tighter">Account Number</span>
                    <p className="text-sm font-mono font-bold text-stone-200">
                      {bank.masked !== false ? `XXXX XXXX ${bank.accountNumber?.slice(-4)}` : bank.accountNumber}
                    </p>
                  </div>
                  {bank.upiId && (
                    <div className="space-y-1">
                      <span className="text-[9px] font-bold text-primary/60 uppercase tracking-tighter">VPA / UPI ID</span>
                      <p className="text-sm font-mono font-bold text-stone-200">{bank.upiId}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        <Separator className="bg-white/5 mb-12" />

        {/* Bottom Bar */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-8 text-center md:text-left">
          <div className="space-y-2">
            <p className="text-stone-500 text-[10px] font-bold uppercase tracking-[0.2em]">
              © {currentYear} {address.businessName || "Roseberry Chocolate"}. All Rights Reserved.
            </p>
            <div className="flex items-center justify-center md:justify-start gap-4 text-stone-600 text-[9px] font-black uppercase tracking-widest">
              <span className="flex items-center gap-1.5"><Heart className="h-2.5 w-2.5 text-rose-800" /> Handmade with Love in Kolkata</span>
              <Separator orientation="vertical" className="h-3 bg-white/10" />
              <span>Certified Artisan Studio</span>
            </div>
          </div>
          
          <div className="flex flex-wrap justify-center gap-6 text-[9px] font-black uppercase tracking-[0.3em] text-stone-500">
            <Link href="#" className="hover:text-primary transition-colors">Privacy Policy</Link>
            <Link href="#" className="hover:text-primary transition-colors">Terms of Service</Link>
            <Link href="#" className="hover:text-primary transition-colors">Shipping & Delivery</Link>
            <Link href="/login" className="hover:text-primary transition-colors">Portal Access</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
