
'use client';

import { useWishlist } from '@/components/wishlist-provider';
import { getProducts } from '@/lib/products';
import { ProductCard } from '@/components/product-card';
import { AnimateOnScroll } from '@/components/animate-on-scroll';
import { Product } from '@/lib/types';
import { useEffect, useState } from 'react';
import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { createClient } from '@/lib/supabase/client';
import type { User as SupabaseUser } from '@supabase/supabase-js';

function WishlistPageSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="aspect-square w-full" />
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-5 w-1/2" />
        </div>
      ))}
    </div>
  );
}

export default function WishlistPage() {
  const { wishlistItems, isLoading: wishlistLoading } = useWishlist();
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
        setUser(user);
        setLoadingUser(false);
    });
  }, [supabase.auth]);

  useEffect(() => {
    const fetchProducts = async () => {
      if (wishlistItems.length > 0) {
        setLoadingProducts(true);
        const allProducts = await getProducts();
        const wishlistedProductIds = wishlistItems.map(item => item.product_id);
        const filteredProducts = allProducts.filter(p => wishlistedProductIds.includes(p.productId));
        setProducts(filteredProducts);
        setLoadingProducts(false);
      } else {
        setProducts([]);
        setLoadingProducts(false);
      }
    };

    if (!wishlistLoading) {
      fetchProducts();
    }
  }, [wishlistItems, wishlistLoading]);
  
  const isLoading = wishlistLoading || loadingProducts || loadingUser;

  if (isLoading) {
    return (
        <div className="container mx-auto px-4 md:px-6 py-12">
            <WishlistPageSkeleton />
        </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 md:px-6 py-12 text-center">
        <AnimateOnScroll>
          <Heart className="mx-auto h-16 w-16 text-muted-foreground" />
          <h2 className="text-2xl font-bold mt-4">Please Sign In</h2>
          <p className="text-muted-foreground mt-2">
            You need to be logged in to view your wishlist.
          </p>
          <Button asChild className="mt-6">
            <Link href="/account">Sign In</Link>
          </Button>
        </AnimateOnScroll>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 md:px-6 py-12">
      <div className="text-center mb-8">
        <AnimateOnScroll>
            <h1 className="text-4xl md:text-5xl font-bold">Your Wishlist</h1>
            <p className="mt-2 text-lg text-muted-foreground max-w-2xl mx-auto">
                Your favorite instruments, all in one place.
            </p>
        </AnimateOnScroll>
      </div>
      
      {products.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((product, i) => (
            <AnimateOnScroll key={product.productId} delay={i * 50}>
              <ProductCard product={product} />
            </AnimateOnScroll>
          ))}
        </div>
      ) : (
         <div className="text-center py-12">
            <AnimateOnScroll>
                <Heart className="mx-auto h-16 w-16 text-muted-foreground" />
                <h2 className="text-2xl font-bold mt-4">Your wishlist is empty</h2>
                <p className="text-muted-foreground mt-2">Looks like you haven't added anything yet. Click the heart icon on a product to save it.</p>
                 <Button asChild className="mt-6">
                    <Link href="/products">Explore Products</Link>
                </Button>
            </AnimateOnScroll>
         </div>
      )}
    </div>
  );
}
