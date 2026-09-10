'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface ArtisanPerimeterProps {
  children: React.ReactNode;
  className?: string;
  radius?: string;
  speed?: number;
  thickness?: number;
}

/**
 * @fileOverview ArtisanPerimeter component provides a high-fidelity, 
 * continuously moving full-rainbow border effect around its children.
 * 
 * It uses a rotating conic-gradient technique to ensure the entire perimeter
 * is covered with color at all times, with the pattern traveling around 
 * all four sides and corners in a seamless loop.
 */
export function ArtisanPerimeter({
  children,
  className,
  radius = '2.5rem',
  speed = 2.5,
  thickness = 2,
}: ArtisanPerimeterProps) {
  // Unique animation name based on speed to allow multiple instances if needed
  const animationName = `rainbow-flow-rotate-${speed.toString().replace('.', '-')}`;

  return (
    <div 
      className={cn("relative group overflow-hidden flex flex-col", className)} 
      style={{ borderRadius: radius }}
    >
      {/* 
        The Continuous Rainbow Layer
        A 400% size conic-gradient that rotates around the center.
        This ensures 100% coverage of the border path while creating 
        the visual effect of colors traveling across edges and corners.
      */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400%] h-[400%] pointer-events-none"
        style={{ 
          background: `conic-gradient(
            from 0deg,
            #ff0000 0%,
            #ff8000 12.5%,
            #ffff00 25%,
            #00ff00 37.5%,
            #00ffff 50%,
            #0000ff 62.5%,
            #8000ff 75%,
            #ff0080 87.5%,
            #ff0000 100%
          )`,
          animation: `${animationName} ${speed}s linear infinite`,
          zIndex: 0
        }}
      />
      
      {/* Subliminal Luminous Glow Overlay */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400%] h-[400%] pointer-events-none blur-2xl opacity-20"
        style={{ 
          background: `conic-gradient(
            from 0deg,
            #ff0000 0%,
            #ff8000 12.5%,
            #ffff00 25%,
            #00ff00 37.5%,
            #00ffff 50%,
            #0000ff 62.5%,
            #8000ff 75%,
            #ff0080 87.5%,
            #ff0000 100%
          )`,
          animation: `${animationName} ${speed}s linear infinite`,
          zIndex: 0
        }}
      />

      {/* 
        Artisan Content Area / Reveal Mask
        This container sits on top and is slightly smaller than the outer div.
        The resulting gap creates the appearance of a 2px moving rainbow border.
      */}
      <div 
        className="relative z-10 w-full h-full overflow-hidden flex-1" 
        style={{ 
          borderRadius: `calc(${radius} - ${thickness / 2}px)`,
          margin: `${thickness}px`,
          width: `calc(100% - ${thickness * 2}px)`,
          height: `calc(100% - ${thickness * 2}px)`,
          // Isolation creates a new stacking context for children
          isolation: 'isolate'
        }}
      >
        {children}
      </div>

      <style jsx>{`
        @keyframes ${animationName} {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to { transform: translate(-50%, -50%) rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
