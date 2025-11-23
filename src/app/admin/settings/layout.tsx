
'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Settings, Home, Info, ShoppingBag, HardDrive, Truck, MessageSquareText, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { SettingsProvider } from "./_components/settings-provider";

const settingsNavItems = [
    { href: "/admin/settings/general", label: "General", icon: Settings },
    { href: "/admin/settings/homepage", label: "Homepage", icon: Home },
    { href: "/admin/settings/footer", label: "Footer", icon: MessageSquareText },
    { href: "/admin/settings/about", label: "About Page", icon: Info },
    { href: "/admin/settings/faq", label: "FAQ", icon: HelpCircle },
    { href: "/admin/settings/pdp", label: "Product Page", icon: ShoppingBag },
    { href: "/admin/settings/shipping", label: "Shipping", icon: Truck },
    { href: "/admin/settings/storage", label: "Storage", icon: HardDrive },
];

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
     <SettingsProvider>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 items-start">
            <aside className="md:col-span-1 sticky top-24">
                 <h1 className="text-2xl font-bold mb-1">Store Settings</h1>
                 <p className="text-muted-foreground mb-6">Manage your store's appearance and content.</p>
                <nav className="flex flex-col gap-2">
                {settingsNavItems.map(item => {
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
    </SettingsProvider>
  );
}
