"use server";

import { createClient } from "@supabase/supabase-js";
import type { Order, OrderStatusHistoryItem, Notification } from "@/lib/types";

// This action uses the service role key to bypass RLS policies for a trusted server-side operation.
// NEVER expose this key on the client side.
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// Define the type for the order data coming from the client
type OrderPayload = Omit<
  Order,
  | "order_id"
  | "order_date"
  | "order_status"
  | "status_history"
  | "adminComments"
>;

async function createAdminNotification(orderId: string, total: number) {
  const { data: adminUsers, error: rpcError } = await supabaseAdmin.rpc(
    "get_admin_user_ids"
  );

  if (rpcError) {
    console.error("Error fetching admin user IDs via RPC:", rpcError);
    return;
  }

  if (adminUsers && adminUsers.length > 0) {
    const notifications = adminUsers.map((admin: { user_id: string }) => ({
      user_id: admin.user_id,
      order_id: orderId,
      title: "New Order Received!",
      message: `A new order (#${orderId}) has been placed for a total of ${new Intl.NumberFormat(
        "en-IN",
        { style: "currency", currency: "INR" }
      ).format(total)}.`,
    }));

    const { error: notificationError } = await supabaseAdmin
      .from("notifications")
      .insert(notifications);

    if (notificationError) {
      console.error("Error creating admin notifications:", notificationError);
    }
  }
}

export async function createOrderInDatabase(
  newOrderData: OrderPayload
): Promise<Order | null> {
  const statusHistory: OrderStatusHistoryItem[] = [
    { status: "Placed", date: new Date().toISOString() },
  ];

  const orderToInsert = {
    user_id: newOrderData.user_id,
    // order_date is now handled by the database's default value
    order_status: "Placed",
    total: newOrderData.total,
    shipping_details: newOrderData.shipping_details,
    order_summary: newOrderData.order_summary,
    payment_reference_id: newOrderData.payment_reference_id,
    status_history: statusHistory,
    cart_items: newOrderData.cart_items.map((item) => ({
      productId: item.productId, // Use productId directly
      quantity: item.quantity,
      customizations: item.customizations,
    })),
  };

  const { data, error } = await supabaseAdmin
    .from("orders")
    .insert(orderToInsert)
    .select()
    .single();

  if (error) {
    console.error("Server-side order creation error:", error);
    // We throw the error to be caught by the client-side caller
    throw new Error(error.message);
  }

  if (data) {
    await createAdminNotification(data.order_id, data.total);
  }

  // The data returned from the insert is just the raw DB data.
  // We can return it directly, and the client can hydrate it if needed.
  return data
    ? {
        ...data,
        status_history: parseStatusHistory(data.status_history),
        cart_items: data.cart_items,
      }
    : null;
}

function parseStatusHistory(history: any): OrderStatusHistoryItem[] {
  if (Array.isArray(history)) {
    return history;
  }
  if (typeof history === "string") {
    try {
      const parsed = JSON.parse(history);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }
  return [];
}
