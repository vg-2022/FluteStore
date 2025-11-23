

'use client';

import Image from 'next/image';
import { useParams } from 'next/navigation';
import { useOrders } from '@/components/order-provider';
import { formatPrice } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import React from 'react';
import Link from 'next/link';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { OrderStatus, Order } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { createClient } from '@/lib/supabase/client';
import { useSettings } from '@/app/admin/settings/_components/settings-provider';

function AdminOrderDetailSkeleton() {
    return (
        <div className="grid gap-6 md:grid-cols-3">
            <div className="md:col-span-2 space-y-6">
                <Card>
                    <CardHeader>
                        <Skeleton className="h-8 w-3/4" />
                        <Skeleton className="h-5 w-1/2" />
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <Skeleton className="h-16 w-full" />
                            <Skeleton className="h-16 w-full" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle>Admin Comments</CardTitle></CardHeader>
                    <CardContent><Skeleton className="h-24 w-full" /></CardContent>
                </Card>
            </div>
            <div className="space-y-6">
                <Card>
                    <CardHeader><CardTitle>Actions</CardTitle></CardHeader>
                    <CardContent><Skeleton className="h-10 w-full" /></CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle>Customer Details</CardTitle></CardHeader>
                    <CardContent><Skeleton className="h-20 w-full" /></CardContent>
                </Card>
                 <Card>
                    <CardHeader><CardTitle>Payment Details</CardTitle></CardHeader>
                    <CardContent><Skeleton className="h-28 w-full" /></CardContent>
                </Card>
            </div>
        </div>
    );
}


export default function AdminOrderDetailPage() {
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const { getOrderById, updateOrderStatus, isLoaded } = useOrders();
  const { toast } = useToast();
  const supabase = createClient();
  const { pdpSettings } = useSettings();
  
  const [order, setOrder] = React.useState<Order | undefined>(undefined);
  const [comments, setComments] = React.useState('');
  const [status, setStatus] = React.useState<OrderStatus | undefined>();

  React.useEffect(() => {
    if (isLoaded) {
        const foundOrder = getOrderById(id);
        setOrder(foundOrder);
        if (foundOrder) {
            setComments(foundOrder.adminComments || '');
            setStatus(foundOrder.order_status);
        }
    }
  }, [id, getOrderById, isLoaded]);
  
  if (!isLoaded || !order) {
    return <AdminOrderDetailSkeleton />;
  }

  const handleUpdateStatus = async (newStatus: OrderStatus) => {
    if (!order) return;
    setStatus(newStatus);
    try {
        await updateOrderStatus(order.order_id, newStatus);
        toast({ title: 'Status Updated', description: `Order status changed to ${newStatus}` });
    } catch(e) {
        // toast is handled in provider
    }
  };

  const handleSaveComments = async () => {
    if (!order) return;
    const { error } = await supabase
      .from('orders')
      .update({ adminComments: comments })
      .eq('order_id', order.order_id);

    if (error) {
        toast({ variant: 'destructive', title: 'Error saving comments', description: error.message });
    } else {
        toast({ title: 'Comments Saved' });
    }
  };
  
  const subtotal = order.order_summary?.subtotal || order.cart_items.reduce((acc, item) => {
    if (!item.product) return acc;
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
    return acc + itemPrice * item.quantity;
  }, 0);

  const shippingCost = order.order_summary?.shipping ?? 0;
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

  return (
    <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Order Details - {order.order_id}</CardTitle>
                    <CardDescription>
                      Placed on {new Date(order.order_date).toLocaleString('en-IN', { dateStyle: 'long', timeStyle: 'short' })}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Product</TableHead>
                                <TableHead>Quantity</TableHead>
                                <TableHead className="text-right">Price</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {order.cart_items.map((item, index) => {
                                const product = item.product;
                                if (!product) return null;
                                let itemPrice = product.price;
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

                                return(
                                    <TableRow key={`${product.productId}-${index}`}>
                                        <TableCell>
                                            <div className="flex items-center gap-4">
                                                <div className="relative w-12 h-12 rounded-md overflow-hidden border">
                                                    {product.imageUrls && product.imageUrls[0] && <Image src={product.imageUrls[0]} alt={product.productName} fill className="object-cover" />}
                                                </div>
                                                <div>
                                                    <Link href={`/products/${product.productId}`} className="font-semibold hover:text-primary">{product.productName}</Link>
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
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>x{item.quantity}</TableCell>
                                        <TableCell className="text-right">{formatPrice(itemPrice * item.quantity)}</TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Order History</CardTitle>
                </CardHeader>
                <CardContent>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                        {Array.isArray(order.status_history) && order.status_history?.map((history, index) => (
                           <li key={index} className="flex justify-between">
                               <span>Status set to <Badge variant="secondary">{history.status}</Badge></span>
                               <span>{new Date(history.date).toLocaleString('en-IN')}</span>
                           </li>
                        ))}
                    </ul>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Admin Comments</CardTitle>
                </CardHeader>
                <CardContent>
                    <Textarea 
                      placeholder="Add internal notes for this order..." 
                      value={comments} 
                      onChange={(e) => setComments(e.target.value)}
                    />
                </CardContent>
                <CardFooter>
                    <Button onClick={handleSaveComments}>Save Comments</Button>
                </CardFooter>
            </Card>
        </div>

        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <label className="text-sm font-medium">Update Status</label>
                        <Select value={status} onValueChange={(val: OrderStatus) => handleUpdateStatus(val)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Change status..." />
                            </SelectTrigger>
                            <SelectContent>
                                {['Placed', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Cancellation Pending', 'Refunded'].map(s => (
                                    <SelectItem key={s} value={s}>{s}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Customer Details</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                    <p className="font-semibold text-foreground">{order.shipping_details?.name}</p>
                    <p>{order.shipping_details?.address}</p>
                    <p>{order.shipping_details?.city}, {order.shipping_details?.pincode}</p>
                    <p>{order.shipping_details?.phone}</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Payment Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Payment Method</span>
                        <span className="font-medium">{getPaymentMethodLabel(paymentMethod)}</span>
                    </div>
                     <div className="flex justify-between">
                        <span className="text-muted-foreground">Reference ID</span>
                        <span className="font-mono text-xs">{order.payment_reference_id}</span>
                    </div>
                    <Separator className="my-2"/>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span>{formatPrice(subtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Shipping</span>
                        <span>{formatPrice(shippingCost)}</span>
                    </div>
                    <Separator className="my-2"/>
                    <div className="flex justify-between font-bold text-base">
                        <span>Total</span>
                        <span>{formatPrice(order.total)}</span>
                    </div>
                     <div className="flex justify-between">
                        <span className="text-muted-foreground">Refund Status</span>
                        <Badge variant={order.order_status === 'Refunded' ? 'default' : 'secondary'}>
                            {order.order_status === 'Refunded' ? 'Refunded' : 'Not Refunded'}
                        </Badge>
                    </div>
                </CardContent>
            </Card>
        </div>
    </div>
  );
}
