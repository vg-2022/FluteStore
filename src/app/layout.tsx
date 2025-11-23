
import type { Metadata } from 'next';
import './globals.css';
import { cn } from '@/lib/utils';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/toaster';
import { CartProvider } from '@/components/cart-provider';
import { OrderProvider } from '@/components/order-provider';
import { WishlistProvider } from '@/components/wishlist-provider';
import { AppLayout } from '@/components/app-layout';
import Script from 'next/script';
import { SettingsProvider } from './admin/settings/_components/settings-provider';

export const metadata: Metadata = {
  title: 'FluteStore Online',
  description: 'The finest collection of flutes from around the world.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700&family=Playfair+Display:wght@400..900&display=swap" rel="stylesheet" />
        <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      </head>
      <body
        className={cn(
          'min-h-screen bg-background font-body antialiased',
        )}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <SettingsProvider>
            <WishlistProvider>
              <CartProvider>
                <OrderProvider>
                  <AppLayout>{children}</AppLayout>
                  <Toaster />
                </OrderProvider>
              </CartProvider>
            </WishlistProvider>
          </SettingsProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
