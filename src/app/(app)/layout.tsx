'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
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
} from 'lucide-react';
import { Logo } from '@/components/logo';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/customers', icon: Users, label: 'Customers' },
  { href: '/orders', icon: ShoppingCart, label: 'Orders' },
  { href: '/production', icon: Package, label: 'Production' },
  { href: '/recipes', icon: BookOpen, label: 'Recipes' },
  { href: '/products', icon: Package, label: 'Products' },
  { href: '/inventory', icon: Boxes, label: 'Inventory' },
  { href: '/invoices', icon: FileText, label: 'Invoices' },
  { href: '/distributors', icon: Truck, label: 'Distributors' },
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
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      } else {
        router.replace('/login');
      }
    } catch (error) {
      router.replace('/login');
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
    router.push('/login');
  };

  if (!isClient || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background p-2">
        <div className="flex h-full w-full">
            <Skeleton className="hidden md:block md:w-[16rem] h-full" />
            <div className="flex-1 p-6 lg:p-8">
                <Skeleton className="h-10 w-64 mb-6" />
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                  <Skeleton className="h-28" />
                  <Skeleton className="h-28" />
                  <Skeleton className="h-28" />
                  <Skeleton className="h-28" />
                </div>
                 <div className="grid gap-6 mt-6 md:grid-cols-2 lg:grid-cols-7">
                    <Skeleton className="lg:col-span-4 h-80" />
                    <Skeleton className="lg:col-span-3 h-80" />
                 </div>
            </div>
        </div>
      </div>
    );
  }

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
          <SidebarTrigger />
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
              <SidebarMenuItem>
                 <SidebarMenuButton>
                    <Avatar className="h-8 w-8">
                        <AvatarImage src="https://picsum.photos/seed/avatar/100/100" />
                        <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                        <span className="font-semibold text-sm">{user.name}</span>
                        <span className="text-xs text-muted-foreground">{user.email}</span>
                    </div>
                 </SidebarMenuButton>
              </SidebarMenuItem>
               <SidebarMenuItem>
                <SidebarMenuButton onClick={handleLogout}>
                  <LogOut />
                  <span>Logout</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
           </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <main className="flex-1 bg-background">
        <div className="p-6 lg:p-8">{children}</div>
      </main>
    </SidebarProvider>
  );
}
