'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { getWorkspaceConfig } from '@/lib/page-colors';

type PageHeaderProps = {
  title: string;
  actions?: ReactNode;
  className?: string;
};

export function PageHeader({ title, actions, className }: PageHeaderProps) {
  const pathname = usePathname();
  const workspace = getWorkspaceConfig(pathname || '');

  return (
    <div className={cn("flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4", className)}>
      <div className="flex items-center gap-3">
        <div 
          className="w-1.5 h-8 rounded-full shrink-0" 
          style={{ backgroundColor: workspace.color }}
        />
        <h1 
          className="text-2xl md:text-3xl font-bold font-headline"
          style={{ color: workspace.color }}
        >
          {title}
        </h1>
      </div>
      {actions && <div className="flex items-center gap-2 w-full md:w-auto [&>button]:w-full md:[&>button]:w-auto">{actions}</div>}
    </div>
  );
}
