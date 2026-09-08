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
  // --- Group 1: Kolkata (12 items) - 50% ---
  { name: 'Ananya Chatterjee', location: 'Salt Lake, Kolkata', text: 'অপূর্ব স্বাদ! কলকাতার সেরা হ্যান্ডমেড চকলেট। ডার্ক চকোলেট ট্রাফলটা আমার ফেভারিট।', lang: 'bn', rating: 5, group: 'kolkata', gender: 'f' },
  { name: 'Sayan Banerjee', location: 'Ballygunge, Kolkata', text: 'The sea salt caramel is pure bliss. Packaging is incredibly premium and artisanal.', lang: 'en', rating: 4, group: 'kolkata', gender: 'm' },
  { name: 'Riya Mukherjee', location: 'New Town, Kolkata', text: 'আমি আমার মা-কে উপহার দিয়েছিলাম, উনি খুব খুশি হয়েছেন। গুণগত মান অনবদ্য।', lang: 'bn', rating: 4, group: 'kolkata', gender: 'f' },
  { name: 'Arindam Ghosh', location: 'Alipore, Kolkata', text: 'Authentic single-origin flavors. Perfect for corporate gifting. Truly impressive quality.', lang: 'en', rating: 4, group: 'kolkata', gender: 'm' },
  { name: 'Soham Dutta', location: 'Jadavpur, Kolkata', text: 'এদের চকোলেটের টেক্সচার খুব স্মুথ। একদম আন্তর্জাতিক মানের স্বাদ আর প্রেজেন্টেশন।', lang: 'bn', rating: 5, group: 'kolkata', gender: 'm' },
  { name: 'Moumita Roy', location: 'Tollygunge, Kolkata', text: 'Beautiful presentation. Loved the customized box for my anniversary. Very elegant.', lang: 'en', rating: 4, group: 'kolkata', gender: 'f' },
  { name: 'Debanjan Sen', location: 'Behala, Kolkata', text: 'খুব সুন্দর প্রেজেন্টেশন। কলকাতার বুকে এরকম রুচিশীল উদ্যোগ সত্যিই বিরল।', lang: 'bn', rating: 4, group: 'kolkata', gender: 'm' },
  { name: 'Tiyasha Das', location: 'Dum Dum, Kolkata', text: 'The hazelnut praline is so addictive. High-quality ingredients and great snap.', lang: 'en', rating: 4, group: 'kolkata', gender: 'f' },
  { name: 'Subhojit Das', location: 'Esplanade, Kolkata', text: 'স্বাদ আর গন্ধে আভিজাত্যের ছোঁয়া। উৎসবের মরশুমে সেরা উপহার আমাদের জন্য।', lang: 'bn', rating: 3, group: 'kolkata', gender: 'm' },
  { name: 'Sreya Saha', location: 'Lake Town, Kolkata', text: 'প্যাকেজিং টা জাস্ট অসাধারণ! চকোলেটের স্বাদ অনেকক্ষণ মুখে লেগে থাকার মতো।', lang: 'bn', rating: 5, group: 'kolkata', gender: 'f' },
  { name: 'Ritwick Bose', location: 'Park Street, Kolkata', text: 'Premium cocoa notes. Reminds me of boutique shops in Europe. Simply exquisite.', lang: 'en', rating: 4, group: 'kolkata', gender: 'm' },
  { name: 'Ishita Paul', location: 'Shyambazar, Kolkata', text: 'Excellent customer service and the delivery was prompt. The truffles are works of art.', lang: 'en', rating: 4, group: 'kolkata', gender: 'f' },

  // --- Group 2: Other Indian Cities (7 items) - ~30% ---
  { name: 'Rohan Mehta', location: 'Delhi, NCR', text: 'इनके चॉकलेट्स का स्वाद वाकई लाजवाब है। दिल्ली में ऐसी क्वालिटी मिलना मुश्किल है।', lang: 'hi', rating: 4, group: 'india', gender: 'm' },
  { name: 'Priya Nair', location: 'Bengaluru, KA', text: 'Fresh, rich, and truly artisanal. Love the commitment to zero preservatives.', lang: 'en', rating: 5, group: 'india', gender: 'f' },
  { name: 'Aarav Sharma', location: 'Mumbai, MH', text: 'पैकेजिंग और प्रेजेंटেশন बहुत ही प्रीमियम है। गिफ्ट देने के लिए इससे बेहतर कुछ नहीं।', lang: 'hi', rating: 4, group: 'india', gender: 'm' },
  { name: 'Kavya Iyer', location: 'Chennai, TN', text: 'The raspberry ganache is a masterpiece. Balanced sweetness and perfect texture.', lang: 'en', rating: 4, group: 'india', gender: 'f' },
  { name: 'Aditya Verma', location: 'Hyderabad, TS', text: 'शुद्ध और हाथ से बने चॉकलेट्स की बात ही अलग है। बहुत ही शानदार अनुभव।', lang: 'hi', rating: 3, group: 'india', gender: 'm' },
  { name: 'Sneha Kapoor', location: 'Pune, MH', text: 'Great for high-end gifting. The dark chocolate range is especially impressive.', lang: 'en', rating: 4, group: 'india', gender: 'f' },
  { name: 'Rahul Singh', location: 'Lucknow, UP', text: 'स्वाद और क्वालिटी में नंबर वन। कोलकाता की यह मिঠা এবার আমাদের বাড়িতে।', lang: 'hi', rating: 4, group: 'india', gender: 'm' },

  // --- Group 3: International (5 items) - ~20% ---
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
    { accent: 'text-[#3D1E16]', bg: 'from-white/95 via-[#fff8f2]/95 to-[#fff4ec]/95', initials: 'bg-gradient-to-br from-[#3D1E16] to-[#5a2e1d]', border: 'border-[#3D1E16]/10' },
    { accent: 'text-[#800020]', bg: 'from-white/95 via-[#fdf2f2]/95 to-[#fff0f0]/95', initials: 'bg-gradient-to-br from-[#800020] to-[#a52a2a]', border: 'border-[#800020]/10' },
    { accent: 'text-[#D4AF37]', bg: 'from-white/95 via-[#fffcf0]/95 to-[#fff9e0]/95', initials: 'bg-gradient-to-br from-[#D4AF37] to-[#b8860b]', border: 'border-[#D4AF37]/10' },
    { accent: 'text-[#7b3f00]', bg: 'from-white/95 via-[#f8f4f0]/95 to-[#f5eee6]/95', initials: 'bg-gradient-to-br from-[#7b3f00] to-[#8b4513]', border: 'border-[#7b3f00]/10' },
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
    // Balanced interleaving for a premium visual stream
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
      "p-10 rounded-[2.5rem] border-2 bg-gradient-to-br backdrop-blur-xl",
      "shadow-[0_20px_50px_-20px_rgba(0,0,0,0.1)] transition-all duration-500 ease-out",
      "hover:-translate-y-2 hover:shadow-[0_30px_60px_-20px_rgba(0,0,0,0.2)] group/card",
      variant.bg,
      variant.border
    )}>
      {/* Decorative oversized background Quote mark */}
      <Quote className="absolute -top-6 -left-4 h-32 w-32 text-stone-900/[0.02] -z-10 transition-transform group-hover/card:scale-110" />
      
      <div className="flex flex-col h-full justify-between gap-8 relative z-10">
        <div className="space-y-6">
          <div className="flex items-center gap-5">
            <div className={cn(
              "h-16 w-16 rounded-full flex items-center justify-center text-white font-black text-lg shadow-xl transition-all duration-500 group-hover/card:scale-110 border-4 border-white",
              variant.initials
            )}>
              {initials}
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-stone-900 text-lg leading-tight tracking-tight">
                {testimonial.name}
              </h4>
              <div className="flex items-center gap-2 text-stone-400">
                <MapPin className={cn("h-3.5 w-3.5", variant.accent)} />
                <span className="text-[11px] font-black tracking-widest uppercase opacity-70">
                  {testimonial.location}
                </span>
              </div>
            </div>
          </div>

          <div className="relative">
            <p className={cn(
              "text-stone-700 leading-relaxed italic text-base font-light line-clamp-4 relative z-10",
              testimonial.lang === 'bn' ? "font-medium" : ""
            )}>
              "{testimonial.text}"
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-stone-100/50 pt-6 mt-auto">
          <div className="flex gap-1">
            {[...Array(5)].map((_, i) => (
              <Star 
                key={i} 
                className={cn(
                  "h-4 w-4 transition-colors", 
                  i < testimonial.rating 
                    ? "fill-[#D4AF37] text-[#D4AF37]" 
                    : "text-stone-200 fill-none"
                )} 
              />
            ))}
          </div>
          <div className="flex items-center gap-2.5">
             <CocoaBeanIcon className={cn("h-5 w-5 opacity-10 group-hover/card:opacity-30 transition-all duration-500", variant.accent)} />
             <span className="text-[10px] font-black uppercase tracking-[0.25em] text-stone-300">Artisan Selection</span>
          </div>
        </div>
      </div>
    </article>
  );
}
