
'use client';

import React, { useMemo, useEffect, useState } from 'react';
import { MapPin, Star, Quote, Globe, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Testimonial } from '@/lib/types';

type TestimonialDisplay = {
  id: string;
  name: string;
  location: string;
  text: string;
  lang: 'bn' | 'hi' | 'en';
  rating: number;
  photoUrl?: string;
  source: 'Google' | 'Website';
};

const SEED_TESTIMONIALS: TestimonialDisplay[] = [
  { id: 's1', name: 'Ananya Chatterjee', location: 'Salt Lake, Kolkata', text: 'অপূর্ব স্বাদ! কলকাতার সেরা হ্যান্ডমেড চকলেট। ডার্ক চকোলেট ট্রাফলটা আমার ফেভারিট।', lang: 'bn', rating: 5, source: 'Google' },
  { id: 's2', name: 'Sayan Banerjee', location: 'Ballygunge, Kolkata', text: 'The sea salt caramel is pure bliss. Packaging is incredibly premium and artisanal.', lang: 'en', rating: 4, source: 'Website' },
  { id: 's3', name: 'Priya Nair', location: 'Bengaluru, KA', text: 'Fresh, rich, and truly artisanal. Love the commitment to zero preservatives.', lang: 'en', rating: 5, source: 'Website' },
  { id: 's4', name: 'Aarav Sharma', location: 'Mumbai, MH', text: 'पैकेजिंग और प्रेजेंटेशन बहुत ही प्रीमियम है। गिफ्ट देने के लिए इससे बेहतर कुछ नहीं।', lang: 'hi', rating: 4, source: 'Google' },
  { id: 's5', name: 'Olivia Smith', location: 'London, UK', text: 'Truly artisanal craftsmanship. A sophisticated treat that rivals top Belgian brands.', lang: 'en', rating: 5, source: 'Google' },
  { id: 's6', name: 'Riya Mukherjee', location: 'New Town, Kolkata', text: 'আমি আমার মা-কে উপহার দিয়েছিলাম, উনি খুব খুশি হয়েছেন। গুণগত মান অনবদ্য।', lang: 'bn', rating: 4, source: 'Google' },
  { id: 's7', name: 'Soham Dutta', location: 'Jadavpur, Kolkata', text: 'এদের চকোলেটের টেক্সচার খুব স্মুথ। একদম আন্তর্জাতিক মানের স্বাদ আর প্রেজেন্টেশন।', lang: 'bn', rating: 5, source: 'Google' },
];

const CocoaBeanIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M12 2C12 2 7 7 7 12C7 17 12 22 12 22C12 22 17 17 17 12C17 7 12 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M9 10C10 10.5 11 11 12 11C13 11 14 10.5 15 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.5"/>
    <path d="M9 14C10 13.5 11 13 12 13C13 13 14 13.5 15 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.5"/>
  </svg>
);

const getCardVariant = (id: string) => {
  const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const variants = [
    { accent: 'text-[#3D1E16]', bg: 'from-white/95 via-[#fff8f2]/95 to-[#fff4ec]/95', initials: 'bg-gradient-to-br from-[#3D1E16] to-[#5a2e1d]', border: 'border-[#3D1E16]/10' },
    { accent: 'text-[#800020]', bg: 'from-white/95 via-[#fdf2f2]/95 to-[#fff0f0]/95', initials: 'bg-gradient-to-br from-[#800020] to-[#a52a2a]', border: 'border-[#800020]/10' },
    { accent: 'text-[#D4AF37]', bg: 'from-white/95 via-[#fffcf0]/95 to-[#fff9e0]/95', initials: 'bg-gradient-to-br from-[#D4AF37] to-[#b8860b]', border: 'border-[#D4AF37]/10' },
    { accent: 'text-[#7b3f00]', bg: 'from-white/95 via-[#f8f4f0]/95 to-[#f5eee6]/95', initials: 'bg-gradient-to-br from-[#7b3f00] to-[#8b4513]', border: 'border-[#7b3f00]/10' },
  ];
  return variants[hash % variants.length];
};

export function TestimonialMarquee({ liveTestimonials = [] }: { liveTestimonials?: Testimonial[] }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const combinedData = useMemo(() => {
    const liveMapped: TestimonialDisplay[] = liveTestimonials.map(t => ({
        id: t.id,
        name: t.name,
        location: `${t.city}, ${t.country}`,
        text: t.testimonial,
        lang: t.language as any,
        rating: t.rating,
        photoUrl: t.photoUrl,
        source: 'Website'
    }));

    const base = [...SEED_TESTIMONIALS, ...liveMapped];
    return base.sort((a, b) => a.id.localeCompare(b.id));
  }, [liveTestimonials]);

  if (!mounted) return null;

  return (
    <div className="testimonial-viewport">
      <div className="testimonial-track">
        <div className="testimonial-group">
          {combinedData.map((t) => (
            <TestimonialCard key={t.id} testimonial={t} />
          ))}
        </div>
        <div className="testimonial-group" aria-hidden="true">
          {combinedData.map((t) => (
            <TestimonialCard key={`dup-${t.id}`} testimonial={t} />
          ))}
        </div>
      </div>
    </div>
  );
}

function TestimonialCard({ testimonial }: { testimonial: TestimonialDisplay }) {
  const initials = testimonial.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase();

  const variant = getCardVariant(testimonial.id);

  return (
    <article className={cn(
      "testimonial-card",
      "p-10 rounded-[2.5rem] border-2 bg-gradient-to-br backdrop-blur-xl",
      "shadow-[0_20px_50px_-20px_rgba(0,0,0,0.1)] transition-all duration-500 ease-out",
      "hover:-translate-y-2 hover:shadow-[0_30px_60px_-20px_rgba(0,0,0,0.2)] group/card",
      variant.bg,
      variant.border
    )}>
      <Quote className="absolute -top-6 -left-4 h-32 w-32 text-stone-900/[0.02] -z-10 transition-transform group-hover/card:scale-110" />
      
      <div className="flex flex-col h-full justify-between gap-6 relative z-10">
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={cn(
                "h-14 w-14 rounded-full flex items-center justify-center text-white font-black text-base shadow-xl border-4 border-white overflow-hidden",
                variant.initials
              )}>
                {testimonial.photoUrl ? (
                    <Image src={testimonial.photoUrl} alt="" fill className="object-cover" />
                ) : initials}
              </div>
              <div className="space-y-0.5">
                <h4 className="font-bold text-stone-900 text-base leading-tight tracking-tight">
                  {testimonial.name}
                </h4>
                <div className="flex items-center gap-1.5 text-stone-400">
                  <MapPin className={cn("h-3 w-3", variant.accent)} />
                  <span className="text-[10px] font-black tracking-widest uppercase opacity-70">
                    {testimonial.location}
                  </span>
                </div>
              </div>
            </div>
            <Badge variant="outline" className={cn(
                "h-6 px-3 rounded-full text-[8px] font-black uppercase tracking-widest border-none transition-colors",
                testimonial.source === 'Google' 
                    ? "bg-blue-500/10 text-blue-600 group-hover/card:bg-blue-500/20" 
                    : "bg-amber-500/10 text-amber-600 group-hover/card:bg-amber-500/20"
            )}>
                {testimonial.source === 'Google' ? <Search className="h-2 w-2 mr-1.5" /> : <Globe className="h-2 w-2 mr-1.5" />}
                {testimonial.source} Review
            </Badge>
          </div>

          <div className="relative">
            <p className={cn(
              "text-stone-700 leading-relaxed italic text-sm font-light line-clamp-4 relative z-10",
              testimonial.lang === 'bn' ? "font-medium" : ""
            )}>
              "{testimonial.text}"
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-stone-100/50 pt-5 mt-auto">
          <div className="flex gap-0.5">
            {[...Array(5)].map((_, i) => (
              <Star 
                key={i} 
                className={cn(
                  "h-3.5 w-3.5 transition-colors", 
                  i < testimonial.rating 
                    ? "fill-[#D4AF37] text-[#D4AF37]" 
                    : "text-stone-200 fill-none"
                )} 
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
             <CocoaBeanIcon className={cn("h-4 w-4 opacity-10 group-hover/card:opacity-30 transition-all duration-500", variant.accent)} />
             <span className="text-[9px] font-black uppercase tracking-[0.2em] text-stone-300">Artisan Selection</span>
          </div>
        </div>
      </div>
    </article>
  );
}
