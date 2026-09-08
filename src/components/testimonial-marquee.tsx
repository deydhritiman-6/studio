'use client';

import React, { useMemo, useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
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
  // --- Group 1: Kolkata (Highest) ---
  { name: 'Ananya Chatterjee', location: 'Salt Lake, Kolkata', text: 'অপূর্ব স্বাদ! কলকাতার সেরা হ্যান্ডমেড চকলেট। ডার্ক চকোলেট ট্রাফলটা আমার ফেভারিট।', lang: 'bn', rating: 4, group: 'kolkata', gender: 'female' },
  { name: 'Sayan Banerjee', location: 'Ballygunge, Kolkata', text: 'Best artisan chocolate in town. The packaging is as premium as the taste. Highly recommended!', lang: 'en', rating: 5, group: 'kolkata', gender: 'male' },
  { name: 'Riya Mukherjee', location: 'New Town, Kolkata', text: 'আমি জন্মদিন উপলক্ষে অর্ডার করেছিলাম, সবাই খুব প্রশংসা করেছে। প্রেজেন্টেশন একদম টপ-নচ।', lang: 'bn', rating: 4, group: 'kolkata', gender: 'female' },
  { name: 'Arindam Ghosh', location: 'Alipore, Kolkata', text: 'The texture is incredibly smooth. You can tell it is made with pure cocoa butter. Excellent craftsmanship.', lang: 'en', rating: 4, group: 'kolkata', gender: 'male' },
  { name: 'Soham Dutta', location: 'Jadavpur, Kolkata', text: 'রোজবেরি চকোলেট ভালো, কিন্তু ডেলিভারি একটু দেরি হয়েছিল। তবে স্বাদ খুব সুন্দর।', lang: 'bn', rating: 3, group: 'kolkata', gender: 'male' },
  { name: 'Moumita Roy', location: 'Tollygunge, Kolkata', text: 'Authentic flavors and beautiful designs. Best gift for anniversaries!', lang: 'en', rating: 5, group: 'kolkata', gender: 'female' },
  { name: 'Debanjan Sen', location: 'Behala, Kolkata', text: 'কলকাতার বুকে এরকম ইন্টারন্যাশনাল মানের চকোলেট সত্যিই বিরল। দারুণ অভিজ্ঞতা!', lang: 'bn', rating: 4, group: 'kolkata', gender: 'male' },
  { name: 'Tiyasha Das', location: 'Dum Dum, Kolkata', text: 'The sea salt caramel is a revelation. Balanced, rich, and addictive!', lang: 'en', rating: 4, group: 'kolkata', gender: 'female' },
  { name: 'Nilanjan Mitra', location: 'Park Street, Kolkata', text: 'Professional service and world-class chocolates. A must-try for everyone.', lang: 'en', rating: 4, group: 'kolkata', gender: 'male' },
  { name: 'Priyanka Bose', location: 'Shyambazar, Kolkata', text: 'এদের চকোলেটের প্রত্যেকটি বাইট যেন একটা আলাদা অনুভূতি। খুব ভালো প্যাকেজিং।', lang: 'bn', rating: 5, group: 'kolkata', gender: 'female' },
  { name: 'Abhishek Rakshit', location: 'Lake Town, Kolkata', text: 'बिल्कुल ताज़ा और लाजवाब! स्वाद बहुत अच्छा है, लेकिन स्टॉक अक्सर खत्म हो जाता है।', lang: 'hi', rating: 3, group: 'kolkata', gender: 'male' },

  // --- Group 2: Other Indian Cities ---
  { name: 'Aarav Sharma', location: 'Mumbai, Maharashtra', text: 'इनके चॉकलेट्स का स्वाद वाकई लाजवाब है। मुंबई में भी ऐसी क्वालिटी मिलना मुश्किल है।', lang: 'hi', rating: 4, group: 'india', gender: 'male' },
  { name: 'Priya Nair', location: 'Bengaluru, Karnataka', text: 'Ordered a custom box for my corporate team. The branding and quality were exceptional. Thank you, Roseberry!', lang: 'en', rating: 5, group: 'india', gender: 'female' },
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
  { name: 'Lucas Martin', location: 'Paris, France', text: 'Un délice artisanal! Very impressed with the balance of flavors and the high-quality cocoa used.', lang: 'en', rating: 4, group: 'international', gender: 'male' },
  { name: 'Sophia Lee', location: 'Singapore', text: 'Exquisite truffles that melt in your mouth. The packaging makes it the perfect gift for luxury seekers.', lang: 'en', rating: 4, group: 'international', gender: 'female' },
  { name: 'Noah Williams', location: 'Sydney, Australia', text: 'Top-tier quality from India, though the premium pricing makes it more of a special occasion treat.', lang: 'en', rating: 4, group: 'international', gender: 'male' },
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
  const shouldReduceMotion = useReducedMotion();
  const [shuffledTestimonials, setShuffledTestimonials] = useState<Testimonial[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Fisher-Yates shuffle with distribution weighting
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

  // Duplicate for seamless looping
  const marqueeItems = useMemo(() => {
    return [...shuffledTestimonials, ...shuffledTestimonials];
  }, [shuffledTestimonials]);

  if (!mounted || shuffledTestimonials.length === 0) return null;

  return (
    <div className="w-full relative group">
      {/* Decorative Gradient Overlays for Fade Effect */}
      <div className="absolute top-0 left-0 bottom-0 w-24 md:w-48 bg-gradient-to-r from-stone-50 to-transparent z-10 pointer-events-none" />
      <div className="absolute top-0 right-0 bottom-0 w-24 md:w-48 bg-gradient-to-l from-stone-50 to-transparent z-10 pointer-events-none" />

      <div className="flex overflow-hidden py-10">
        <motion.div
          className="flex gap-6 md:gap-8 whitespace-nowrap"
          animate={shouldReduceMotion ? {} : { x: [0, -9000] }} 
          transition={{
            x: {
              repeat: Infinity,
              repeatType: "loop",
              duration: 180, // Slow, premium speed
              ease: "linear",
            },
          }}
          whileHover={shouldReduceMotion ? {} : { pause: true }}
          style={{ width: 'fit-content' }}
        >
          {marqueeItems.map((testimonial, idx) => (
            <TestimonialCard key={`${testimonial.id}-${idx}`} testimonial={testimonial} />
          ))}
        </motion.div>
      </div>

      <style jsx global>{`
        @keyframes float-left {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        .marquee-container:hover .marquee-content {
          animation-play-state: paused;
        }
      `}</style>
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
    <motion.div
      whileHover={{ y: -8, scale: 1.02 }}
      className="inline-block w-[280px] md:w-[380px] h-full"
    >
      <div className="h-full bg-white/40 backdrop-blur-xl border border-white/60 p-6 md:p-8 rounded-[2.5rem] shadow-[0_10px_30px_-15px_rgba(0,0,0,0.1)] flex flex-col justify-between group transition-all duration-500 hover:shadow-[0_20px_50px_-20px_rgba(var(--primary),0.2)] hover:bg-white/60">
        <div className="space-y-6">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-4">
              <div className={cn(
                "h-12 w-12 rounded-2xl flex items-center justify-center text-white font-bold text-sm shadow-lg transform transition-transform group-hover:rotate-12",
                getAvatarColors(testimonial.name)
              )}>
                {initials}
              </div>
              <div className="space-y-0.5">
                <h4 className="font-bold text-stone-900 text-lg leading-none">{testimonial.name}</h4>
                <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-stone-400">
                  <MapPin className="h-2.5 w-2.5 text-primary" />
                  {testimonial.location}
                </div>
              </div>
            </div>
            <Quote className="h-8 w-8 text-stone-100 group-hover:text-primary/10 transition-colors duration-500" />
          </div>

          <div className="relative">
            <p className={cn(
              "text-stone-600 leading-relaxed italic whitespace-normal line-clamp-4",
              testimonial.lang === 'bn' ? "text-lg font-medium" : "text-base font-light"
            )}>
              "{testimonial.text}"
            </p>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-stone-100/50 flex justify-between items-center">
          <div className="flex gap-0.5 text-amber-500">
            {[...Array(5)].map((_, i) => (
              <Star 
                key={i} 
                className={cn(
                  "h-3 w-3", 
                  i < testimonial.rating ? "fill-current" : "text-stone-200 fill-none"
                )} 
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
             <div className="h-1.5 w-1.5 rounded-full bg-primary/30" />
             <span className="text-[8px] font-bold uppercase tracking-widest text-stone-300">Handmade with Love</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
