import type { SVGProps } from "react";

export function Logo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 320 50"
      width="180"
      height="30"
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
      <text
        x="10"
        y="35"
        fontFamily="var(--font-playfair-display), serif"
        fontSize="30"
        fontWeight="bold"
        fill="url(#vibrant-gradient)"
        className="font-headline"
      >
        Roseberry Chocolate
      </text>
    </svg>
  );
}
