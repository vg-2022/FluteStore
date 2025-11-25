"use server";

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

// This creates a Supabase client with the service role key, bypassing RLS.
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
  // The RPC function `update_product_and_stock` is now responsible for handling the data types.
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

export async function createProductAction(productData: any, stockData: any) {
  // Step 1: Create the product
  const { data: newProduct, error: productError } = await supabaseAdmin
    .from("products")
    .insert(productData)
    .select()
    .single();

  if (productError) {
    console.error("Server Action - createProduct error:", productError);
    throw new Error(productError.message);
  }

  // Step 2: Create the stock keeping unit for the new product
  const { error: stockError } = await supabaseAdmin
    .from("stock_keeping_units")
    .insert({
      ...stockData,
      product_id: newProduct.product_id, // Link to the newly created product
    });

  if (stockError) {
    // If stock creation fails, we should ideally roll back the product creation.
    // For simplicity here, we'll log the error and throw.
    console.error("Server Action - create stock entry error:", stockError);
    // Attempt to delete the product that was just created
    await supabaseAdmin
      .from("products")
      .delete()
      .eq("product_id", newProduct.product_id);
    throw new Error(stockError.message);
  }

  revalidatePath("/admin/products");
  revalidatePath("/products");

  return newProduct;
}
