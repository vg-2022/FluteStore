'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Order, OrderStatus, Product, OrderStatusHistoryItem } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';
import { getProducts } from '@/lib/products';
import { updateOrderStatus as updateOrderStatusAction } from '@/app/actions/update-order-status';
import { usePathname } from 'next/navigation';
import { getAdminDashboardData } from '@/app/actions/get-admin-dashboard-data';

interface OrderContextType {
  orders: Order[];
  addOrder: (order: Order) => void;
  getOrderById: (orderId: string) => Order | undefined;
  updateOrderStatus: (orderId: string, status: OrderStatus, comment?: string) => Promise<void>;
  isLoaded: boolean;
  fetchOrders: (userId?: string) => void;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export function useOrders() {
  const context = useContext(OrderContext);
  if (context === undefined) {
    throw new Error('useOrders must be used within a OrderProvider');
  }
  return context;
}

function parseStatusHistory(history: any): OrderStatusHistoryItem[] {
    if (Array.isArray(history)) {
        return history;
    }
    if (typeof history === 'string') {
        try {
            const parsed = JSON.parse(history);
            return Array.isArray(parsed) ? parsed : [];
        } catch (e) {
            return [];
        }
    }
    return [];
}


export function OrderProvider({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const { toast } = useToast();
  const pathname = usePathname();
  const isAdminRoute = pathname.startsWith('/admin');

  const fetchOrders = useCallback(async (userId?: string) => {
    setIsLoaded(false);

    try {
        let orderData: any[] | null = [];
        if (isAdminRoute) {
            // For admin, fetch all orders using the secure server action
            const adminData = await getAdminDashboardData();
            orderData = adminData.orders;
        } else if (userId) {
            // For regular users, fetch only their orders
            const { data, error } = await supabase
                .from('orders')
                .select('*')
                .eq('user_id', userId)
                .order('order_date', { ascending: false });

            if (error) throw error;
            orderData = data;
        } else {
            // If not admin and no user ID, do nothing.
            setOrders([]);
            setIsLoaded(true);
            return;
        }

        if (orderData) {
            const allProducts = await getProducts();
            const productMap = new Map(allProducts.map(p => [p.productId, p]));
            
            const hydratedOrders = orderData.map((order: any) => ({
                ...order,
                cart_items: (order.cart_items || []).map((item: any) => ({
                    ...item,
                    product: productMap.get(item.productId) || {}
                })),
                status_history: parseStatusHistory(order.status_history),
            })).sort((a, b) => new Date(b.order_date).getTime() - new Date(a.order_date).getTime());
            setOrders(hydratedOrders);
        }

    } catch (error: any) {
        console.error("Failed to fetch orders", error);
        toast({ variant: 'destructive', title: 'Error fetching orders', description: error.message });
        setOrders([]);
    } finally {
        setIsLoaded(true);
    }
  }, [supabase, isAdminRoute, toast]);

  const addOrder = (newOrder: Order) => {
     setOrders(prevOrders => [newOrder, ...prevOrders].sort((a, b) => new Date(b.order_date).getTime() - new Date(a.order_date).getTime()));
  };
  
  const getOrderById = (orderId: string) => {
    return orders.find(o => o.order_id === orderId);
  }

  const updateOrderStatus = async (orderId: string, status: OrderStatus, comment?: string) => {
    try {
        const updatedOrder = await updateOrderStatusAction({ orderId, status, comment });
        if (updatedOrder) {
             const allProducts = await getProducts();
             const productMap = new Map(allProducts.map(p => [p.productId, p]));
             const rehydratedOrder: Order = {
                ...updatedOrder,
                cart_items: (updatedOrder.cart_items || []).map((item: any) => ({
                    ...item,
                    product: productMap.get(item.productId) || {}
                })),
                status_history: parseStatusHistory(updatedOrder.status_history),
             };

             setOrders(prevOrders => 
                prevOrders.map(order => 
                    order.order_id === orderId ? rehydratedOrder : order
                )
            );
        }
    } catch (error) {
        toast({ variant: 'destructive', title: 'Error updating order status', description: (error as Error).message });
        throw error; // Re-throw to be caught by the caller
    }
  };

  const value = {
    orders,
    addOrder,
    getOrderById,
    updateOrderStatus,
    isLoaded,
    fetchOrders
  };

  return <OrderContext.Provider value={value}>{children}</OrderContext.Provider>;
}
