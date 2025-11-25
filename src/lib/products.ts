import { createClient } from "./supabase/client";
import type { Product } from "./types";

const supabase = createClient();

function mapProductData(data: any): Product {
  if (!data) return {} as Product;

  // The view now returns categories and tags as a JSON array of objects.
  // We need to extract the 'name' from each object.
  const categories = (data.categories || []).map((c: any) => c.name);
  const tags = (data.tags || []).map((t: any) => t.name);

  return {
    productId: data.product_id,
    productName: data.product_name,
    description: data.description,
    price: data.price,
    mrp: data.mrp,
    imageUrls: data.image_urls || [],
    audioUrl: data.audio_url,
    avgRating: data.avg_rating || 0,
    reviewCount: data.review_count || 0,
    stockStatus: data.stock_status || "in-stock",
    stockQuantity: data.stock_quantity || 0,
    productType: data.product_type,
    specifications: data.specifications || {},
    categories: categories,
    tags: tags,
    createdAt: data.created_at,
  };
}

export async function getProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products_with_details")
    .select("*");

  if (error) {
    console.error("Error fetching products:", error);
    return [];
  }

  return data.map(mapProductData);
}

export async function getProductById(id: string): Promise<Product | null> {
  if (!id) return null;

  const { data, error } = await supabase
    .from("products_with_details")
    .select("*")
    .eq("product_id", id)
    .single();

  if (error) {
    console.error(`Error fetching product ${id}:`, error);
    return null;
  }

  if (!data) return null;

  return mapProductData(data);
}
