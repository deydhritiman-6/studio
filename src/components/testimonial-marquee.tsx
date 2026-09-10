
'use client';

import React, { useMemo, useEffect, useRef, useState } from 'react';
import { MapPin, Quote, Globe, Search, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Testimonial } from '@/lib/types';
import Image from 'next/image';

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
  { id: 's8', name: 'Kavya Iyer', location: 'Chennai, TN', text: 'Highly recommend for gifting! The attention to detail in every bite is evident.', lang: 'en', rating: 4, source: 'Website' },
  { id: 's9', name: 'Arindam Ghosh', location: 'Behala, Kolkata', text: 'কলকাতার বুকে এমন সত্যিকারের আর্টজান চকোলেট স্টুডিও আর একটাও নেই। জাস্ট অসাধারণ।', lang: 'bn', rating: 5, source: 'Google' },
  { id: 's10', name: 'Sneha Kapoor', location: 'Delhi, NCR', text: 'Loved the Indian flavours infusion. The cardamom dark chocolate was a revelation.', lang: 'en', rating: 4, source: 'Google' },
  { id: 's11', name: 'Lucas Martin', location: 'Paris, France', text: 'Exquisite balance of bitterness and sweetness. Very impressive work.', lang: 'en', rating: 5, source: 'Website' },
  { id: 's12', name: 'Ishita Paul', location: 'Garia, Kolkata', text: 'জন্মদিনের উপহার হিসেবে দারুণ। প্যাকেজিং একদম রাজকীয়।', lang: 'bn', rating: 4, source: 'Website' },
  { id: 's13', name: 'Rahul Singh', location: 'Lucknow, UP', text: 'स्वाद और शुद्धता का बेजोड़ संगम। रोज़बेरी के चॉकलेटे वाकई लाजवाब हैं।', lang: 'hi', rating: 5, source: 'Google' },
  { id: 's14', name: 'Emma Brown', location: 'New York, USA', text: 'The raspberry ganache is world-class. Can wait to try the other collections.', lang: 'en', rating: 5, source: 'Google' },
  { id: 's15', name: 'Ritwick Bose', location: 'Shyambazar, Kolkata', text: 'প্রথাগত চকোলেটের বাইরে একদম নতুন স্বাদ। প্রেজেন্টেশন অনবদ্য।', lang: 'bn', rating: 4, source: 'Google' },
  { id: 's16', name: 'Neha Patel', location: 'Ahmedabad, GJ', text: 'Superb quality. The chocolates melt in your mouth leaving a rich aftertaste.', lang: 'en', rating: 4, source: 'Website' },
  { id: 's17', name: 'Daniel Wilson', location: 'Toronto, Canada', text: 'A taste of home! Beautifully crafted and ethically sourced.', lang: 'en', rating: 5, source: 'Website' },
  { id: 's18', name: 'Tiyasha Das', location: 'Lake Town, Kolkata', text: 'চকলেটের প্রতিটি পিস যেন একটা শিল্প। গুণগত মান নিয়ে কোনো কথা হবে না।', lang: 'bn', rating: 5, source: 'Google' },
  { id: 's19', name: 'Aditya Verma', location: 'Pune, MH', text: 'Perfect for corporate gifting. Elegant, premium, and delicious.', lang: 'en', rating: 4, source: 'Google' },
  { id: 's20', name: 'Sophia Lee', location: 'Singapore', text: 'Exceptional texture. The crunch and the smooth centers are perfectly handled.', lang: 'en', rating: 5, source: 'Google' },
  { id: 's21', name: 'Subhojit Das', location: 'Howrah, WB', text: 'বাড়ির লোকজনের খুব পছন্দ হয়েছে। দারুণ উপহার আইটেম।', lang: 'bn', rating: 4, source: 'Website' },
  { id: 's22', name: 'Kavita Reddy', location: 'Hyderabad, TS', text: 'The dark chocolate range is amazing. Truly authentic and artisanal.', lang: 'en', rating: 4, source: 'Google' },
  { id: 's23', name: 'Noah Williams', location: 'Melbourne, Australia', text: 'Impressive delivery speed to international locations. Pristine condition.', lang: 'en', rating: 5, source: 'Website' },
  { id: 's24', name: 'Moumita Roy', location: 'Baguiati, Kolkata', text: 'ভীষণ সুন্দর ব্যবহার এবং চকোলেটের মানও অসাধারণ। আমাদের প্রিয় স্টোর এখন।', lang: 'bn', rating: 5, source: 'Google' },
];

const CocoaBeanIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M12 2C12 2 7 7 7 12C7 17 12 22 12 22C12 22 17 17 17 12C17 7 12 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M9 10C10 10.5 11 11 12 11C13 11 14 10.5 15 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.5"/>
    <path d="M9 14C10 13.5 11 13 12 13C13 13 14 13.5 15 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.5"/>
  </svg>
);

const ArtisanStar = ({ active, index }: { active: boolean; index: number }) => {
  const delays = [0.2, 1.7, 3.1, 0.8, 2.4];
  return (
    <div className="relative">
      <svg
        viewBox="0 0 24 24"
        className={cn(
          "h-4 w-4 transition-all duration-300",
          active ? "drop-shadow-[0_0_2px_rgba(212,175,55,0.4)] scale-110" : "opacity-20 grayscale"
        )}
      >
        <defs>
          <linearGradient id={`gold-grad-${index}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FDE68A" />
            <stop offset="50%" stopColor="#D4AF37" />
            <stop offset="100%" stopColor="#B45309" />
          </linearGradient>
        </defs>
        <path
          d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
          fill={active ? `url(#gold-grad-${index})` : "currentColor"}
          stroke={active ? "#92400E" : "currentColor"}
          strokeWidth="0.5"
        />
        {active && (
          <path
            d="M12 4l1.5 3.5 3.5 0.5-2.5 2.5 0.5 3.5L12 12.5"
            fill="white"
            fillOpacity="0.3"
          />
        )}
      </svg>
      {active && (
        <div 
          className="absolute inset-0 flex items-center justify-center animate-star-shimmer pointer-events-none"
          style={{ animationDelay: `${delays[index]}s` }}
        >
          <div className="h-full w-full bg-white opacity-20 blur-[2px] rounded-full" />
        </div>
      )}
    </div>
  );
};

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

function TestimonialCard({ testimonial, datasetId }: { testimonial: TestimonialDisplay, datasetId: string }) {
  const initials = testimonial.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase();

  const variant = getCardVariant(testimonial.id);

  return (
    <article 
      data-id={datasetId}
      className={cn(
        "testimonial-card",
        "p-10 rounded-[2.5rem] border-2 bg-gradient-to-br backdrop-blur-xl",
        "shadow-[0_20px_50px_-20px_rgba(0,0,0,0.1)] transition-all duration-500 ease-out",
        "hover:-translate-y-2 hover:shadow-[0_30px_60px_-20px_rgba(0,0,0,0.2)] group/card",
        variant.bg,
        variant.border
      )}
      style={{ width: '330px', flexShrink: 0 }}
    >
      <Quote className="absolute -top-6 -left-4 h-32 w-32 text-stone-900/[0.02] -z-10 transition-transform group-hover/card:scale-110" />
      
      <div className="flex flex-col h-full justify-between gap-6 relative z-10">
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={cn(
                "h-14 w-14 rounded-full relative flex items-center justify-center text-white font-black text-base shadow-xl border-4 border-white overflow-hidden",
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
          <div className="flex gap-1">
            {[...Array(5)].map((_, i) => (
              <ArtisanStar key={i} active={i < testimonial.rating} index={i} />
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

export function TestimonialMarquee({ liveTestimonials = [] }: { liveTestimonials?: Testimonial[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

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

  useEffect(() => {
    setMounted(true);
    if (typeof window === 'undefined') return;

    const track = trackRef.current;
    if (!track) return;

    let x = 0;
    const baseSpeed = 1.1; // Restored original pacing
    let pauseEndTime = 0;
    let lastSnappedCardId = '';

    const animate = () => {
      if (!track) return;
      const groupWidth = track.firstElementChild?.scrollWidth || 0;
      const viewportCenter = window.innerWidth / 2;

      // Handle infinite loop reset
      if (x <= -groupWidth) {
        x += groupWidth;
        lastSnappedCardId = ''; 
      }

      const now = performance.now();

      if (now >= pauseEndTime) {
        // Normal movement
        x -= baseSpeed;
        
        // Detection for snap point
        const cards = Array.from(track.querySelectorAll('.testimonial-card')) as HTMLElement[];
        let closestCard: HTMLElement | null = null;
        let minDistance = Infinity;

        cards.forEach((card) => {
          const rect = card.getBoundingClientRect();
          const cardCenter = rect.left + rect.width / 2;
          const distance = Math.abs(cardCenter - viewportCenter);
          if (distance < minDistance) {
            minDistance = distance;
            closestCard = card;
          }
        });

        if (closestCard) {
          const cardId = closestCard.dataset.id || '';
          
          // Trigger snap/pause if we are precisely within reach of center and it's a new card
          if (minDistance < baseSpeed && cardId !== lastSnappedCardId) {
            // SNAP: Calculate exactly how much to shift x to center the card perfectly
            const rect = closestCard.getBoundingClientRect();
            const cardCenter = rect.left + rect.width / 2;
            const snapShift = viewportCenter - cardCenter;
            
            x += snapShift;
            pauseEndTime = now + 600; // 600ms hold
            lastSnappedCardId = cardId;
          }
        }
      }

      track.style.transform = `translate3d(${x}px, 0, 0)`;
      requestAnimationFrame(animate);
    };

    const rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, [combinedData]);

  if (!mounted) return null;

  return (
    <div className="testimonial-viewport">
      <div 
        ref={trackRef} 
        className="testimonial-track" 
        style={{ display: 'flex', width: 'max-content' }}
      >
        <div className="testimonial-group" style={{ display: 'flex', gap: '24px', paddingRight: '24px' }}>
          {combinedData.map((t) => (
            <TestimonialCard key={t.id} datasetId={t.id} testimonial={t} />
          ))}
        </div>
        <div className="testimonial-group" aria-hidden="true" style={{ display: 'flex', gap: '24px', paddingRight: '24px' }}>
          {combinedData.map((t) => (
            <TestimonialCard key={`dup-${t.id}`} datasetId={`dup-${t.id}`} testimonial={t} />
          ))}
        </div>
      </div>
    </div>
  );
}
