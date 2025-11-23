'use server';

import { createClient } from '@supabase/supabase-js';
import type { OrderStatus, OrderStatusHistoryItem, Notification } from '@/lib/types';
import { revalidatePath } from 'next/cache';

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

interface UpdateStatusPayload {
    orderId: string;
    status: OrderStatus;
    comment?: string;
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

async function createNotification(orderId: string, status: OrderStatus, userId: string) {
    // Do not create a standard user notification for cancellation requests, as admins get a specific one.
    if (status === 'Cancellation Pending') {
        return;
    }
    
    const title = `Order Status Updated`;
    let message = `Your order #${orderId} is now ${status}.`;
    
    // Customize messages for users
    if (status === 'Shipped') message += ' It is on its way to you!';
    if (status === 'Delivered') message += ' Thank you for shopping with us!';
    if (status === 'Cancelled') message = `Your order #${orderId} has been cancelled.`;

    const { error } = await supabaseAdmin
        .from('notifications')
        .insert({
            user_id: userId,
            order_id: orderId,
            title: title,
            message: message
        });

    if (error) {
        console.error('Error creating user notification:', error);
    }
}

async function createAdminNotificationForStatusChange(orderId: string, status: OrderStatus) {
    // Only notify admins for specific statuses
    if (status !== 'Cancellation Pending') return;

    const { data: adminUsers, error: rpcError } = await supabaseAdmin.rpc('get_admin_user_ids');

    if (rpcError) {
        console.error('Error fetching admin user IDs for status change via RPC:', rpcError);
        return;
    }

    if (adminUsers && adminUsers.length > 0) {
        const notifications = adminUsers.map((admin: { user_id: string }) => ({
            user_id: admin.user_id,
            order_id: orderId,
            title: 'Action Required: Order Update',
            message: `Order #${orderId} has a status of "${status}".`,
        }));

        const { error: notificationError } = await supabaseAdmin
            .from('notifications')
            .insert(notifications);

        if (notificationError) {
            console.error('Error creating admin notifications for status change:', notificationError);
        }
    }
}

export async function updateOrderStatus(payload: UpdateStatusPayload) {
  const { orderId, status, comment } = payload;

  // 1. Fetch the existing order to get its current status history and user_id
  const { data: existingOrder, error: fetchError } = await supabaseAdmin
    .from('orders')
    .select('status_history, user_id')
    .eq('order_id', orderId)
    .single();

  if (fetchError) {
    console.error('Supabase fetch error for status update:', fetchError);
    throw new Error(fetchError.message);
  }

  // 2. Append the new status to the history
  const currentHistory = parseStatusHistory(existingOrder.status_history);
  const newStatusHistory: OrderStatusHistoryItem[] = [
    ...currentHistory,
    { status, date: new Date().toISOString(), comment }
  ];

  // 3. Update the order with the new status and the full history
  const { data, error } = await supabaseAdmin
    .from('orders')
    .update({ 
        order_status: status, 
        status_history: JSON.stringify(newStatusHistory) 
    })
    .eq('order_id', orderId)
    .select()
    .single();

  if (error) {
    console.error('Supabase status update error:', error);
    throw new Error(error.message);
  }

  // 4. Create notifications
  if (existingOrder.user_id) {
    await createNotification(orderId, status, existingOrder.user_id);
  }
  await createAdminNotificationForStatusChange(orderId, status);
  
  // Revalidate the path to ensure the UI updates
  revalidatePath(`/account/orders/${orderId}`);
  revalidatePath('/admin/orders');
  revalidatePath(`/admin/orders/${orderId}`);

  return data;
}
