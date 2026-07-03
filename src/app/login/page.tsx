'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Logo } from '@/components/logo';
import { ShieldCheck, UserCog, Utensils } from 'lucide-react';

export default function LoginPortalPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background p-4">
        <Card className="w-full max-w-md shadow-2xl border-border rounded-[2rem] animate-pulse">
          <div className="h-[400px] w-full" />
        </Card>
      </div>
    );
  }

  const loginRoutes = [
    {
      href: '/login/admin',
      label: 'Super Admin',
      description: 'Full system control and analytics.',
      icon: ShieldCheck,
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
    {
      href: '/login/manager',
      label: 'Store Manager',
      description: 'Manage inventory, staff, and daily ops.',
      icon: UserCog,
      color: 'text-accent',
      bg: 'bg-accent/10',
    },
    {
      href: '/login/staff',
      label: 'Kitchen Staff',
      description: 'Access production logs and recipes.',
      icon: Utensils,
      color: 'text-orange-500',
      bg: 'bg-orange-500/10',
    },
  ];

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-md shadow-2xl border-border rounded-[2rem] overflow-hidden">
        <CardHeader className="text-center space-y-4 pt-10 pb-6 border-b">
          <div className="flex justify-center">
            <Logo className="h-12" />
          </div>
          <CardTitle className="font-headline text-3xl tracking-tight">Access Portal</CardTitle>
          <CardDescription className="text-muted-foreground font-light">Select your role to reach your workspace.</CardDescription>
        </CardHeader>
        <CardContent className="p-8 space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {loginRoutes.map((route) => (
              <Link key={route.href} href={route.href}>
                <div className="flex items-center p-4 rounded-2xl border-2 border-muted hover:border-primary hover:bg-muted/50 transition-all group">
                  <div className={`h-12 w-12 rounded-xl ${route.bg} flex items-center justify-center mr-4 group-hover:scale-110 transition-transform`}>
                    <route.icon className={`h-6 w-6 ${route.color}`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-black uppercase tracking-tight">{route.label}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{route.description}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
