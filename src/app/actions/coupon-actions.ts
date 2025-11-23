
'use server';

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';
import type { Coupon } from '@/lib/types';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type UpsertCouponPayload = Partial<Coupon> & {
    coupon_code: string;
    discount_type: 'percentage' | 'fixed_amount';
    discount_value: number;
    is_active: boolean;
    is_hidden: boolean;
};

export async function upsertCoupon(payload: UpsertCouponPayload) {
  const { coupon_id, ...couponData } = payload;
  
  const dataToUpsert = {
    ...couponData,
    min_order_amount: couponData.min_order_amount || 0,
    max_uses_per_user: couponData.max_uses_per_user || 1,
    valid_from: couponData.valid_from ? new Date(couponData.valid_from).toISOString() : null,
    valid_until: couponData.valid_until ? new Date(couponData.valid_until).toISOString() : null,
  };

  let query = supabaseAdmin.from('coupons');
  
  if (coupon_id) {
    // Update existing coupon
    const { error } = await query.update(dataToUpsert).eq('coupon_id', coupon_id);
    if (error) throw new Error(error.message);
  } else {
    // Insert new coupon
    const { error } = await query.insert(dataToUpsert);
    if (error) throw new Error(error.message);
  }

  revalidatePath('/admin/marketing/coupons');
}

export async function deleteCoupon(couponId: number) {
  const { error } = await supabaseAdmin.from('coupons').delete().eq('coupon_id', couponId);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/marketing/coupons');
}


export async function applyCoupon(couponCode: string, subtotal: number): Promise<{ success: boolean; discountAmount: number; error?: string }> {
    const { data: coupon, error } = await supabaseAdmin
        .from('coupons')
        .select('*')
        .eq('coupon_code', couponCode.toUpperCase())
        .single();

    if (error || !coupon) {
        return { success: false, discountAmount: 0, error: 'Coupon not found.' };
    }

    if (!coupon.is_active) {
        return { success: false, discountAmount: 0, error: 'This coupon is not active.' };
    }

    const now = new Date();
    if (coupon.valid_from && new Date(coupon.valid_from) > now) {
        return { success: false, discountAmount: 0, error: 'This coupon is not yet valid.' };
    }
    if (coupon.valid_until && new Date(coupon.valid_until) < now) {
        return { success: false, discountAmount: 0, error: 'This coupon has expired.' };
    }

    if (subtotal < coupon.min_order_amount) {
        return { success: false, discountAmount: 0, error: `Minimum order of ${formatPrice(coupon.min_order_amount)} is required.` };
    }

    let discountAmount = 0;
    if (coupon.discount_type === 'percentage') {
        discountAmount = (subtotal * coupon.discount_value) / 100;
    } else { // fixed_amount
        discountAmount = coupon.discount_value;
    }
    
    // Ensure discount doesn't exceed subtotal
    discountAmount = Math.min(discountAmount, subtotal);

    return { success: true, discountAmount };
}

export async function getAvailableCoupons(): Promise<Coupon[]> {
    const now = new Date().toISOString();
    
    const { data, error } = await supabaseAdmin
        .from('coupons')
        .select('*')
        .eq('is_active', true)
        .eq('is_hidden', false)
        .or(`valid_until.gte.${now},valid_until.is.null`);

    if (error) {
        console.error("Error fetching available coupons:", error);
        return [];
    }

    return data;
}


function formatPrice(price: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
  }).format(price);
}
