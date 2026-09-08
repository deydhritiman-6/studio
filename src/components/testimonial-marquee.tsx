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
  gender: 'male' | 'female';
};

const TESTIMONIAL_DATA: Omit<Testimonial, 'id'>[] = [
  // --- Group 1: Kolkata (Highest Density) ---
  { name: 'Ananya Chatterjee', location: 'Salt Lake, Kolkata', text: 'অপূর্ব স্বাদ! কলকাতার সেরা হ্যান্ডমেড চকলেট। ডার্ক চকোলেট ট্রাফলটা আমার ফেভারিট।', lang: 'bn', rating: 5, group: 'kolkata', gender: 'female' },
  { name: 'Sayan Banerjee', location: 'Ballygunge, Kolkata', text: 'Best artisan chocolate in town. The packaging is as premium as the taste. Highly recommended!', lang: 'en', rating: 4, group: 'kolkata', gender: 'male' },
  { name: 'Riya Mukherjee', location: 'New Town, Kolkata', text: 'আমি জন্মদিন উপলক্ষে অর্ডার করেছিলাম, সবাই খুব প্রশংসা করেছে। প্রেজেন্টেশন একদম টপ-নচ।', lang: 'bn', rating: 4, group: 'kolkata', gender: 'female' },
  { name: 'Arindam Ghosh', location: 'Alipore, Kolkata', text: 'The texture is incredibly smooth. You can tell it is made with pure cocoa butter. Excellent craftsmanship.', lang: 'en', rating: 4, group: 'kolkata', gender: 'male' },
  { name: 'Soham Dutta', location: 'Jadavpur, Kolkata', text: 'স্বাদ খুব সুন্দর। তবে ডেলিভারি একটু দেরি হয়েছিল বলে ৪ তারা দিলাম না। চকলেটগুলো জাস্ট অসাধারণ!', lang: 'bn', rating: 3, group: 'kolkata', gender: 'male' },
  { name: 'Moumita Roy', location: 'Tollygunge, Kolkata', text: 'Authentic flavors and beautiful designs. Best gift for anniversaries!', lang: 'en', rating: 5, group: 'kolkata', gender: 'female' },
  { name: 'Debanjan Sen', location: 'Behala, Kolkata', text: 'কলকাতার বুকে এরকম ইন্টারন্যাশনাল মানের চকোলেট সত্যিই বিরল। দারুণ অভিজ্ঞতা!', lang: 'bn', rating: 4, group: 'kolkata', gender: 'male' },
  { name: 'Tiyasha Das', location: 'Dum Dum, Kolkata', text: 'The sea salt caramel is a revelation. Balanced, rich, and addictive!', lang: 'en', rating: 4, group: 'kolkata', gender: 'female' },
  { name: 'Nilanjan Mitra', location: 'Park Street, Kolkata', text: 'Professional service and world-class chocolates. A must-try for everyone.', lang: 'en', rating: 4, group: 'kolkata', gender: 'male' },
  { name: 'Priyanka Bose', location: 'Shyambazar, Kolkata', text: 'এদের চকোলেটের প্রত্যেকটি বাইট যেন একটা আলাদা অনুভূতি। খুব ভালো প্যাকেজিং।', lang: 'bn', rating: 5, group: 'kolkata', gender: 'female' },
  { name: 'Abhishek Rakshit', location: 'Lake Town, Kolkata', text: 'स्वाद तो लाजवाब है, पर स्टॉक अक्सर खत्म हो जाता है। उम्मीद है अगली बार सब मिलेगा।', lang: 'hi', rating: 3, group: 'kolkata', gender: 'male' },
  { name: 'Subhojit Das', location: 'Esplanade, Kolkata', text: 'Really loved the dark chocolate collection. Perfect balance of bitterness and sweetness.', lang: 'en', rating: 4, group: 'kolkata', gender: 'male' },
  { name: 'Ishani Gupta', location: 'Rajarhat, Kolkata', text: 'Best gifting option for Diwali. Everyone loved the assorted box.', lang: 'en', rating: 4, group: 'kolkata', gender: 'female' },

  // --- Group 2: Other Indian Cities ---
  { name: 'Aarav Sharma', location: 'Mumbai, Maharashtra', text: 'इनके चॉकलेट्स का स्वाद वाकई लाजवाब है। मुंबई में भी ऐसी क्वालिटी मिलना मुश्किल है।', lang: 'hi', rating: 4, group: 'india', gender: 'male' },
  { name: 'Priya Nair', location: 'Bengaluru, Karnataka', text: 'Ordered a custom box for my corporate team. The branding and quality were exceptional.', lang: 'en', rating: 5, group: 'india', gender: 'female' },
  { name: 'Rohan Mehta', location: 'Delhi, NCR', text: 'गिफ्टिंग के लिए इससे बेहतर कुछ नहीं हो सकता। बहुत ही शानदार और प्रीमियम फील।', lang: 'hi', rating: 4, group: 'india', gender: 'male' },
  { name: 'Kavya Iyer', location: 'Chennai, Tamil Nadu', text: 'Taste is great, but transit during summer is tricky. Arrived a bit soft, though customer care was helpful.', lang: 'en', rating: 3, group: 'india', gender: 'female' },
  { name: 'Aditya Verma', location: 'Hyderabad, Telangana', text: 'बेहतरीन स्वाद और शुद्धता। डार्क चॉकलेट के शौकीनों के लिए जन्नत है।', lang: 'hi', rating: 4, group: 'india', gender: 'male' },
  { name: 'Sneha Kapoor', location: 'Pune, Maharashtra', text: 'Unique flavor combinations! The raspberry ganache is a masterpiece of artisan chocolate.', lang: 'en', rating: 4, group: 'india', gender: 'female' },
  { name: 'Rahul Das', location: 'Guwahati, Assam', text: 'The attention to detail in tempering is visible. Proper snap and rich mouthfeel.', lang: 'en', rating: 5, group: 'india', gender: 'male' },
  { name: 'Neha Singh', location: 'Jaipur, Rajasthan', text: 'बहुत ही खूबसूरत पैकिंग। स्वाद तो और भी बेहतर है। फेस्टिवल्स के लिए बेस्ट गिफ्ट।', lang: 'hi', rating: 4, group: 'india', gender: 'female' },

  // --- Group 3: International ---
  { name: 'Olivia Smith', location: 'London, UK', text: 'Roseberry chocolates have a sophisticated profile that rivals the best European brands. Truly world-class.', lang: 'en', rating: 5, group: 'international', gender: 'female' },
  { name: 'Daniel Wilson', location: 'New York, USA', text: 'Authentic single-origin beans. You can taste the terroir in every bite. Exceptional quality!', lang: 'en', rating: 4, group: 'international', gender: 'male' },
  { name: 'Emma Brown', location: 'Toronto, Canada', text: 'Beautifully crafted, though international shipping took longer than expected. Worth the wait!', lang: 'en', rating: 3, group: 'international', gender: 'female' },
  { name: 'Sophia Lee', location: 'Singapore', text: 'Exquisite truffles that melt in your mouth. The packaging makes it the perfect gift for luxury seekers.', lang: 'en', rating: 5, group: 'international', gender: 'female' },
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
    { accent: 'text-[#3D1E16]', bg: 'from-white/95 to-[#fff8f2]/90', initials: 'bg-[#3D1E16]', border: 'border-[#3D1E16]/10', hoverBorder: 'group-hover:border-[#3D1E16]/20' },
    { accent: 'text-[#800020]', bg: 'from-white/95 to-[#fdf2f2]/90', initials: 'bg-[#800020]', border: 'border-[#800020]/10', hoverBorder: 'group-hover:border-[#800020]/20' },
    { accent: 'text-[#D4AF37]', bg: 'from-white/95 to-[#fffcf0]/90', initials: 'bg-[#D4AF37]', border: 'border-[#D4AF37]/10', hoverBorder: 'group-hover:border-[#D4AF37]/20' },
    { accent: 'text-[#7b3f00]', bg: 'from-white/95 to-[#f8f4f0]/90', initials: 'bg-[#7b3f00]', border: 'border-[#7b3f00]/10', hoverBorder: 'group-hover:border-[#7b3f00]/20' },
  ];
  return styles[id % styles.length];
};

export function TestimonialMarquee() {
  const [shuffledTestimonials, setShuffledTestimonials] = useState<Testimonial[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const shuffle = () => {
      const all = [...TESTIMONIAL_DATA].map((t, i) => ({ ...t, id: i }));
      for (let i = all.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [all[i], all[j]] = [all[j], all[i]];
      }
      return all;
    };
    setShuffledTestimonials(shuffle());
  }, []);

  const marqueeItems = useMemo(() => {
    if (shuffledTestimonials.length === 0) return [];
    return [...shuffledTestimonials, ...shuffledTestimonials];
  }, [shuffledTestimonials]);

  if (!mounted || shuffledTestimonials.length === 0) return null;

  return (
    <div className="testimonial-marquee-container group">
      <div className="absolute top-0 left-0 bottom-0 w-24 md:w-64 bg-gradient-to-r from-stone-50 to-transparent z-10 pointer-events-none" />
      <div className="absolute top-0 right-0 bottom-0 w-24 md:w-64 bg-gradient-to-l from-stone-50 to-transparent z-10 pointer-events-none" />

      <div className="testimonial-marquee-track">
        {marqueeItems.map((testimonial, idx) => (
          <div key={`${testimonial.id}-${idx}`} className="testimonial-card-wrapper">
            <TestimonialCard testimonial={testimonial} />
          </div>
        ))}
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
      "h-full w-[340px] md:w-[420px] flex-shrink-0 relative overflow-hidden",
      "p-8 md:p-10 rounded-[28px] border bg-gradient-to-br backdrop-blur-md",
      "shadow-[0_10px_30px_-10px_rgba(61,30,22,0.08)] transition-all duration-500 ease-out",
      "group/card",
      style.bg,
      style.border,
      style.hoverBorder
    )}>
      {/* Decorative Quote Mark */}
      <Quote className="absolute -top-4 -left-2 h-24 w-24 text-stone-900/[0.03] -z-10 transition-transform duration-700 group-hover/card:scale-110 group-hover/card:rotate-6" />
      
      <div className="flex flex-col h-full justify-between gap-8 relative z-10">
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className={cn(
              "h-12 w-12 md:h-14 md:w-14 rounded-full flex items-center justify-center text-white font-bold text-base shadow-lg transform transition-all duration-500 group-hover/card:scale-105 group-hover/card:rotate-3",
              style.initials
            )}>
              {initials}
            </div>
            <div className="space-y-0.5">
              <h4 className="font-semibold text-stone-900 text-base md:text-lg leading-tight transition-colors group-hover/card:text-primary">
                {testimonial.name}
              </h4>
              <div className="flex items-center gap-1.5 text-stone-400">
                <MapPin className={cn("h-3 w-3", style.accent)} />
                <span className="text-xs md:text-sm font-medium tracking-tight truncate max-w-[140px] md:max-w-[200px]">
                  {testimonial.location}
                </span>
              </div>
            </div>
          </div>

          <div className="relative">
            <p className={cn(
              "text-stone-600 leading-relaxed italic whitespace-normal line-clamp-6 min-h-[120px] text-sm md:text-base font-light",
              testimonial.lang === 'bn' ? "font-medium" : ""
            )}>
              "{testimonial.text}"
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between border-t border-stone-200/50 pt-6">
            <div className="flex gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star 
                  key={i} 
                  className={cn(
                    "h-3.5 w-3.5 transition-all duration-500", 
                    i < testimonial.rating 
                      ? "fill-amber-500 text-amber-500 group-hover/card:scale-110" 
                      : "text-stone-200 fill-none"
                  )} 
                />
              ))}
            </div>
            <div className="flex items-center gap-2">
               <CocoaBeanIcon className={cn("h-4 w-4 opacity-20 transition-all duration-500 group-hover/card:opacity-40 group-hover/card:rotate-12", style.accent)} />
               <span className="text-[10px] font-black uppercase tracking-widest text-stone-300">Artisan Selection</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
