
'use server';

import { createClient } from '@supabase/supabase-js';

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

export async function createProductAction(productData: any) {
  const { data, error } = await supabaseAdmin
    .from('products')
    .insert([productData])
    .select()
    .single();

  if (error) {
    console.error('Server Action - createProduct error:', error);
    throw new Error(error.message);
  }
  return data;
}

export async function updateProductAction(id: string, productData: any) {
  const { data, error } = await supabaseAdmin
    .from('products')
    .update(productData)
    .eq('product_id', id)
    .select()
    .single();

  if (error) {
    console.error('Server Action - updateProduct error:', error);
    throw new Error(error.message);
  }
  return data;
}
