'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
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
  useSidebar,
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
  ShieldCheck,
  Lock,
  Eye,
  Search,
  Globe,
  ClipboardList,
  Images,
  PlusCircle,
  Trash2,
  Droplets,
  Calculator,
  Store,
  Wallet
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
import { getWorkspaceConfig } from '@/lib/page-colors';
import { Separator } from '@/components/ui/separator';

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/performance', icon: TrendingUp, label: 'Performance' },
  { href: '/customers', icon: Users, label: 'Customers' },
  { href: '/orders', icon: ShoppingCart, label: 'Orders' },
  { href: '/production', icon: Package, label: 'Production' },
  {
    icon: BookOpen,
    label: 'Recipes',
    subItems: [
      { href: '/recipes', icon: BookOpen, label: 'Recipe Manager' },
      { href: '/ingredients', icon: Droplets, label: 'Ingredient Library' },
    ]
  },
  {
    icon: Package,
    label: 'Products',
    subItems: [
      { href: '/products', icon: Package, label: 'Artisan Portfolio' },
      { href: '/products/bin', icon: Trash2, label: 'Product Bin' },
    ]
  },
  {
    icon: Store,
    label: 'Procurement',
    subItems: [
      { href: '/vendors', icon: Store, label: 'Vendors' },
      { href: '/material-purchase', icon: Wallet, label: 'Material Purchase' },
    ]
  },
  { href: '/photo-gallery', icon: Images, label: 'Photo Gallery' },
  { href: '/inventory', icon: Boxes, label: 'Inventory' },
  {
    icon: FileText,
    label: 'Billing & Invoices',
    subItems: [
        { href: '/gst-billing', icon: FileText, label: 'Create Invoice' },
        { href: '/invoices', icon: FileText, label: 'View Invoices' },
    ]
  },
  {
    icon: ClipboardList,
    label: 'Quotations',
    subItems: [
        { href: '/quotations/create', icon: PlusCircle, label: 'Create Quotation' },
        { href: '/quotations', icon: ClipboardList, label: 'View Quotations' },
    ]
  },
  { href: '/billing/shipping-status', icon: Truck, label: 'Dispatch Control' },
  { href: '/billing/tracking-visibility', icon: Eye, label: 'Visibility Control' },
  { href: '/distributors', icon: Truck, label: 'Distributors' },
  { href: '/broadcast', icon: Radio, label: 'Broadcasts' },
  { href: '/costing', icon: Calculator, label: 'Costing' },
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
  {
    icon: Globe,
    label: 'Optimization',
    subItems: [
      { href: '/seo-dashboard', icon: Search, label: 'SEO Intelligence' },
      { href: '/settings/firestore-rules', icon: Lock, label: 'Security Rules' },
    ],
  },
];

type User = {
  name: string;
  email: string;
  role: string;
};

function NavSidebar({ pathname }: { pathname: string }) {
  const { setOpen, isMobile } = useSidebar();
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startCollapseTimer = useCallback(() => {
    if (isMobile) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setOpen(false);
    }, 8000);
  }, [isMobile, setOpen]);

  const stopCollapseTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    startCollapseTimer();
    return () => stopCollapseTimer();
  }, [startCollapseTimer, stopCollapseTimer]);

  const handleMouseEnter = () => {
    stopCollapseTimer();
    setOpen(true);
  };

  const handleMouseLeave = () => {
    startCollapseTimer();
  };

  const isItemActive = (href: string) => {
    if (href === '/dashboard' || href === '/') {
        return pathname === href;
    }
    return pathname === href || pathname.startsWith(href + '/');
  };

  return (
    <Sidebar 
      collapsible="icon" 
      className="border-r border-sidebar-border bg-sidebar transition-all duration-300"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <SidebarHeader className="h-16 flex items-center justify-between px-4">
        <Link href="/dashboard" className="flex items-center gap-2 overflow-hidden">
          <Logo className="h-8 w-auto min-w-[120px]" />
        </Link>
        <SidebarTrigger className="hidden md:flex" />
      </SidebarHeader>
      <SidebarContent className="flex-1 overflow-y-auto">
        <SidebarMenu className="px-2 pt-4">
          {navItems.map((item) => {
            const workspace = getWorkspaceConfig(item.href || item.subItems?.[0]?.href || '');
            const isActive = item.subItems ? item.subItems.some((sub) => isItemActive(sub.href)) : isItemActive(item.href!);

            return item.subItems ? (
              <SidebarMenuItem key={item.label}>
                <SidebarMenuButton 
                  isActive={isActive}
                  style={isActive ? { color: workspace.color } : {}}
                >
                  <item.icon style={{ color: workspace.color }} />
                  <span className="font-bold">{item.label}</span>
                </SidebarMenuButton>
                <SidebarMenuSub>
                  {item.subItems.map((subItem) => {
                    const subWorkspace = getWorkspaceConfig(subItem.href);
                    const isSubActive = isItemActive(subItem.href);
                    return (
                      <SidebarMenuSubItem key={subItem.href}>
                        <SidebarMenuSubButton isActive={isSubActive} asChild>
                          <Link href={subItem.href} style={isSubActive ? { color: subWorkspace.color, fontWeight: 900 } : { color: subWorkspace.color + 'CC' }}>
                            <subItem.icon className="h-3.5 w-3.5" style={{ color: subWorkspace.color }} />
                            <span>{subItem.label}</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    );
                  })}
                </SidebarMenuSub>
              </SidebarMenuItem>
            ) : (
              <SidebarMenuItem key={item.href}>
                 <SidebarMenuButton isActive={isActive} asChild style={isActive ? { color: workspace.color } : {}}>
                  <Link href={item.href!}>
                    <item.icon style={{ color: workspace.color }} />
                    <span className="font-bold">{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-2 border-t border-sidebar-border">
         <SidebarMenu>
           <SidebarMenuItem>
              <SidebarMenuButton isActive={pathname === '/user-guide'} asChild tooltip="User Guide">
                <Link href="/user-guide" style={pathname === '/user-guide' ? { color: WORKSPACE_COLORS.optimization.color } : {}}>
                  <BookUser style={{ color: WORKSPACE_COLORS.optimization.color }} />
                  <span>User Guide</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
           <SidebarMenuItem>
              <SidebarMenuButton isActive={pathname === '/guide'} asChild tooltip="Developer Guide">
                <Link href="/guide" style={pathname === '/guide' ? { color: WORKSPACE_COLORS.optimization.color } : {}}>
                  <HelpCircle style={{ color: WORKSPACE_COLORS.optimization.color }} />
                  <span>Developer Guide</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          <SidebarMenuItem>
              <SidebarMenuButton isActive={isItemActive('/settings')} asChild tooltip="Settings">
                <Link href="/settings" style={isItemActive('/settings') ? { color: WORKSPACE_COLORS.optimization.color } : {}}>
                  <Settings style={{ color: WORKSPACE_COLORS.optimization.color }} />
                  <span>Settings</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
         </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { user: firebaseUser, loading: authLoading } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();

  const inventoryQuery = useMemo(() => (firestore ? collection(firestore, 'inventory') : null), [firestore]);
  const { data: inventoryData } = useCollection<InventoryItem>(inventoryQuery);

  const lowStockItems = inventoryData?.filter(item => item.status === 'Low Stock') || [];
  const hasLowStock = lowStockItems.length > 0;

  useEffect(() => {
    setMounted(true);
    setIsClient(true);
    try {
      const storedUserRaw = localStorage.getItem('user');
      if (storedUserRaw && storedUserRaw.trim()) {
        const parsed = JSON.parse(storedUserRaw);
        if (parsed && typeof parsed === 'object') {
          setUser(parsed);
        } else if (!pathname.includes('/login')) {
          router.replace('/login');
        }
      } else if (!pathname.includes('/login')) {
        router.replace('/login');
      }
    } catch (error) {
      console.error('Failed to parse user from localStorage:', error);
      if (!pathname.includes('/login')) {
        router.replace('/login');
      }
    }
  }, [router, pathname]);

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

  const isRestoringSession = !!user && !firebaseUser && !authLoading;
  const isAuthReady = isClient && !authLoading && !isRestoringSession && (!!firebaseUser || !user);

  return (
    <SidebarProvider>
      <NavSidebar pathname={pathname} />
      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between border-b bg-background px-4 md:px-6">
            <SidebarTrigger className="md:hidden" />
            <div className="flex flex-1 items-center justify-end gap-2 md:gap-4">
                {mounted && hasLowStock && (
                  <Button asChild variant="ghost" size="icon" className="relative h-9 w-9">
                      <Link href="/inventory" aria-label="View low stock items">
                          <Bell className="h-5 w-5 animate-bell-shake text-yellow-500" />
                          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white">
                              {lowStockItems.length}
                          </span>
                      </Link>
                  </Button>
                )}
                {mounted && user?.role && (
                  <Badge variant="secondary" className="hidden xs:inline-flex px-2 py-0 h-6 text-[10px] uppercase font-bold tracking-wider">
                    {user.role}
                  </Badge>
                )}
                
                <Separator orientation="vertical" className="h-8 mx-2 hidden sm:block opacity-10" />

                {mounted ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="relative h-9 w-9 md:h-10 md:w-10 rounded-full" disabled={!user}>
                        <Avatar className="h-9 w-9 md:h-10 md:w-10">
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
                            <p className="text-[10px] font-bold text-primary xs:hidden uppercase mt-1 tracking-widest">{user.role}</p>
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
                ) : (
                  <div className="h-9 w-9 md:h-10 md:w-10 rounded-full bg-muted animate-pulse" />
                )}
            </div>
        </header>
        <div className="flex-1 bg-background overflow-y-auto">
            <div className="p-4 sm:p-6 lg:p-8 pt-12 md:pt-16 lg:pt-20">
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
