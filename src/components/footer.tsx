'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { 
  Mail, 
  Phone, 
  MapPin, 
  Instagram, 
  Facebook, 
  MessageCircle, 
  CreditCard, 
  ShieldCheck, 
  Globe, 
  CheckCircle, 
  QrCode, 
  ArrowRight,
  ExternalLink,
  Heart
} from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { useDoc, useFirestore } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Logo } from '@/components/logo';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

function PremiumBackground() {
  const shouldReduceMotion = useReducedMotion();
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      <div className="absolute inset-0 bg-[#f1e5d1]" /> 
      <div className="absolute inset-0 opacity-[0.05] bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')]" />
      {!shouldReduceMotion && (
        <>
          <div className="absolute top-[-30%] left-[-30%] w-[1200px] h-[1200px] bg-cyan-400/25 rounded-full blur-[180px] animate-drifting-glow" />
          <div className="absolute top-[10%] left-[10%] w-[1000px] h-[1000px] bg-fuchsia-400/20 rounded-full blur-[200px] animate-drifting-glow-reverse" />
          <div className="absolute top-[-25%] right-[-30%] w-[1100px] h-[1100px] bg-emerald-400/25 rounded-full blur-[180px] animate-drifting-glow" />
          <div className="absolute bottom-[-30%] left-[30%] w-[800px] h-[800px] bg-rose-400/15 rounded-full blur-[150px] animate-drifting-glow-reverse" />
        </>
      )}
      <motion.svg 
        animate={!shouldReduceMotion ? { y: [0, -20, 0], scaleY: [1, 1.08, 1] } : {}}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-0 left-0 w-full h-auto opacity-[0.04] text-stone-900" 
        viewBox="0 0 1440 320" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M0,192L48,197.3C96,203,192,213,288,192C384,171,480,117,576,122.7C672,128,768,192,864,229.3C960,267,1056,277,1152,256C1248,235,1344,181,1392,154.7L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z" fill="currentColor" />
      </motion.svg>
    </div>
  );
}

function FloatingParticles() {
  const shouldReduceMotion = useReducedMotion();
  if (shouldReduceMotion) return null;
  const particles = Array.from({ length: 50 }).map((_, i) => ({
    left: `${Math.random() * 100}%`,
    delay: `${Math.random() * 20}s`,
    color: ['bg-cyan-300', 'bg-fuchsia-300', 'bg-emerald-300', 'bg-rose-300', 'bg-white', 'bg-amber-200'][i % 6],
    duration: `${Math.random() * 15 + 10}s`
  }));
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-10">
      {particles.map((p, i) => (
        <div 
          key={i}
          className={cn("absolute bottom-0 w-1.5 h-1.5 rounded-full blur-[1px] opacity-0 animate-particle-float", p.color)}
          style={{ left: p.left, animationDelay: p.delay, animationDuration: p.duration }}
        />
      ))}
    </div>
  );
}

const panelVariants = (delay: number) => ({
  animate: {
    y: [0, -8, 0],
    transition: {
      duration: 8,
      repeat: Infinity,
      ease: "easeInOut",
      delay
    }
  }
});

export function Footer() {
  const firestore = useFirestore();
  const settingsRef = useMemo(() => (firestore ? doc(firestore, 'settings', 'footer') : null), [firestore]);
  const { data: footerData, loading } = useDoc<any>(settingsRef as any);

  const socialIcons: Record<string, any> = {
    instagram: { icon: Instagram, color: 'text-fuchsia-600', aura: 'rgba(217, 70, 239, 0.5)', hoverBg: 'bg-fuchsia-50' },
    facebook: { icon: Facebook, color: 'text-cyan-600', aura: 'rgba(6, 182, 212, 0.5)', hoverBg: 'bg-cyan-50' },
    whatsapp: { icon: MessageCircle, color: 'text-emerald-600', aura: 'rgba(16, 185, 129, 0.5)', hoverBg: 'bg-emerald-50' },
  };

  const activeSocials = useMemo(() => {
    const social = footerData?.social || {};
    return Object.entries(social)
      .filter(([_, url]) => url && typeof url === 'string' && url.trim().length > 0)
      .map(([platform, url]) => ({
        platform,
        url: url as string,
        config: socialIcons[platform.toLowerCase()] || { icon: Globe, color: 'text-stone-600', aura: 'rgba(0,0,0,0.1)', hoverBg: 'bg-stone-50' }
      }));
  }, [footerData]);

  const isValidEmbedUrl = (url?: string) => {
    if (!url) return false;
    return url.includes('google.com/maps/embed') || url.includes('https://');
  };

  if (loading) return null;

  const {
    brand = {},
    address = {},
    contact = {},
    legal = {},
    bank = {},
    maps = {},
    visibility = {},
  } = footerData || {};

  return (
    <footer id="footer" className="relative text-stone-900 pt-32 overflow-hidden border-t border-stone-200">
      <PremiumBackground />
      <FloatingParticles />

      <div className="container max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-10 mb-24">
          
          <motion.div 
            variants={panelVariants(0)}
            animate="animate"
            className="group space-y-8 bg-white/45 backdrop-blur-xl p-10 rounded-[2.5rem] border border-white/60 shadow-xl transition-all duration-700 hover:shadow-2xl"
          >
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
                    whileHover={{ scale: 1.15, y: -4 }}
                    whileTap={{ scale: 0.95 }}
                    className="h-12 w-12 rounded-2xl bg-white/80 border border-stone-100 flex items-center justify-center transition-all duration-500 shadow-sm relative group/soc overflow-hidden"
                  >
                    <div className={cn("absolute inset-0 opacity-0 group-hover/soc:opacity-100 transition-opacity duration-500", config.hoverBg)} />
                    <config.icon className={cn("h-5 w-5 transition-all duration-500 relative z-10 text-stone-500", config.color)} />
                  </motion.a>
                ))}
              </div>
            </div>
          </motion.div>

          <motion.div variants={panelVariants(1.2)} animate="animate" className="grid grid-cols-2 gap-8 py-6">
            <div className="space-y-10">
              <h4 className="text-[11px] font-black uppercase tracking-[0.4em] text-fuchsia-700">Discovery</h4>
              <ul className="space-y-5">
                {[
                  { text: 'Our Story', url: '/#story' },
                  { text: 'Collections', url: '/shop' },
                  { text: 'Artisan Journey', url: '/shop/my-orders' },
                  { text: 'Our Facilities', url: '/inside-roseberry' },
                ].map((link) => (
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
                {[
                  { text: 'Privacy Policy', url: '#' },
                  { text: 'Terms of Service', url: '#' },
                  { text: 'Shipping Policy', url: '#' },
                  { text: 'Return Policy', url: '#' },
                ].map((link) => (
                  <li key={link.text}>
                    <Link href={link.url} className="text-stone-900 text-[15px] hover:text-fuchsia-600 transition-all duration-300 font-bold tracking-wide">
                      {link.text}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="col-span-2 pt-8">
              {visibility.showMap && (
                <div className="space-y-6">
                  <h4 className="text-[11px] font-black uppercase tracking-[0.4em] text-cyan-700 flex items-center gap-3">
                    <Globe className="h-3.5 w-3.5" /> Location Matrix
                  </h4>
                  <div className="relative group overflow-hidden rounded-[2.5rem] border-2 border-white/60 shadow-2xl bg-white/40 backdrop-blur-md transition-all duration-500">
                    {isValidEmbedUrl(maps.embedUrl) ? (
                      <div className="flex flex-col">
                        <div className="h-[220px] w-full border-b border-white/20">
                          <iframe src={maps.embedUrl} width="100%" height="100%" style={{ border: 0 }} allowFullScreen loading="lazy" className="grayscale-[20%] hover:grayscale-0 transition-all duration-700" />
                        </div>
                        <div className="p-6 space-y-4 bg-white/60">
                           <div className="flex items-start gap-3">
                              <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0"><MapPin className="h-4 w-4" /></div>
                              <div className="space-y-0.5">
                                 <p className="text-[9px] font-black uppercase tracking-widest text-primary">Artisan Studio Location</p>
                                 <p className="text-xs text-stone-900 font-bold leading-tight tracking-tight">
                                   {address.line1 || "Aashiyana Bhaban, 1A, Roypara-Hatiara Rd"}, {address.city || "Newtown, Kolkata"}
                                 </p>
                              </div>
                           </div>
                           {maps.mapUrl && (
                             <Button asChild className="w-full h-10 rounded-xl bg-stone-900 text-white hover:bg-stone-800 font-bold uppercase text-[9px] tracking-widest">
                              <a href={maps.mapUrl} target="_blank" rel="noopener noreferrer">View on Google Maps <ArrowRight className="ml-2 h-3 w-3" /></a>
                           </Button>
                           )}
                        </div>
                      </div>
                    ) : (
                      <div className="p-10 text-center space-y-4">
                        <MapPin className="h-8 w-8 mx-auto text-stone-200" />
                        <p className="text-[10px] font-black uppercase tracking-0.2em text-stone-400">Location map unavailable</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          <motion.div variants={panelVariants(0.8)} animate="animate" className="space-y-10 bg-white/40 backdrop-blur-md border border-white/60 p-10 rounded-[2.5rem] shadow-sm">
            <div className="space-y-6">
              <h4 className="text-[11px] font-black uppercase tracking-[0.4em] text-emerald-700 flex items-center gap-3"><MapPin className="h-3.5 w-3.5" /> Headquarters</h4>
              <div className="space-y-3">
                  <p className="text-[16px] text-stone-900 font-black leading-tight">{address.businessName || "Roseberry Chocolate LLP"}</p>
                  <p className="text-[15px] text-stone-900 font-bold leading-relaxed tracking-wide">
                    {address.line1 || "Aashiyana Bhaban, 1A, Roypara-Hatiara Rd"}<br />
                    {address.city || "Newtown, Kolkata"}, {address.state || "West Bengal"} {address.zip || "700157"}
                  </p>
              </div>
            </div>

            {(legal.gstin || legal.fssaiNumber) && (
              <div className="space-y-6 pt-6 border-t border-stone-200/50">
                <h4 className="text-[11px] font-black uppercase tracking-[0.4em] text-stone-500">Business & Legal</h4>
                <div className="space-y-4">
                    {legal.fssaiNumber && (
                      <div className="flex items-center gap-3">
                         <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
                         <div className="flex flex-col">
                            <span className="text-[8px] font-black uppercase tracking-widest text-stone-400">FSSAI License No.</span>
                            <span className="text-[14px] text-stone-900 font-bold">{legal.fssaiNumber}</span>
                         </div>
                      </div>
                    )}
                    {legal.gstin && (
                      <div className="flex items-center gap-3">
                         <CheckCircle className="h-4 w-4 text-primary shrink-0" />
                         <div className="flex flex-col">
                            <span className="text-[8px] font-black uppercase tracking-widest text-stone-400">GSTIN</span>
                            <span className="text-[14px] text-stone-900 font-bold uppercase">{legal.gstin}</span>
                         </div>
                      </div>
                    )}
                </div>
              </div>
            )}

            <div className="space-y-6">
              <h4 className="text-[11px] font-black uppercase tracking-[0.4em] text-emerald-700 flex items-center gap-3"><Phone className="h-3.5 w-3.5" /> Communication</h4>
              <div className="space-y-4">
                {contact.phone && (
                  <a href={`tel:${contact.phone}`} className="flex items-center gap-4 group/contact">
                    <div className="h-9 w-9 rounded-xl bg-white border border-stone-200 flex items-center justify-center text-stone-600 transition-all shadow-sm"><Phone className="h-4 w-4" /></div>
                    <div className="flex flex-col">
                      <span className="text-[8px] font-black uppercase tracking-widest text-stone-400">PRIMARY HOTLINE</span>
                      <span className="text-[14px] text-stone-900 font-bold tracking-wide">{contact.phone}</span>
                    </div>
                  </a>
                )}
                {contact.whatsapp && (
                  <a href={`https://wa.me/${contact.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 group/contact">
                    <div className="h-9 w-9 rounded-xl bg-white border border-stone-200 flex items-center justify-center text-stone-600 transition-all shadow-sm"><MessageCircle className="h-4 w-4" /></div>
                    <div className="flex flex-col">
                      <span className="text-[8px] font-black uppercase tracking-widest text-stone-400">WHATSAPP BUSINESS</span>
                      <span className="text-[14px] text-stone-900 font-bold tracking-wide">{contact.whatsapp}</span>
                    </div>
                  </a>
                )}
                {contact.email && (
                  <a href={`mailto:${contact.email}`} className="flex items-center gap-4 group/contact">
                    <div className="h-9 w-9 rounded-xl bg-white border border-stone-200 flex items-center justify-center text-stone-600 transition-all shadow-sm"><Mail className="h-4 w-4" /></div>
                    <div className="flex flex-col">
                      <span className="text-[8px] font-black uppercase tracking-widest text-stone-400">OFFICIAL EMAIL</span>
                      <span className="text-[14px] text-stone-900 font-bold tracking-wide break-all leading-tight">{contact.email}</span>
                    </div>
                  </a>
                )}
                {contact.supportEmail && (
                  <a href={`mailto:${contact.supportEmail}`} className="flex items-center gap-4 group/contact">
                    <div className="h-9 w-9 rounded-xl bg-white border border-stone-200 flex items-center justify-center text-stone-600 transition-all shadow-sm"><Mail className="h-4 w-4" /></div>
                    <div className="flex flex-col">
                      <span className="text-[8px] font-black uppercase tracking-widest text-stone-400">CUSTOMER CARE EMAIL</span>
                      <span className="text-[14px] text-stone-900 font-bold tracking-wide break-all leading-tight">{contact.supportEmail}</span>
                    </div>
                  </a>
                )}
              </div>
            </div>
          </motion.div>

          <motion.div variants={panelVariants(2.2)} animate="animate" className="space-y-12">
            {visibility.showBankDetails && (
              <div className="space-y-8">
                <h4 className="text-[11px] font-black uppercase tracking-[0.4em] text-cyan-700 flex items-center gap-3"><CreditCard className="h-3.5 w-3.5" /> Financial Facilitation</h4>
                <div className="space-y-6">
                  <div className="space-y-4 bg-white/50 backdrop-blur-md p-6 rounded-[2.5rem] border border-white/60 shadow-xl">
                    {bank.accountName && (
                      <div className="flex flex-col">
                          <span className="text-[8px] font-black uppercase tracking-widest text-stone-400">Account Holder</span>
                          <span className="text-[14px] text-stone-900 font-bold">{bank.accountName}</span>
                      </div>
                    )}
                    {bank.bankName && (
                      <div className="flex flex-col">
                          <span className="text-[8px] font-black uppercase tracking-widest text-stone-400">Bank</span>
                          <span className="text-[14px] text-stone-900 font-bold">{bank.bankName}</span>
                      </div>
                    )}
                    {bank.branch && (
                      <div className="flex flex-col">
                          <span className="text-[8px] font-black uppercase tracking-widest text-stone-400">Branch</span>
                          <span className="text-[14px] text-stone-900 font-bold">{bank.branch}</span>
                      </div>
                    )}
                    {bank.accountNumber && (
                      <div className="flex flex-col">
                          <span className="text-[8px] font-black uppercase tracking-widest text-stone-400">Account Number</span>
                          <span className="text-[14px] text-stone-900 font-bold font-mono tracking-tight">{bank.accountNumber}</span>
                      </div>
                    )}
                    {bank.ifsc && (
                      <div className="flex flex-col">
                          <span className="text-[8px] font-black uppercase tracking-widest text-stone-400">IFSC Code</span>
                          <span className="text-[14px] text-stone-900 font-bold uppercase">{bank.ifsc}</span>
                      </div>
                    )}
                    {bank.upiId && (
                      <div className="flex flex-col pt-2 border-t border-stone-200/50">
                          <span className="text-[8px] font-black uppercase tracking-widest text-stone-400">UPI ID</span>
                          <span className="text-[14px] text-primary font-bold">{bank.upiId}</span>
                      </div>
                    )}
                  </div>
                  {bank.qrCodeUrl && (
                    <div className="bg-white p-8 rounded-[2.5rem] border-2 border-stone-100 shadow-2xl space-y-4">
                      <div className="flex items-center gap-2"><QrCode className="h-4 w-4 text-primary" /><span className="text-[10px] font-black uppercase tracking-widest">Scan to Pay</span></div>
                      <div className="aspect-square relative w-full bg-white rounded-2xl overflow-hidden border border-stone-50 shadow-inner"><Image src={bank.qrCodeUrl} alt="Payment QR" fill className="object-contain p-4" /></div>
                    </div>
                  )}
                </div>
              </div>
            )}
            <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }} className="p-6 bg-rose-500/5 rounded-2xl border border-rose-500/10 flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-600 shadow-inner"><Heart className="h-5 w-5 fill-current" /></div>
                <div className="space-y-0.5">
                    <p className="text-[10px] font-black uppercase tracking-widest text-rose-700 leading-none">Artisan Commitment</p>
                    <p className="text-[12px] font-bold text-rose-900/60 leading-tight">Handmade with Love</p>
                </div>
            </motion.div>

            <div className="pt-6 border-t border-stone-200/50">
                <Badge className="bg-stone-900/5 text-stone-500 border-none px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">
                  Artisan v1.2
                </Badge>
            </div>
          </motion.div>
        </div>

        <Separator className="bg-stone-200/50 mb-12" />

        <div className="flex flex-col md:flex-row justify-between items-center gap-10 text-center md:text-left pb-16">
          <p className="text-stone-600 text-[12px] font-black uppercase tracking-[0.3em]">
            © {new Date().getFullYear()} {address.businessName || "Roseberry Chocolate"}. Crafted with patience in Kolkata.
          </p>
        </div>
      </div>
    </footer>
  );
}
