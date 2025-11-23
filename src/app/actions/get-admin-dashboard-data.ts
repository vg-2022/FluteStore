
'use server';

import { createClient } from '@supabase/supabase-js';
import type { Order } from '@/lib/types';
import { getProducts } from '@/lib/products';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

function parseStatusHistory(history: any): Order['status_history'] {
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

export async function getAdminDashboardData() {
  const { data: orderData, error: ordersError } = await supabaseAdmin.from('orders').select('*').order('order_date', { ascending: false });
  if (ordersError) {
    console.error('Error fetching orders for admin:', ordersError);
    throw new Error('Could not fetch orders.');
  }

  const { data: { users }, error: usersError } = await supabaseAdmin.auth.admin.listUsers();
  if (usersError) {
    console.error('Error fetching users for admin:', usersError);
    throw new Error('Could not fetch users.');
  }

  const allProducts = await getProducts();
  const productMap = new Map(allProducts.map(p => [p.productId, p]));
  
  const hydratedOrders: Order[] = orderData.map((order: any) => ({
      ...order,
      total: parseFloat(order.total) || 0,
      cart_items: (order.cart_items || []).map((item: any) => ({
          ...item,
          product: productMap.get(item.productId) || {}
      })),
      status_history: parseStatusHistory(order.status_history),
  }));

  return {
    orders: hydratedOrders || [],
    users: users || [],
  };
}
