import Image from 'next/image';
import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
}

export function Logo({ className }: LogoProps) {
  return (
    <div className={cn("relative aspect-[4/1] w-[200px]", className)}>
      <Image
        src="/Roseberry Logo.jpeg"
        alt="Roseberry Chocolate Logo"
        fill
        className="object-contain"
        priority
      />
    </div>
  );
}
