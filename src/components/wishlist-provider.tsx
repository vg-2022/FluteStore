
'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

export type WishlistItem = {
  id?: number;
  user_id?: string;
  product_id: string; 
  created_at?: string;
};

interface WishlistContextType {
  wishlistItems: WishlistItem[];
  isLoading: boolean;
  isInWishlist: (productId: string) => boolean;
  toggleWishlistItem: (productId: string) => Promise<void>;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
}

export function WishlistProvider({ children }: { children: ReactNode }) {
  const supabase = createClient();
  const { toast } = useToast();
  const router = useRouter();
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  // Get user session
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        setUser(session?.user ?? null);
    });
     supabase.auth.getUser().then(({ data: { user } }) => {
        setUser(user);
    });
    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  const loadWishlist = useCallback(async () => {
    if (!user) {
        setWishlistItems([]);
        setIsLoading(false);
        return;
    };
    setIsLoading(true);
    const { data, error } = await supabase
        .from('wishlist')
        .select('product_id')
        .eq('user_id', user.id);
    
    if (error) {
        console.error("Failed to fetch wishlist from Supabase", error);
        setWishlistItems([]);
    } else {
        setWishlistItems(data || []);
    }
    setIsLoading(false);
  }, [user, supabase]);

  useEffect(() => {
    loadWishlist();
  }, [loadWishlist]);

  const isInWishlist = useCallback((productId: string) => {
    return wishlistItems.some(item => item.product_id === productId);
  }, [wishlistItems]);

  const toggleWishlistItem = async (productId: string) => {
    if (!user) {
      toast({
        title: 'Please sign in',
        description: 'You need to be logged in to manage your wishlist.',
        variant: 'destructive',
      });
      router.push('/account');
      return;
    }
  
    const isCurrentlyInWishlist = isInWishlist(productId);

    if (isCurrentlyInWishlist) {
      // Remove from wishlist
      const { error } = await supabase
        .from('wishlist')
        .delete()
        .match({ user_id: user.id, product_id: productId });
      
      if (error) {
          toast({ title: 'Error removing from wishlist', description: error.message, variant: 'destructive'});
      } else {
          setWishlistItems(prev => prev.filter(item => item.product_id !== productId));
          toast({ title: 'Removed from Wishlist', variant: 'pill', duration: 400 });
      }
    } else {
      // Add to wishlist
      const { error } = await supabase
        .from('wishlist')
        .insert({ user_id: user.id, product_id: productId });
        
      if (error) {
          toast({ title: 'Error adding to wishlist', description: error.message, variant: 'destructive'});
      } else {
          const newItem: WishlistItem = { product_id: productId };
          setWishlistItems(prev => [...prev, newItem]);
          toast({ title: 'Added to Wishlist', variant: 'pill', duration: 400 });
      }
    }
  };

  const value = {
    wishlistItems,
    isLoading,
    isInWishlist,
    toggleWishlistItem,
  };

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
}
