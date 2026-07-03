'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import React, { useEffect, useState, useMemo } from 'react';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarTrigger,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@/components/ui/sidebar';
import {
  LayoutDashboard,
  Users,
  ShoppingCart,
  BookOpen,
  Package,
  Boxes,
  FileText,
  Megaphone,
  Gem,
  Truck,
  BarChart,
  Settings,
  BrainCircuit,
  Lightbulb,
  HelpCircle,
  BookUser,
  LogOut,
  Bell,
  TrendingUp,
  Radio,
} from 'lucide-react';
import { Logo } from '@/components/logo';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useUser, useFirestore, useCollection, useAuth } from '@/firebase';
import { collection } from 'firebase/firestore';
import { signInAnonymously } from 'firebase/auth';
import type { InventoryItem } from '@/lib/types';

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/performance', icon: TrendingUp, label: 'Performance' },
  { href: '/customers', icon: Users, label: 'Customers' },
  { href: '/orders', icon: ShoppingCart, label: 'Orders' },
  { href: '/production', icon: Package, label: 'Production' },
  { href: '/recipes', icon: BookOpen, label: 'Recipes' },
  { href: '/products', icon: Package, label: 'Products' },
  { href: '/inventory', icon: Boxes, label: 'Inventory' },
  { href: '/invoices', icon: FileText, label: 'Invoices' },
  { href: '/gst-billing', icon: FileText, label: 'Billing' },
  { href: '/distributors', icon: Truck, label: 'Distributors' },
  { href: '/broadcast', icon: Radio, label: 'Broadcasts' },
  {
    icon: BrainCircuit,
    label: 'AI System',
    subItems: [
      { href: '/ai/recommendations', icon: Lightbulb, label: 'Recommendations' },
      { href: '/analytics', icon: BarChart, label: 'Demand Forecasting' },
      { href: '/marketing', icon: Megaphone, label: 'Marketing Copy' },
      { href: '/vip-clients', icon: Gem, label: 'VIP Insights' },
    ],
  },
];

type User = {
  name: string;
  email: string;
  role: string;
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isClient, setIsClient] = useState(false);
  const { user: firebaseUser, loading: authLoading } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();

  const inventoryQuery = useMemo(() => (firestore ? collection(firestore, 'inventory') : null), [firestore]);
  const { data: inventoryData } = useCollection<InventoryItem>(inventoryQuery);

  const lowStockItems = inventoryData?.filter(item => item.status === 'Low Stock') || [];
  const hasLowStock = lowStockItems.length > 0;

  useEffect(() => {
    setIsClient(true);
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser && storedUser !== 'undefined' && storedUser !== '') {
        setUser(JSON.parse(storedUser));
      } else if (!pathname.includes('/login')) {
        router.replace('/login');
      }
    } catch (error) {
      console.error('Failed to parse user from localStorage:', error);
      router.replace('/login');
    }
  }, [router, pathname]);

  // Ensure session is restored on refresh if we have a local identity
  useEffect(() => {
    if (!auth || authLoading || firebaseUser) return;
    if (user && !firebaseUser) {
      signInAnonymously(auth).catch((err) => console.error("Session restoration failed:", err));
    }
  }, [auth, authLoading, firebaseUser, user]);

  const handleLogout = () => {
    if (auth) auth.signOut();
    localStorage.removeItem('user');
    setUser(null);
    router.push('/login');
  };

  // Crucial: Wait for Firebase Auth to settle and restore the user session before showing protected data pages
  // This prevents race conditions where Firestore listeners start before the auth token is available.
  const isAuthReady = isClient && !authLoading && (!user || !!firebaseUser);

  return (
    <SidebarProvider>
      <Sidebar
        collapsible="icon"
        className="border-r border-sidebar-border bg-sidebar"
      >
        <SidebarHeader className="h-16 flex items-center justify-between px-4">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Logo />
          </Link>
          <SidebarTrigger className="hidden md:flex" />
        </SidebarHeader>
        <SidebarContent className="flex-1 overflow-y-auto">
          <SidebarMenu className="px-2">
            {navItems.map((item) =>
              item.subItems ? (
                <SidebarMenuItem key={item.label}>
                  <SidebarMenuButton
                    isActive={item.subItems.some((sub) => pathname.startsWith(sub.href))}
                  >
                    <item.icon />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                  <SidebarMenuSub>
                    {item.subItems.map((subItem) => (
                      <SidebarMenuSubItem key={subItem.href}>
                        <SidebarMenuSubButton
                          isActive={pathname === subItem.href}
                          asChild
                        >
                          <Link href={subItem.href}>
                            <subItem.icon />
                            <span>{subItem.label}</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </SidebarMenuItem>
              ) : (
                <SidebarMenuItem key={item.href}>
                   <SidebarMenuButton
                    isActive={pathname === item.href}
                    asChild
                  >
                    <Link href={item.href}>
                      <item.icon />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            )}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="p-2 border-t border-sidebar-border">
           <SidebarMenu>
             <SidebarMenuItem>
                <SidebarMenuButton isActive={pathname === '/user-guide'} asChild>
                  <Link href="/user-guide">
                    <BookUser />
                    <span>User Guide</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
             <SidebarMenuItem>
                <SidebarMenuButton isActive={pathname === '/guide'} asChild>
                  <Link href="/guide">
                    <HelpCircle />
                    <span>Developer Guide</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            <SidebarMenuItem>
                <SidebarMenuButton isActive={pathname === '/settings'} asChild>
                  <Link href="/settings">
                    <Settings />
                    <span>Settings</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
           </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between border-b bg-background px-6">
            <SidebarTrigger className="md:hidden" />
            <div className="flex flex-1 items-center justify-end gap-4">
                {hasLowStock && (
                  <Button asChild variant="ghost" size="icon" className="relative">
                      <Link href="/inventory" aria-label="View low stock items">
                          <Bell className="h-6 w-6 animate-bell-shake text-yellow-500" />
                          <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-xs font-bold text-white">
                              {lowStockItems.length}
                          </span>
                      </Link>
                  </Button>
                )}
                {user?.role && <Badge variant="secondary">{user.role}</Badge>}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="relative h-10 w-10 rounded-full" disabled={!user}>
                        <Avatar className="h-10 w-10">
                            <AvatarImage src="https://picsum.photos/seed/avatar/100/100" />
                            <AvatarFallback>{user?.name?.charAt(0).toUpperCase() || '?'}</AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    {user && (
                      <DropdownMenuContent className="w-56" align="end" forceMount>
                        <DropdownMenuLabel className="font-normal">
                          <div className="flex flex-col space-y-1">
                            <p className="text-sm font-medium leading-none">{user.name}</p>
                            <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                          </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleLogout}>
                          <LogOut className="mr-2 h-4 w-4" />
                          <span>Log out</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    )}
                  </DropdownMenu>
            </div>
        </header>
        <div className="flex-1 bg-background overflow-y-auto">
            <div className="p-6 lg:p-8">
              {isAuthReady && user ? children : (
                <div className="space-y-6">
                  <Skeleton className="h-10 w-64" />
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <Skeleton className="h-32" />
                    <Skeleton className="h-32" />
                    <Skeleton className="h-32" />
                    <Skeleton className="h-32" />
                  </div>
                  <Skeleton className="h-80 w-full" />
                </div>
              )}
            </div>
        </div>
      </div>
    </SidebarProvider>
  );
}