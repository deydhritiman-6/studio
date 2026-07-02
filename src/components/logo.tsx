import type { SVGProps } from "react";

export function Logo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 450 60"
      width="240"
      height="40"
      aria-label="Roseberry Chocolate Logo"
      {...props}
    >
      <defs>
        <linearGradient id="vibrant-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="hsl(var(--accent))">
             <animate attributeName="stop-color" values="hsl(var(--accent));hsl(var(--primary));hsl(var(--accent))" dur="4s" repeatCount="indefinite" />
          </stop>
          <stop offset="100%" stopColor="hsl(var(--primary))">
             <animate attributeName="stop-color" values="hsl(var(--primary));hsl(var(--accent));hsl(var(--primary))" dur="4s" repeatCount="indefinite" />
          </stop>
        </linearGradient>
      </defs>
      <g className="animate-logo-float">
        <text
          x="50%"
          y="45"
          textAnchor="middle"
          fontFamily="var(--font-playfair-display), serif"
          fontSize="46"
          fontWeight="bold"
          fill="url(#vibrant-gradient)"
          className="font-headline"
        >
          Roseberry Chocolate
        </text>
      </g>
    </svg>
  );
}