'use client';

import React, { useMemo, useEffect, useState } from 'react';
import { MapPin, Star, Quote } from 'lucide-react';
import { cn } from '@/lib/utils';

type Testimonial = {
  id: number;
  name: string;
  location: string;
  text: string;
  lang: 'bn' | 'hi' | 'en';
  rating: number;
  group: 'kolkata' | 'india' | 'international';
};

const TESTIMONIAL_DATA: Omit<Testimonial, 'id'>[] = [
  // --- Group 1: Kolkata (12 items) ---
  { name: 'Ananya Chatterjee', location: 'Salt Lake, Kolkata', text: 'অপূর্ব স্বাদ! কলকাতার সেরা হ্যান্ডমেড চকলেট। ডার্ক চকোলেট ট্রাফলটা আমার ফেভারিট।', lang: 'bn', rating: 5, group: 'kolkata' },
  { name: 'Sayan Banerjee', location: 'Ballygunge, Kolkata', text: 'The sea salt caramel is pure bliss. Packaging is incredibly premium and artisanal.', lang: 'en', rating: 4, group: 'kolkata' },
  { name: 'Riya Mukherjee', location: 'New Town, Kolkata', text: 'আমি আমার মা-কে উপহার দিয়েছিলাম, উনি খুব খুশি হয়েছেন। গুণগত মান অনবদ্য।', lang: 'bn', rating: 5, group: 'kolkata' },
  { name: 'Arindam Ghosh', location: 'Alipore, Kolkata', text: 'Authentic single-origin flavors. Perfect for corporate gifting and special events.', lang: 'en', rating: 4, group: 'kolkata' },
  { name: 'Soham Dutta', location: 'Jadavpur, Kolkata', text: 'এদের চকোলেটের টেক্সচার খুব স্মুথ। একদম আন্তর্জাতিক মানের স্বাদ আর প্রেজেন্টেশন।', lang: 'bn', rating: 5, group: 'kolkata' },
  { name: 'Moumita Roy', location: 'Tollygunge, Kolkata', text: 'Beautiful presentation. Loved the customized box for my anniversary. Very elegant.', lang: 'en', rating: 4, group: 'kolkata' },
  { name: 'Debanjan Sen', location: 'Behala, Kolkata', text: 'খুব সুন্দর প্রেজেন্টেশন। কলকাতার বুকে এরকম রুচিশীল উদ্যোগ সত্যিই বিরল। দারুণ লেগেছে।', lang: 'bn', rating: 4, group: 'kolkata' },
  { name: 'Tiyasha Das', location: 'Dum Dum, Kolkata', text: 'The hazelnut praline is so addictive. High-quality ingredients and great snap.', lang: 'en', rating: 5, group: 'kolkata' },
  { name: 'Subhojit Das', location: 'Esplanade, Kolkata', text: 'স্বাদ আর গন্ধে আভিজাত্যের ছোঁয়া। উৎসবের মরশুমে সেরা উপহার আমাদের জন্য।', lang: 'bn', rating: 4, group: 'kolkata' },
  { name: 'Ritwick Bose', location: 'Park Street, Kolkata', text: 'Best dark chocolates I\'ve had in India. Very sophisticated flavor profile.', lang: 'en', rating: 5, group: 'kolkata' },
  { name: 'Sreya Saha', location: 'Lake Town, Kolkata', text: 'প্যাকেজিং টা জাস্ট অসাধারণ! চকোলেটের স্বাদ অনেকক্ষণ মুখে লেগে থাকার মতো।', lang: 'bn', rating: 4, group: 'kolkata' },
  { name: 'Ishita Paul', location: 'Shyambazar, Kolkata', text: 'Fast delivery and excellent customer support. The truffles are a work of art.', lang: 'en', rating: 5, group: 'kolkata' },

  // --- Group 2: India (7 items) ---
  { name: 'Rohan Mehta', location: 'Delhi, NCR', text: 'इनके चॉकलेट्स का स्वाद वाकई लाजवाब है। दिल्ली में ऐसी क्वालिटी मिलना मुश्किल है। बहुत बढ़िया!', lang: 'hi', rating: 4, group: 'india' },
  { name: 'Priya Nair', location: 'Bengaluru, KA', text: 'Love the commitment to zero preservatives. Fresh, rich, and truly artisanal. Five stars!', lang: 'en', rating: 5, group: 'india' },
  { name: 'Aarav Sharma', location: 'Mumbai, MH', text: 'पैकेजिंग और प्रेजेंटेशन बहुत ही प्रीमियम है। गिफ्ट देने के लिए इससे बेहतर कुछ नहीं।', lang: 'hi', rating: 4, group: 'india' },
  { name: 'Kavya Iyer', location: 'Chennai, TN', text: 'Exquisite truffles! The raspberry ganache is a masterpiece of artisan chocolate.', lang: 'en', rating: 4, group: 'india' },
  { name: 'Aditya Verma', location: 'Hyderabad, TS', text: 'शुद्ध और हाथ से बने चॉकलेट्स की बात ही अलग है। बहुत ही शानदार और शाही अनुभव।', lang: 'hi', rating: 5, group: 'india' },
  { name: 'Sneha Kapoor', location: 'Pune, MH', text: 'Perfect balance of bitterness and sweetness in the 85% Cacao. Elegant and refined.', lang: 'en', rating: 4, group: 'india' },
  { name: 'Rahul Singh', location: 'Lucknow, UP', text: 'कोलकाता की यह मिठास अब मेरे घर तक। स्वाद और क्वालिटी में नंबर वन। बहुत ही उम्दा!', lang: 'hi', rating: 4, group: 'india' },

  // --- Group 3: International (5 items) ---
  { name: 'Olivia Smith', location: 'London, UK', text: 'Rivals the best Belgian brands. Truly artisanal craftsmanship. A sophisticated treat.', lang: 'en', rating: 5, group: 'international' },
  { name: 'Daniel Wilson', location: 'New York, USA', text: 'Exceptional quality. You can taste the passion in every bite. Truly world-class.', lang: 'en', rating: 4, group: 'international' },
  { name: 'Emma Brown', location: 'Toronto, CA', text: 'Sophisticated and luxurious. My go-to choice for premium gifting. Simply divine.', lang: 'en', rating: 5, group: 'international' },
  { name: 'Lucas Martin', location: 'Paris, FR', text: 'Impressive texture and tempering. A delight for true chocolate lovers in every sense.', lang: 'en', rating: 4, group: 'international' },
  { name: 'Sophia Lee', location: 'Singapore', text: 'World-class chocolate from Kolkata. The delivery was surprisingly efficient and fresh.', lang: 'en', rating: 4, group: 'international' },
];

const CocoaBeanIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M12 2C12 2 7 7 7 12C7 17 12 22 12 22C12 22 17 17 17 12C17 7 12 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M9 10C10 10.5 11 11 12 11C13 11 14 10.5 15 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.5"/>
    <path d="M9 14C10 13.5 11 13 12 13C13 13 14 13.5 15 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.5"/>
  </svg>
);

const getCardStyle = (id: number) => {
  const styles = [
    { accent: 'text-[#3D1E16]', bg: 'from-white/95 to-[#fff8f2]/90', initials: 'bg-[#3D1E16]', border: 'border-[#3D1E16]/10' },
    { accent: 'text-[#800020]', bg: 'from-white/95 to-[#fdf2f2]/90', initials: 'bg-[#800020]', border: 'border-[#800020]/10' },
    { accent: 'text-[#D4AF37]', bg: 'from-white/95 to-[#fffcf0]/90', initials: 'bg-[#D4AF37]', border: 'border-[#D4AF37]/10' },
    { accent: 'text-[#7b3f00]', bg: 'from-white/95 to-[#f8f4f0]/90', initials: 'bg-[#7b3f00]', border: 'border-[#7b3f00]/10' },
  ];
  return styles[id % styles.length];
};

export function TestimonialMarquee() {
  const [shuffledItems, setShuffledItems] = useState<Testimonial[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Controlled shuffle for balanced mix
    const base = [...TESTIMONIAL_DATA].map((t, i) => ({ ...t, id: i }));
    for (let i = base.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [base[i], base[j]] = [base[j], base[i]];
    }
    setShuffledItems(base);
  }, []);

  if (!mounted || shuffledItems.length === 0) return null;

  return (
    <div className="testimonial-marquee-container group">
      <div className="testimonial-marquee-track">
        {/* Testimonial Group 1 */}
        <div className="flex flex-nowrap">
          {shuffledItems.map((t) => (
            <div key={t.id} className="testimonial-card-wrapper">
              <TestimonialCard testimonial={t} />
            </div>
          ))}
        </div>
        {/* Duplicate Testimonial Group for Seamless Loop */}
        <div className="flex flex-nowrap" aria-hidden="true">
          {shuffledItems.map((t) => (
            <div key={`dup-${t.id}`} className="testimonial-card-wrapper">
              <TestimonialCard testimonial={t} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  const initials = testimonial.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase();

  const style = getCardStyle(testimonial.id);

  return (
    <div className={cn(
      "h-[240px] w-[300px] md:w-[350px] relative overflow-hidden",
      "p-6 md:p-8 rounded-[2rem] border bg-gradient-to-br backdrop-blur-md",
      "shadow-[0_10px_40px_-15px_rgba(0,0,0,0.1)] transition-all duration-400 ease-out",
      "hover:-translate-y-2 hover:shadow-2xl group/card",
      style.bg,
      style.border
    )}>
      {/* Decorative Elements */}
      <Quote className="absolute -top-2 -left-2 h-20 w-24 text-stone-900/[0.04] -z-10" />
      
      <div className="flex flex-col h-full justify-between gap-4 relative z-10">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className={cn(
              "h-12 w-12 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md transition-transform group-hover/card:scale-110",
              style.initials
            )}>
              {initials}
            </div>
            <div className="space-y-0.5">
              <h4 className="font-bold text-stone-900 text-sm md:text-base leading-tight">
                {testimonial.name}
              </h4>
              <div className="flex items-center gap-1.5 text-stone-400">
                <MapPin className={cn("h-3 w-3", style.accent)} />
                <span className="text-[10px] md:text-xs font-bold tracking-tight uppercase">
                  {testimonial.location}
                </span>
              </div>
            </div>
          </div>

          <p className={cn(
            "text-stone-600 leading-relaxed italic line-clamp-3 text-sm font-light",
            testimonial.lang === 'bn' ? "font-medium" : ""
          )}>
            "{testimonial.text}"
          </p>
        </div>

        <div className="flex items-center justify-between border-t border-stone-100 pt-4">
          <div className="flex gap-0.5">
            {[...Array(5)].map((_, i) => (
              <Star 
                key={i} 
                className={cn(
                  "h-3 w-3 transition-colors", 
                  i < testimonial.rating 
                    ? "fill-amber-500 text-amber-500" 
                    : "text-stone-200 fill-none"
                )} 
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
             <CocoaBeanIcon className={cn("h-4 w-4 opacity-20 group-hover/card:opacity-40 transition-opacity", style.accent)} />
             <span className="text-[9px] font-black uppercase tracking-widest text-stone-300">Artisan Selection</span>
          </div>
        </div>
      </div>
    </div>
  );
}
