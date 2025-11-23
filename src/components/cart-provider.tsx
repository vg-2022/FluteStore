
'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Product, PDPSettings, PDPCustomization, PDPCustomizationOption } from '@/lib/types';
import { useToast } from "@/hooks/use-toast";
import { useSettings } from '@/app/admin/settings/_components/settings-provider';

export interface CartItem {
  product: Product;
  quantity: number;
  customizations?: Record<string, any>;
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (product: Product, quantity?: number, customizations?: Record<string, any>) => void;
  removeFromCart: (productId: string, customizations?: Record<string, any>) => void;
  updateQuantity: (productId: string, quantity: number, customizations?: Record<string, any>) => void;
  clearCart: () => void;
  getCartItem: (productId: string, customizations?: Record<string, any>) => CartItem | undefined;
  cartCount: number;
  total: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const { toast } = useToast();
  const { pdpSettings } = useSettings();

  useEffect(() => {
    try {
      const storedCart = localStorage.getItem('cart');
      if (storedCart) {
        setCartItems(JSON.parse(storedCart));
      }
    } catch (error) {
      console.error("Failed to parse cart from localStorage", error);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (product: Product, quantity: number = 1, customizations?: Record<string, any>) => {
    setCartItems(prevItems => {
      const existingItem = prevItems.find(item => 
        item.product.productId === product.productId && JSON.stringify(item.customizations) === JSON.stringify(customizations)
      );
      if (existingItem) {
        return prevItems.map(item =>
          item.product.productId === product.productId && JSON.stringify(item.customizations) === JSON.stringify(customizations)
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prevItems, { product, quantity, customizations }];
    });
    toast({
      title: "Added to Cart",
      variant: "pill",
      duration: 400,
    });
  };

  const removeFromCart = (productId: string, customizations?: Record<string, any>) => {
    setCartItems(prevItems => prevItems.filter(item => 
        !(item.product.productId === productId && JSON.stringify(item.customizations) === JSON.stringify(customizations))
    ));
  };

  const updateQuantity = (productId: string, quantity: number, customizations?: Record<string, any>) => {
    setCartItems(prevItems =>
      prevItems
        .map(item =>
          item.product.productId === productId && JSON.stringify(item.customizations) === JSON.stringify(customizations)
            ? { ...item, quantity: Math.max(0, quantity) }
            : item
        )
        .filter(item => item.quantity > 0)
    );
  };
  
  const getCartItem = useCallback((productId: string, customizations?: Record<string, any>) => {
    return cartItems.find(item => item.product.productId === productId && JSON.stringify(item.customizations) === JSON.stringify(customizations));
  }, [cartItems]);

  const clearCart = () => {
    setCartItems([]);
  };

  const cartCount = cartItems.reduce((count, item) => count + item.quantity, 0);
  
  const total = cartItems.reduce((acc, item) => {
    let itemPrice = item.product.price;
    if (item.customizations) {
      for (const [key, value] of Object.entries(item.customizations)) {
        const customizationConfig = pdpSettings.customizations.find(c => c.label === key);
        if (customizationConfig?.options) {
          const selectedOption = customizationConfig.options.find(opt => opt.value === value);
          if (selectedOption?.price_change) {
            itemPrice += selectedOption.price_change;
          }
        }
      }
    }
    return acc + itemPrice * item.quantity;
  }, 0);


  const value = {
    cartItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartItem,
    cartCount,
    total
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
