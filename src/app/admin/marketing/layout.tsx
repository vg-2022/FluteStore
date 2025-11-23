'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Megaphone, Ticket } from "lucide-react";
import { cn } from "@/lib/utils";

const marketingNavItems = [
    { href: "/admin/marketing/coupons", label: "Coupons", icon: Ticket },
];

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-8 items-start">
        <aside className="md:col-span-1 sticky top-24">
             <h1 className="text-2xl font-bold mb-1 flex items-center gap-2"><Megaphone /> Marketing</h1>
             <p className="text-muted-foreground mb-6">Manage your promotional campaigns.</p>
            <nav className="flex flex-col gap-2">
            {marketingNavItems.map(item => {
                const isActive = pathname === item.href;
                return (
                <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:bg-muted hover:text-primary",
                    isActive && "bg-muted text-primary font-semibold"
                    )}
                >
                    <item.icon className="h-5 w-5" />
                    {item.label}
                </Link>
                );
            })}
            </nav>
        </aside>
        <main className="md:col-span-3 space-y-8">
            {children}
        </main>
    </div>
  );
}
