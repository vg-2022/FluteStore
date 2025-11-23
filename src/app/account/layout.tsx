
'use client';
import Link from "next/link";
import { usePathname } from "next/navigation";
import { User, ShoppingBag, MapPin, LogOut, Menu, Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import React from "react";
import { AnimateOnScroll } from "@/components/animate-on-scroll";
import { Skeleton } from "@/components/ui/skeleton";
import { AuthForm } from "./_components/auth-form";
import { createClient } from "@/lib/supabase/client";
import { AccountProvider, useAccount } from "./_components/account-provider";

const navItems = [
    { href: "/account", label: "Profile", icon: User },
    { href: "/account/orders", label: "Orders", icon: ShoppingBag },
    { href: "/account/addresses", label: "Addresses", icon: MapPin },
    { href: "/wishlist", label: "Wishlist", icon: Heart },
];

function AccountLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const supabase = createClient();
  const [isSheetOpen, setIsSheetOpen] = React.useState(false);

  const { user, loading } = useAccount();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    // onAuthStateChange in provider will handle the user state update
  };

  const handleLinkClick = () => {
    setIsSheetOpen(false);
  };
  
  if (loading) {
    return (
        <div className="container mx-auto px-4 md:px-6 py-12">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                <aside className="hidden md:block md:col-span-1">
                    <Skeleton className="h-48 w-full" />
                </aside>
                <main className="md:col-span-3">
                    <Skeleton className="h-96 w-full" />
                </main>
            </div>
        </div>
    );
  }

  const navContent = (
    <nav className="flex flex-col gap-2 p-4 border rounded-lg animate-fade-in-up">
      {navItems.map(item => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={handleLinkClick}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
              isActive && "bg-muted text-primary font-semibold"
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
      <button
        onClick={handleSignOut}
        className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary border-t mt-2 pt-3 text-left"
      >
        <LogOut className="h-4 w-4" />
        Sign Out
      </button>
    </nav>
  );

  return (
    <div className="container mx-auto px-4 md:px-6 py-12">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {user && (
            <aside className="hidden md:block md:col-span-1">
                <AnimateOnScroll>
                    {navContent}
                </AnimateOnScroll>
            </aside>
        )}
        <main className={cn(user ? "md:col-span-3" : "md:col-span-4")}>
           <div className="md:hidden mb-4">
              {user && (
                 <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                    <SheetTrigger asChild>
                        <Button variant="outline"><Menu className="mr-2 h-4 w-4" /> Account Menu</Button>
                    </SheetTrigger>
                    <SheetContent side="left">
                        <SheetHeader>
                            <SheetTitle>Account Menu</SheetTitle>
                        </SheetHeader>
                        <div className="mt-4">
                        {navContent}
                        </div>
                    </SheetContent>
                </Sheet>
              )}
           </div>
          {user ? children : <AuthForm />}
        </main>
      </div>
    </div>
  );
}


export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
    return (
        <AccountProvider>
            <AccountLayoutContent>{children}</AccountLayoutContent>
        </AccountProvider>
    )
}
