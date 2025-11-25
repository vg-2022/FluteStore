"use client";

import {
  Bell,
  Home,
  LineChart,
  Package,
  ShoppingCart,
  Users,
  PanelLeft,
  Settings,
  Ticket,
  Palette,
  Star,
  User as UserIcon,
  LogOut,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import React, { useState, useEffect } from "react";
import { Logo } from "@/components/icons/logo";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";
import { useSettings } from "./settings/_components/settings-provider";
import type { User } from "@supabase/supabase-js";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/theme-toggle";
import { NotificationBell } from "@/components/notification-bell";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: Home, exact: true },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/users", label: "Customers", icon: Users },
  { href: "/admin/reviews", label: "Reviews", icon: Star },
  { href: "/admin/attributes", label: "Attributes", icon: Palette },
  { href: "/admin/marketing", label: "Marketing", icon: Ticket },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [isSheetOpen, setIsSheetOpen] = React.useState(false);
  const { storeDetails, isLoading: isLoadingSettings } = useSettings();
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.push("/account");
      }
      setCurrentUser(user);
    });
  }, [router, supabase.auth]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const navContent = (
    <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
      {navItems.map((item) => {
        const isActive = item.exact
          ? pathname === item.href
          : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setIsSheetOpen(false)}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
              isActive && "bg-muted text-primary"
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <div className="hidden border-r bg-muted/40 md:block">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
            <Link
              href="/admin"
              className="flex items-center gap-2 font-semibold"
            >
              {storeDetails?.logo ? (
                <Image
                  src={storeDetails.logo}
                  alt="logo"
                  width={24}
                  height={24}
                  className="h-6 w-6 object-contain"
                />
              ) : (
                <Logo className="h-6 w-6 text-primary" />
              )}
              <span>{storeDetails?.name || "Admin"}</span>
            </Link>
          </div>
          <div className="flex-1">{navContent}</div>
        </div>
      </div>
      <div className="flex flex-col">
        <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="shrink-0 md:hidden"
              >
                <PanelLeft className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col">
              <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
                <Link
                  href="/admin"
                  className="flex items-center gap-2 font-semibold"
                  onClick={() => setIsSheetOpen(false)}
                >
                  {storeDetails?.logo ? (
                    <Image
                      src={storeDetails.logo}
                      alt="logo"
                      width={24}
                      height={24}
                      className="h-6 w-6 object-contain"
                    />
                  ) : (
                    <Logo className="h-6 w-6 text-primary" />
                  )}
                  <span>{storeDetails?.name || "Admin"}</span>
                </Link>
              </div>
              <div className="flex-1 overflow-auto py-2">{navContent}</div>
            </SheetContent>
          </Sheet>
          <div className="w-full flex-1" />
          <Button variant="outline" size="sm" asChild>
            <Link href="/" target="_blank">
              <ExternalLink className="mr-2 h-4 w-4" /> View Live Site
            </Link>
          </Button>
          <ThemeToggle />
          <NotificationBell />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="icon" className="rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={currentUser?.user_metadata?.avatar_url} />
                  <AvatarFallback>
                    {currentUser?.email?.[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="sr-only">Toggle user menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/admin/profile">Profile</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/admin/settings">Settings</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
