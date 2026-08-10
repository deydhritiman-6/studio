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
    <div className={cn("flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4", className)}>
      <div className="flex items-center gap-4">
        {/* Striking Rounded Vertical Indicator */}
        <div 
          className="w-1.5 h-9 rounded-full shrink-0 shadow-sm" 
          style={{ backgroundColor: workspace.color }}
        />
        <h1 
          className="text-3xl md:text-4xl font-bold font-headline tracking-tight"
          style={{ color: workspace.color }}
        >
          {title}
        </h1>
      </div>
      {actions && (
        <div className="flex items-center gap-2 w-full md:w-auto [&>button]:w-full md:[&>button]:w-auto">
          {actions}
        </div>
      )}
    </div>
  );
}
