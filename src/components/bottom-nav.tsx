
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, ShoppingBag, ShoppingCart, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCart } from './cart-provider';
import { Badge } from './ui/badge';

const navItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/products', label: 'Shop', icon: ShoppingBag },
  { href: '/cart', label: 'Cart', icon: ShoppingCart },
  { href: '/account', label: 'Account', icon: User },
];

export function BottomNav() {
  const pathname = usePathname();
  const { cartCount } = useCart();

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 h-20 bg-background/80 backdrop-blur-sm z-50 flex justify-center items-center p-4">
      <nav className="flex w-full max-w-sm items-center justify-around p-1 bg-background border rounded-full shadow-lg">
        {navItems.map((item) => {
          const isActive = (item.href === '/' && pathname === '/') || (item.href !== '/' && pathname.startsWith(item.href));
          const finalHref = item.href;
          
          return (
            <Link key={item.label} href={finalHref} className="relative">
              <div
                className={cn(
                  'flex flex-col items-center justify-center gap-1 w-14 h-14 rounded-full transition-colors duration-200',
                  isActive ? 'text-primary' : 'text-muted-foreground hover:text-primary'
                )}
              >
                <item.icon className="h-6 w-6" />
                {item.label === 'Cart' && cartCount > 0 && (
                  <Badge variant="destructive" className="absolute top-1 right-1 h-4 w-4 justify-center p-0 text-xs">{cartCount}</Badge>
                )}
              </div>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
