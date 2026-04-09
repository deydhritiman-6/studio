import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type PageHeaderProps = {
  title: string;
  actions?: ReactNode;
  className?: string;
};

export function PageHeader({ title, actions, className }: PageHeaderProps) {
  return (
    <div className={cn("flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4", className)}>
      <h1 className="text-2xl md:text-3xl font-bold font-headline text-foreground">
        {title}
      </h1>
      {actions && <div className="flex items-center gap-2 w-full md:w-auto [&>button]:w-full md:[&>button]:w-auto">{actions}</div>}
    </div>
  );
}
