

"use client";

import Link from "next/link";
import {
  Search,
  ShoppingCart,
  User,
  Menu,
  Heart,
  LogOut,
  Settings,
  ShoppingBag,
  MapPin,
  ChevronDown,
  Bell,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Logo } from "@/components/icons/logo";
import { useCart } from "./cart-provider";
import { SearchDialog } from "./search-dialog";
import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Input } from "./ui/input";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { NotificationBell } from "./notification-bell";
import { useSettings } from "@/app/admin/settings/_components/settings-provider";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/products", label: "Shop" },
  { href: "/wishlist", label: "Wishlist" },
  { href: "/about#contact", label: "Contact Us" },
];

interface HeaderProps {
  user: SupabaseUser | null;
  loading: boolean;
  onSignOut: () => void;
}

export function Header({ user, loading, onSignOut }: HeaderProps) {
  const { cartCount } = useCart();
  const [openSearch, setOpenSearch] = React.useState(false);
  const pathname = usePathname();
  const { storeDetails, isLoading: isLoadingSettings } = useSettings();

  const [lastScrollY, setLastScrollY] = useState(0);
  const [showHeader, setShowHeader] = useState(true);

  const storeName = storeDetails?.name || "FluteStore";
  const logo = storeDetails?.logo;

  useEffect(() => {
    const controlNavbar = () => {
        if (window.scrollY > lastScrollY && window.scrollY > 100) { // if scroll down hide the navbar
            setShowHeader(false);
        } else { // if scroll up show the navbar
            setShowHeader(true);
        }
        setLastScrollY(window.scrollY);
    };

    window.addEventListener('scroll', controlNavbar);
    return () => {
        window.removeEventListener('scroll', controlNavbar);
    };
  }, [lastScrollY]);

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpenSearch((open) => !open)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])
  
  if (loading || isLoadingSettings) {
    return <header className="sticky top-0 z-50 w-full h-16 bg-background/80 backdrop-blur-sm"></header>;
  }


  return (
    <>
      <header className={cn("sticky top-0 z-50 w-full bg-background/80 backdrop-blur-sm transition-transform duration-300", !showHeader && "-translate-y-full")}>
        <div className="container flex h-16 items-center">
            <div className="flex items-center gap-2">
              <Link href="/" className="flex items-center gap-2">
                {logo ? <Image src={logo} alt="Logo" width={32} height={32} className="h-8 w-8 object-contain" /> : <Logo className="h-8 w-8 text-primary" />}
                <span className="font-bold sm:inline-block">{storeName}</span>
              </Link>
            </div>

            <div className="flex-1 flex justify-center md:hidden px-4">
                <div className="relative w-full max-w-sm" onClick={() => setOpenSearch(true)}>
                    <Input type="search" placeholder="Search..." className="w-full pl-10 cursor-pointer" />
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                </div>
            </div>
            
            <div className="hidden flex-1 md:flex justify-center">
               <nav className="p-1 bg-background border rounded-full shadow-sm">
                 <div className="flex items-center gap-2 text-sm lg:gap-4">
                   {navLinks.map((link) => {
                    const isActive = pathname === link.href;
                    return (
                      <Link
                        key={link.label}
                        href={link.href}
                        className={cn(
                          "transition-colors hover:text-foreground/80 px-3 py-1.5 rounded-full",
                          isActive ? "bg-muted text-foreground font-semibold" : "text-foreground/60",
                          )}
                      >
                        {link.label}
                      </Link>
                  )})}
                 </div>
               </nav>
            </div>
          
          <div className="flex items-center justify-end space-x-2">
            <nav className="flex items-center p-1 bg-background border rounded-full shadow-sm">
                <Button variant="ghost" size="icon" className="rounded-full hidden sm:flex" onClick={() => setOpenSearch(true)}>
                    <Search className="h-5 w-5" />
                    <span className="sr-only">Search</span>
                </Button>
                <ThemeToggle />
                {user && <NotificationBell />}
                <Button asChild variant="ghost" size="icon" className="relative rounded-full">
                    <Link href="/wishlist">
                        <Heart className="h-5 w-5" />
                        <span className="sr-only">Wishlist</span>
                    </Link>
                </Button>
                <Button asChild variant="ghost" size="icon" className="relative rounded-full hidden md:flex">
                    <Link href="/cart">
                        <ShoppingCart className="h-5 w-5" />
                        {cartCount > 0 && <Badge variant="destructive" className="absolute -right-1 -top-1 h-4 w-4 justify-center p-0 text-xs">{cartCount}</Badge>}
                        <span className="sr-only">Cart</span>
                    </Link>
                </Button>

                {user ? (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src={user.user_metadata?.avatar_url} alt={user.user_metadata?.first_name || user.email} />
                                    <AvatarFallback>{user.user_metadata?.first_name?.[0] || user.email?.[0]}</AvatarFallback>
                                </Avatar>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56" align="end" forceMount>
                            <DropdownMenuLabel className="font-normal">
                                <div className="flex flex-col space-y-1">
                                    <p className="text-sm font-medium leading-none">{user.user_metadata?.first_name} {user.user_metadata?.last_name}</p>
                                    <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                                <Link href="/account"><User className="mr-2 h-4 w-4" />Profile</Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <Link href="/account/orders"><ShoppingBag className="mr-2 h-4 w-4" />Orders</Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <Link href="/account/addresses"><MapPin className="mr-2 h-4 w-4" />Addresses</Link>
                            </DropdownMenuItem>
                             <DropdownMenuItem asChild>
                                <Link href="/wishlist"><Heart className="mr-2 h-4 w-4" />Wishlist</Link>
                            </DropdownMenuItem>
                            {user.user_metadata?.is_admin && (
                                <DropdownMenuItem asChild>
                                    <Link href="/admin"><Settings className="mr-2 h-4 w-4" />Admin Dashboard</Link>
                                </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={onSignOut}>
                                <LogOut className="mr-2 h-4 w-4" />
                                Sign Out
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                ) : (
                    <>
                     <Link href="/account" className="hidden sm:inline-block">
                        <Button variant="ghost" size="sm" className="rounded-full">Sign In</Button>
                    </Link>
                    <Link href="/account" className="sm:hidden">
                        <Button variant="ghost" size="icon" className="rounded-full">
                           <User className="h-5 w-5" />
                           <span className="sr-only">Sign In</span>
                        </Button>
                    </Link>
                    </>
                )}
            </nav>
          </div>
        </div>
      </header>
      <SearchDialog open={openSearch} onOpenChange={setOpenSearch} />
    </>
  );
}
