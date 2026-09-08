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
  gender: 'm' | 'f';
};

const TESTIMONIAL_DATA: Omit<Testimonial, 'id'>[] = [
  // --- Group 1: Kolkata (12 items) ---
  { name: 'Ananya Chatterjee', location: 'Salt Lake, Kolkata', text: 'অপূর্ব স্বাদ! কলকাতার সেরা হ্যান্ডমেড চকলেট। ডার্ক চকোলেট ট্রাফলটা আমার ফেভারিট।', lang: 'bn', rating: 5, group: 'kolkata', gender: 'f' },
  { name: 'Sayan Banerjee', location: 'Ballygunge, Kolkata', text: 'The sea salt caramel is pure bliss. Packaging is incredibly premium and artisanal.', lang: 'en', rating: 4, group: 'kolkata', gender: 'm' },
  { name: 'Riya Mukherjee', location: 'New Town, Kolkata', text: 'আমি আমার মা-কে উপহার দিয়েছিলাম, উনি খুব খুশি হয়েছেন। গুণগত মান অনবদ্য।', lang: 'bn', rating: 5, group: 'kolkata', gender: 'f' },
  { name: 'Arindam Ghosh', location: 'Alipore, Kolkata', text: 'Authentic single-origin flavors. Perfect for corporate gifting and special events.', lang: 'en', rating: 4, group: 'kolkata', gender: 'm' },
  { name: 'Soham Dutta', location: 'Jadavpur, Kolkata', text: 'এদের চকোলেটের টেক্সচার খুব স্মুথ। একদম আন্তর্জাতিক মানের স্বাদ আর প্রেজেন্টেশন।', lang: 'bn', rating: 4, group: 'kolkata', gender: 'm' },
  { name: 'Moumita Roy', location: 'Tollygunge, Kolkata', text: 'Beautiful presentation. Loved the customized box for my anniversary. Very elegant.', lang: 'en', rating: 4, group: 'kolkata', gender: 'f' },
  { name: 'Debanjan Sen', location: 'Behala, Kolkata', text: 'খুব সুন্দর প্রেজেন্টেশন। কলকাতার বুকে এরকম রুচিশীল উদ্যোগ সত্যিই বিরল।', lang: 'bn', rating: 5, group: 'kolkata', gender: 'm' },
  { name: 'Tiyasha Das', location: 'Dum Dum, Kolkata', text: 'The hazelnut praline is so addictive. High-quality ingredients and great snap.', lang: 'en', rating: 3, group: 'kolkata', gender: 'f' },
  { name: 'Subhojit Das', location: 'Esplanade, Kolkata', text: 'স্বাদ আর গন্ধে আভিজাত্যের ছোঁয়া। উৎসবের মরশুমে সেরা উপহার আমাদের জন্য।', lang: 'bn', rating: 4, group: 'kolkata', gender: 'm' },
  { name: 'Sreya Saha', location: 'Lake Town, Kolkata', text: 'প্যাকেজিং টা জাস্ট অসাধারণ! চকোলেটের স্বাদ অনেকক্ষণ মুখে লেগে থাকার মতো।', lang: 'bn', rating: 4, group: 'kolkata', gender: 'f' },
  { name: 'Ritwick Bose', location: 'Park Street, Kolkata', text: 'Premium cocoa notes. Reminds me of boutique shops in Europe. Simply exquisite.', lang: 'en', rating: 5, group: 'kolkata', gender: 'm' },
  { name: 'Ishita Paul', location: 'Shyambazar, Kolkata', text: 'Excellent customer service and the delivery was prompt. The truffles are works of art.', lang: 'en', rating: 4, group: 'kolkata', gender: 'f' },

  // --- Group 2: Other Indian Cities (7 items) ---
  { name: 'Rohan Mehta', location: 'Delhi, NCR', text: 'इनके चॉकलेट्स का स्वाद वाकई लाजवाब है। दिल्ली में ऐसी क्वालिटी मिलना मुश्किल है।', lang: 'hi', rating: 5, group: 'india', gender: 'm' },
  { name: 'Priya Nair', location: 'Bengaluru, KA', text: 'Fresh, rich, and truly artisanal. Love the commitment to zero preservatives.', lang: 'en', rating: 4, group: 'india', gender: 'f' },
  { name: 'Aarav Sharma', location: 'Mumbai, MH', text: 'पैकेजिंग और प्रेजेंटेशन बहुत ही प्रीमियम है। गिफ्ट देने के लिए इससे बेहतर कुछ नहीं।', lang: 'hi', rating: 4, group: 'india', gender: 'm' },
  { name: 'Kavya Iyer', location: 'Chennai, TN', text: 'The raspberry ganache is a masterpiece. Balanced sweetness and perfect texture.', lang: 'en', rating: 5, group: 'india', gender: 'f' },
  { name: 'Aditya Verma', location: 'Hyderabad, TS', text: 'शुद्ध और हाथ से बने चॉकलेट्स की बात ही अलग है। बहुत ही शानदार अनुभव।', lang: 'hi', rating: 3, group: 'india', gender: 'm' },
  { name: 'Sneha Kapoor', location: 'Pune, MH', text: 'Great for high-end gifting. The dark chocolate range is especially impressive.', lang: 'en', rating: 4, group: 'india', gender: 'f' },
  { name: 'Rahul Singh', location: 'Lucknow, UP', text: 'स्वाद और क्वालिटी में नंबर वन। कोलकाता की यह मिठास अब हमारे घर तक।', lang: 'hi', rating: 4, group: 'india', gender: 'm' },

  // --- Group 3: International (5 items) ---
  { name: 'Olivia Smith', location: 'London, UK', text: 'Truly artisanal craftsmanship. A sophisticated treat that rivals top Belgian brands.', lang: 'en', rating: 5, group: 'international', gender: 'f' },
  { name: 'Daniel Wilson', location: 'New York, USA', text: 'Exceptional quality. You can taste the passion in every bite. World-class chocolate.', lang: 'en', rating: 4, group: 'international', gender: 'm' },
  { name: 'Emma Brown', location: 'Toronto, CA', text: 'My go-to choice for premium gifting. The texture and tempering are absolutely perfect.', lang: 'en', rating: 3, group: 'international', gender: 'f' },
  { name: 'Lucas Martin', location: 'Paris, FR', text: 'Beautifully presented and even better to eat. A delight for any chocolate lover.', lang: 'en', rating: 4, group: 'international', gender: 'm' },
  { name: 'Sophia Lee', location: 'Singapore', text: 'The delivery was efficient and the chocolates arrived in pristine condition. Impressive!', lang: 'en', rating: 3, group: 'international', gender: 'f' },
];

const CocoaBeanIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M12 2C12 2 7 7 7 12C7 17 12 22 12 22C12 22 17 17 17 12C17 7 12 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M9 10C10 10.5 11 11 12 11C13 11 14 10.5 15 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.5"/>
    <path d="M9 14C10 13.5 11 13 12 13C13 13 14 13.5 15 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.5"/>
  </svg>
);

const getCardVariant = (id: number) => {
  const variants = [
    { accent: 'text-[#3D1E16]', bg: 'from-white/95 to-[#fff8f2]/95', initials: 'bg-[#3D1E16]', border: 'border-[#3D1E16]/10' },
    { accent: 'text-[#800020]', bg: 'from-white/95 to-[#fdf2f2]/95', initials: 'bg-[#800020]', border: 'border-[#800020]/10' },
    { accent: 'text-[#D4AF37]', bg: 'from-white/95 to-[#fffcf0]/95', initials: 'bg-[#D4AF37]', border: 'border-[#D4AF37]/10' },
    { accent: 'text-[#7b3f00]', bg: 'from-white/95 to-[#f8f4f0]/95', initials: 'bg-[#7b3f00]', border: 'border-[#7b3f00]/10' },
  ];
  return variants[id % variants.length];
};

export function TestimonialMarquee() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const shuffledTestimonials = useMemo(() => {
    const base = [...TESTIMONIAL_DATA].map((t, i) => ({ ...t, id: i }));
    // Deterministic interleaving for a balanced visual stream
    return base.sort((a, b) => {
        const groupOrder = { kolkata: 0, india: 1, international: 2 };
        if (a.group !== b.group) return groupOrder[a.group] - groupOrder[b.group];
        return a.id - b.id;
    });
  }, []);

  if (!mounted) return null;

  return (
    <div className="testimonial-viewport">
      <div className="testimonial-track">
        {/* Group 1 */}
        <div className="testimonial-group">
          {shuffledTestimonials.map((t) => (
            <TestimonialCard key={t.id} testimonial={t} />
          ))}
        </div>
        {/* Group 2 (Identical Duplicate for Seamless Loop) */}
        <div className="testimonial-group" aria-hidden="true">
          {shuffledTestimonials.map((t) => (
            <TestimonialCard key={`dup-${t.id}`} testimonial={t} />
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

  const variant = getCardVariant(testimonial.id);

  return (
    <article className={cn(
      "testimonial-card",
      "p-8 rounded-[2rem] border bg-gradient-to-br backdrop-blur-md",
      "shadow-[0_15px_40px_-20px_rgba(0,0,0,0.1)] transition-all duration-400 ease-out",
      "hover:-translate-y-1.5 hover:shadow-[0_25px_60px_-20px_rgba(0,0,0,0.2)] group/card",
      variant.bg,
      variant.border
    )}>
      {/* Decorative background mark */}
      <Quote className="absolute -top-4 -left-2 h-24 w-28 text-stone-900/[0.03] -z-10 transition-transform group-hover/card:scale-110" />
      
      <div className="flex flex-col h-full justify-between gap-6 relative z-10">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className={cn(
              "h-14 w-14 rounded-full flex items-center justify-center text-white font-bold text-base shadow-lg transition-transform group-hover/card:scale-110 border-2 border-white",
              variant.initials
            )}>
              {initials}
            </div>
            <div className="space-y-0.5">
              <h4 className="font-bold text-stone-900 text-base leading-tight tracking-tight">
                {testimonial.name}
              </h4>
              <div className="flex items-center gap-1.5 text-stone-400">
                <MapPin className={cn("h-3 w-3", variant.accent)} />
                <span className="text-[10px] font-bold tracking-widest uppercase">
                  {testimonial.location}
                </span>
              </div>
            </div>
          </div>

          <p className={cn(
            "text-stone-600 leading-relaxed italic text-sm font-light line-clamp-4",
            testimonial.lang === 'bn' ? "font-medium" : ""
          )}>
            "{testimonial.text}"
          </p>
        </div>

        <div className="flex items-center justify-between border-t border-stone-100 pt-5 mt-auto">
          <div className="flex gap-1">
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
             <CocoaBeanIcon className={cn("h-4 w-4 opacity-20 group-hover/card:opacity-40 transition-opacity", variant.accent)} />
             <span className="text-[8px] font-black uppercase tracking-[0.2em] text-stone-300">Artisan Selection</span>
          </div>
        </div>
      </div>
    </article>
  );
}
