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
  { name: 'Soham Dutta', location: 'Jadavpur, Kolkata', text: 'স্বাদ খুব সুন্দর। তবে ডেলিভারি একটু দেরি হয়েছিল বলে ৪ তারা দিলাম না। চকলেটগুলো জাস্ট অসাধারণ!', lang: 'bn', rating: 4, group: 'kolkata', gender: 'male' },
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

const getAvatarColors = (name: string) => {
  const colors = [
    'bg-rose-500', 'bg-amber-500', 'bg-primary', 'bg-stone-800', 
    'bg-emerald-600', 'bg-cyan-600', 'bg-purple-600', 'bg-orange-500'
  ];
  const index = name.length % colors.length;
  return colors[index];
};

export function TestimonialMarquee() {
  const [shuffledTestimonials, setShuffledTestimonials] = useState<Testimonial[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Standard shuffle for fresh sequence
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

  // Use two identical copies for a seamless loop
  const marqueeItems = useMemo(() => {
    if (shuffledTestimonials.length === 0) return [];
    return [...shuffledTestimonials, ...shuffledTestimonials];
  }, [shuffledTestimonials]);

  if (!mounted || shuffledTestimonials.length === 0) return null;

  return (
    <div className="testimonial-marquee-container group">
      {/* Visual Edge Fades */}
      <div className="absolute top-0 left-0 bottom-0 w-24 md:w-64 bg-gradient-to-r from-stone-50 to-transparent z-10 pointer-events-none" />
      <div className="absolute top-0 right-0 bottom-0 w-24 md:w-64 bg-gradient-to-l from-stone-50 to-transparent z-10 pointer-events-none" />

      {/* Moving Track */}
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

  return (
    <div className="h-full w-[320px] md:w-[420px] bg-white/40 backdrop-blur-xl border border-white/70 p-8 md:p-10 rounded-[3rem] shadow-[0_15px_40px_-20px_rgba(0,0,0,0.08)] flex flex-col justify-between group/card transition-all duration-500 hover:shadow-[0_25px_60px_-25px_rgba(var(--primary),0.25)] hover:bg-white/60">
      <div className="space-y-8">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-5">
            <div className={cn(
              "h-14 w-14 rounded-2xl flex items-center justify-center text-white font-bold text-base shadow-xl transform transition-transform duration-500 group-hover/card:rotate-12",
              getAvatarColors(testimonial.name)
            )}>
              {initials}
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-stone-900 text-xl leading-none truncate max-w-[160px] md:max-w-[220px]">{testimonial.name}</h4>
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.1em] text-stone-400">
                <MapPin className="h-3 w-3 text-primary" />
                <span className="truncate max-w-[130px] md:max-w-[190px]">{testimonial.location}</span>
              </div>
            </div>
          </div>
          <Quote className="h-10 w-10 text-stone-100 group-hover/card:text-primary/10 transition-colors duration-700" />
        </div>

        <div className="relative">
          <p className={cn(
            "text-stone-600 leading-relaxed italic whitespace-normal line-clamp-5 min-h-[120px]",
            testimonial.lang === 'bn' ? "text-xl font-medium" : "text-lg font-light"
          )}>
            "{testimonial.text}"
          </p>
        </div>
      </div>

      <div className="mt-10 pt-8 border-t border-stone-100/60 flex justify-between items-center">
        <div className="flex gap-1">
          {[...Array(5)].map((_, i) => (
            <Star 
              key={i} 
              className={cn(
                "h-4 w-4 transition-all duration-500", 
                i < testimonial.rating ? "fill-amber-500 text-amber-500 scale-110" : "text-stone-200 fill-none"
              )} 
            />
          ))}
        </div>
        <div className="flex items-center gap-3">
           <div className="h-2 w-2 rounded-full bg-primary/40 animate-pulse" />
           <span className="text-[9px] font-black uppercase tracking-[0.2em] text-stone-300">Artisan Patron</span>
        </div>
      </div>
    </div>
  );
}
