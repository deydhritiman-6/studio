
'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';

type FloatingItem = {
  id: number;
  imageUrl: string;
  left: string;
  size: number;
  duration: string;
  delay: string;
};

export function FloatingChocolates() {
  const [items, setItems] = useState<FloatingItem[]>([]);
  const chocoAssets = PlaceHolderImages.filter(img => img.id.startsWith('chocolate-piece'));

  useEffect(() => {
    // Generate a fixed set of items on mount to avoid hydration mismatch
    const newItems = Array.from({ length: 25 }).map((_, i) => ({
      id: i,
      imageUrl: chocoAssets[i % chocoAssets.length].imageUrl,
      left: `${Math.random() * 100}%`,
      size: Math.floor(Math.random() * 60) + 20, 
      duration: `${Math.random() * 10 + 20}s`, 
      delay: `${Math.random() * 30}s`,
    }));
    setItems(newItems);
  }, [chocoAssets.length]);

  if (items.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {items.map((item) => (
        <div
          key={item.id}
          className="absolute animate-float-down grayscale opacity-30 blur-[1px]"
          style={{
            left: item.left,
            width: item.size,
            height: item.size,
            animationDuration: item.duration,
            animationDelay: item.delay,
            top: '-15vh',
          }}
        >
          <Image
            src={item.imageUrl}
            alt="Floating chocolate piece"
            width={item.size}
            height={item.size}
            className="object-contain"
          />
        </div>
      ))}
    </div>
  );
}
