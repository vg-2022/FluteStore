"use server";

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

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

// This action is now responsible for both product and stock updates via an RPC call.
export async function updateProductAction(
  id: string,
  productData: any,
  stockData: any
) {
  // Use a transaction to ensure both updates succeed or fail together
  const { data, error } = await supabaseAdmin.rpc("update_product_and_stock", {
    p_id: id,
    p_data: productData,
    s_data: stockData,
  });

  if (error) {
    console.error("Server Action - updateProductAndStock rpc error:", error);
    throw new Error(error.message);
  }

  // Revalidate paths to ensure data is fresh
  revalidatePath("/admin/products");
  revalidatePath(`/products/${id}`);
  revalidatePath(`/admin/products/${id}`);
  revalidatePath("/products");

  return data;
}

export async function createProductAction(productData: any) {
  const { data, error } = await supabaseAdmin
    .from("products")
    .insert([productData])
    .select()
    .single();

  if (error) {
    console.error("Server Action - createProduct error:", error);
    throw new Error(error.message);
  }

  revalidatePath("/admin/products");
  revalidatePath("/products");

  return data;
}
