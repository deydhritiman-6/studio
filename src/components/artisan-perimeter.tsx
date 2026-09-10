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
 * @fileOverview A high-fidelity animated border component.
 * It uses SVG stroke animation to create a single rainbow light streak 
 * that physically travels around the perimeter of its children.
 */
export function ArtisanPerimeter({
  children,
  className,
  radius = '2.5rem',
  speed = 6,
  thickness = 2,
}: ArtisanPerimeterProps) {
  const gradientId = React.useId().replace(/:/g, '');

  return (
    <div className={cn("relative group", className)} style={{ borderRadius: radius }}>
      {/* Internal Content Container */}
      <div className="relative z-10 w-full h-full overflow-hidden" style={{ borderRadius: radius }}>
        {children}
      </div>

      {/* SVG Border Overlay */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none z-20 overflow-visible"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ff0000" />
            <stop offset="14%" stopColor="#ffa500" />
            <stop offset="28%" stopColor="#ffff00" />
            <stop offset="42%" stopColor="#00ff00" />
            <stop offset="57%" stopColor="#00ffff" />
            <stop offset="71%" stopColor="#0000ff" />
            <stop offset="85%" stopColor="#8b00ff" />
            <stop offset="100%" stopColor="#ff00ff" />
          </linearGradient>
          
          <filter id="artisan-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Subtle Base Path Track (3% Opacity) */}
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          rx={radius}
          ry={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={thickness}
          className="text-stone-900/10"
          vectorEffect="non-scaling-stroke"
        />

        {/* The Moving Rainbow LED Segment */}
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          rx={radius}
          ry={radius}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={thickness}
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
          pathLength="100"
          className="animate-artisan-perimeter-flow"
          style={{
            strokeDasharray: '15 85',
            filter: 'url(#artisan-glow)',
            animationDuration: `${speed}s`,
          }}
        />
      </svg>

      <style jsx global>{`
        @keyframes artisan-perimeter-flow {
          0% { stroke-dashoffset: 100; }
          100% { stroke-dashoffset: 0; }
        }
        .animate-artisan-perimeter-flow {
          animation: artisan-perimeter-flow linear infinite;
        }
      `}</style>
    </div>
  );
}
