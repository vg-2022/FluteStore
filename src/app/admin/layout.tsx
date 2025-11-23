
'use client';
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Home, Package, Users, BarChart, Settings, MessagesSquare, ShoppingCart, Search, Menu, Palette, Megaphone } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import React, { useEffect, useState } from "react";
import { AnimateOnScroll } from "@/components/animate-on-scroll";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import { Logo } from "@/components/icons/logo";
import { Skeleton } from "@/components/ui/skeleton";
import { NotificationBell } from "@/components/notification-bell";
import { SettingsProvider, useSettings } from "./settings/_components/settings-provider";
import Image from "next/image";

const topNavItems = [
    { href: "/admin", label: "Dashboard", icon: Home },
    { href: "/admin/products", label: "Products", icon: Package },
    { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
    { href: "/admin/users", label: "Customers", icon: Users },
    { href: "/admin/marketing", label: "Marketing", icon: Megaphone },
    { href: "/admin/reviews", label: "Reviews", icon: MessagesSquare },
    { href: "/admin/attributes", label: "Attributes", icon: Palette },
];

const bottomNavItems = [
    { href: "/admin/settings", label: "Settings", icon: Settings },
]

function AdminLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isSheetOpen, setIsSheetOpen] = React.useState(false);
  const { storeDetails, isLoading: isLoadingSettings } = useSettings();

  const handleLinkClick = () => {
    setIsSheetOpen(false);
  };
  
  const getPageTitle = () => {
    const allNavItems = [...topNavItems, ...bottomNavItems];
    const currentItem = allNavItems.find(item => pathname.startsWith(item.href));
    if (pathname === '/admin') return "Dashboard";
    return currentItem ? currentItem.label : "Admin";
  }
  
  const storeName = storeDetails?.name || "Dashboard";
  const logo = storeDetails?.logo;

  const SidebarHeaderContent = () => (
     <Link href="/admin" className="flex items-center gap-2 font-semibold text-lg">
        {logo ? (
            <Image src={logo} alt={storeName} width={24} height={24} className="h-6 w-6 object-contain" />
        ) : (
            <Logo className="h-6 w-6 text-primary" />
        )}
        <span>{storeName}</span>
    </Link>
  );

  const navContent = (
    <nav className="flex flex-col gap-2 p-4 flex-1">
        <p className="px-3 py-2 text-xs font-semibold text-muted-foreground/80">Menu</p>
      {topNavItems.map(item => {
        const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={handleLinkClick}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:bg-primary/10 hover:text-primary",
              isActive && "bg-primary/10 text-primary font-bold"
            )}
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </Link>
        );
      })}
       <div className="flex-grow" />
        <p className="px-3 py-2 text-xs font-semibold text-muted-foreground/80">General</p>
         {bottomNavItems.map(item => {
        const isActive = pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
             onClick={handleLinkClick}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:bg-primary/10 hover:text-primary",
              isActive && "bg-primary/10 text-primary font-bold"
            )}
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="grid min-h-screen w-full lg:grid-cols-[280px_1fr] dark">
       <aside className="hidden border-r bg-sidebar text-sidebar-foreground lg:block">
        <div className="flex h-full max-h-screen flex-col gap-2">
            <div className="flex h-[60px] items-center border-b px-6">
                {isLoadingSettings ? <Skeleton className="h-6 w-32" /> : <SidebarHeaderContent />}
            </div>
            <div className="flex-1 overflow-auto py-2">
                {navContent}
            </div>
        </div>
       </aside>
       <div className="flex flex-col bg-background text-foreground">
        <header className="flex h-14 lg:h-[60px] items-center gap-4 border-b bg-card px-6">
           <div className="lg:hidden">
              <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                  <SheetTrigger asChild>
                      <Button variant="outline" size="icon"><Menu className="h-5 w-5" /></Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="p-0 w-72">
                      <SheetHeader>
                        <SheetTitle className="sr-only">Admin Menu</SheetTitle>
                      </SheetHeader>
                        <div className="flex h-[60px] items-center border-b px-6">
                             {isLoadingSettings ? <Skeleton className="h-6 w-32" /> : <SidebarHeaderContent />}
                        </div>
                      <div className="mt-4">
                        {navContent}
                      </div>
                  </SheetContent>
              </Sheet>
           </div>
            <div className="flex-1">
                <h1 className="font-semibold text-lg">
                    {getPageTitle()}
                </h1>
            </div>
            <div className="flex items-center gap-4">
                 <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input type="search" placeholder="Search..." className="pl-10 bg-background h-9"/>
                 </div>
                 <NotificationBell />
            </div>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6 bg-background">
            <AnimateOnScroll>
                {children}
            </AnimateOnScroll>
        </main>
       </div>
    </div>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !user.user_metadata?.is_admin) {
        router.replace('/');
      } else {
        setUser(user);
        setLoading(false);
      }
    };
    checkUser();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_OUT' || !session?.user?.user_metadata?.is_admin) {
             router.replace('/');
        }
    });

    return () => subscription.unsubscribe();
  }, [router, supabase.auth]);
  
  if (loading) {
    return (
        <div className="flex items-center justify-center h-screen">
            <div className="space-y-4 text-center">
                <Skeleton className="h-12 w-12 rounded-full mx-auto" />
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-64" />
            </div>
        </div>
    );
  }

  if (!user) {
    return null; // The redirect is happening, this prevents flicker
  }

  return (
    <SettingsProvider>
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </SettingsProvider>
  );
}
