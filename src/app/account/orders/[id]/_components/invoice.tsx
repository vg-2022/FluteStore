

'use client';
import React from 'react';
import Image from 'next/image';
import type { Order } from '@/lib/types';
import { formatPrice } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Logo } from '@/components/icons/logo';
import { useSettings } from '@/app/admin/settings/_components/settings-provider';

interface InvoiceProps {
  order: Order;
}

export const Invoice: React.FC<InvoiceProps> = ({ order }) => {
    const { storeDetails, isLoading, pdpSettings } = useSettings();
    
    const subtotal = order.order_summary?.subtotal || 0;
    const shipping = order.order_summary?.shipping || 0;
    const discount = order.order_summary?.coupon_discount || 0;
    const total = order.total || 0;
    const paymentMethod = order.order_summary?.payment_method;

    const getPaymentMethodLabel = (method: string | null | undefined) => {
        if (!method) return 'N/A';
        switch (method) {
            case 'card': return 'Card';
            case 'upi': return 'UPI';
            case 'netbanking': return 'Netbanking';
            case 'wallet': return 'Wallet';
            default: return method.charAt(0).toUpperCase() + method.slice(1);
        }
    }
    
    if (isLoading) {
        return <div>Loading invoice...</div>
    }

    const storeName = storeDetails?.name || "FluteStore";
    const logoUrl = storeDetails?.logo;


  return (
    <div id="invoice-content" className="p-8 bg-background text-foreground font-sans text-sm">
      <header className="flex justify-between items-start pb-4 border-b mb-8">
        <div className="flex items-center gap-4">
            {logoUrl ? (
                <Image src={logoUrl} alt={storeName} width={48} height={48} className="h-12 w-12 object-contain" />
            ) : (
                <Logo className="h-12 w-12 text-primary" />
            )}
            <div>
                <h1 className="text-2xl font-bold font-headline">{storeName}</h1>
                <p className="text-muted-foreground">Tax Invoice</p>
            </div>
        </div>
        <div className="text-right">
          <p className="font-semibold text-lg">Invoice #{order.order_id}</p>
          <p className="text-muted-foreground">Order Date: {new Date(order.order_date).toLocaleDateString('en-IN')}</p>
        </div>
      </header>

      <section className="grid grid-cols-2 gap-8 mb-8">
        <div>
          <h2 className="font-semibold mb-2 text-base">Billed To:</h2>
          <div className="text-muted-foreground">
            <p>{order.shipping_details?.name}</p>
            <p>{order.shipping_details?.address}</p>
            <p>{order.shipping_details?.city}, {order.shipping_details?.pincode}</p>
            <p>Phone: {order.shipping_details?.phone}</p>
          </div>
        </div>
        <div className="text-right">
          <h2 className="font-semibold mb-2 text-base">Payment Details:</h2>
          <div className="text-muted-foreground">
             <div>Payment Method: {getPaymentMethodLabel(paymentMethod)}</div>
             <div>Transaction ID: {order.payment_reference_id}</div>
             <div className='flex justify-end items-center gap-2 mt-1'>Status: <Badge variant="default">Paid</Badge></div>
          </div>
        </div>
      </section>

      <section>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-1/2">Item</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Price</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {order.cart_items.map((item, index) => {
                 let itemPrice = item.product.price;
                if (item.customizations) {
                    for (const [key, value] of Object.entries(item.customizations)) {
                        const customizationConfig = pdpSettings.customizations.find(c => c.label === key);
                        if (customizationConfig?.options) {
                            const selectedOption = customizationConfig.options.find(opt => opt.value === value);
                            if (selectedOption?.price_change) {
                                itemPrice += selectedOption.price_change;
                            }
                        }
                    }
                }
                return (
                    <TableRow key={`${item.product.productId}-${index}`}>
                        <TableCell>
                            <p className="font-medium">{item.product.productName}</p>
                             {item.customizations && (
                                <div className="text-xs text-muted-foreground mt-1">
                                    {Object.entries(item.customizations).map(([key, value]) => {
                                        if (!value || value === 'No' || (typeof value === 'object' && Object.keys(value).length === 0)) return null;
                                        if (typeof value === 'object' && value !== null) {
                                            return Object.entries(value).map(([subKey, subValue]) => (
                                                <div key={subKey}><span className="font-semibold">{subKey}:</span> {subValue as string}</div>
                                            ));
                                        }
                                        return <div key={key}><span className="font-semibold">{key}:</span> {value as string}</div>;
                                    })}
                                </div>
                            )}
                        </TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>{formatPrice(itemPrice)}</TableCell>
                        <TableCell className="text-right">{formatPrice(itemPrice * item.quantity)}</TableCell>
                    </TableRow>
                )
            })}
          </TableBody>
        </Table>
      </section>
      
      <Separator className="my-8" />

      <section className="flex justify-end">
        <div className="w-full max-w-sm space-y-2">
            <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between">
                <span className="text-muted-foreground">Shipping</span>
                <span>{formatPrice(shipping)}</span>
            </div>
            {discount > 0 && (
                 <div className="flex justify-between">
                    <span className="text-muted-foreground">Coupon Discount</span>
                    <span className="text-green-600">-{formatPrice(discount)}</span>
                </div>
            )}
            <Separator className="my-2"/>
            <div className="flex justify-between font-bold text-lg">
                <span>Grand Total</span>
                <span>{formatPrice(total)}</span>
            </div>
        </div>
      </section>

      <footer className="mt-12 pt-4 border-t text-center text-xs text-muted-foreground">
        <p>Thank you for making the purchase!</p>
        <div className="flex items-center justify-center gap-2 mt-2">
             {logoUrl ? (
                <Image src={logoUrl} alt={storeName} width={16} height={16} className="h-4 w-4 object-contain" />
            ) : (
                <Logo className="h-4 w-4 text-primary" />
            )}
            <p className="font-semibold text-foreground">{storeName}</p>
        </div>
        <p className="mt-1">The finest flutes from around the world.</p>
      </footer>
    </div>
  );
};
Invoice.displayName = "Invoice";
