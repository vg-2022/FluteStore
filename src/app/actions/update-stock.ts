
'use server';

import { createClient } from '@supabase/supabase-js';

// This action uses the service role key to bypass RLS policies.
// NEVER expose this key on the client side.
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface UpdateStockPayload {
    productId: string;
    quantity: number;
    status: 'in-stock' | 'out-of-stock' | 'archived';
}

export async function updateStock(payload: UpdateStockPayload) {
  const { productId, quantity, status } = payload;
  if (!productId) {
    throw new Error("Product ID is required to update stock.");
  }
  
  const { data, error } = await supabaseAdmin
    .from('stock_keeping_units')
    .upsert(
      {
        product_id: productId,
        stock_quantity: quantity,
        stock_status: status,
      },
      { onConflict: 'product_id' }
    );

  if (error) {
    console.error('Supabase stock update (admin) error:', error);
    throw new Error(error.message);
  }

  return data;
}
