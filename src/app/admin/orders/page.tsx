
'use client';
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useOrders } from "@/components/order-provider";
import { formatPrice } from "@/lib/utils";
import type { Order, OrderStatus } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Search } from "lucide-react";
import React, { useMemo } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import Image from "next/image";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSettings } from "@/app/admin/settings/_components/settings-provider";
import { Input } from "@/components/ui/input";

const getBadgeVariant = (status: Order['order_status']) => {
  switch (status) {
    case 'Delivered':
      return 'default';
    case 'Cancelled':
    case 'Refunded':
      return 'destructive';
    case 'Shipped':
    case 'Processing':
    case 'Placed':
      return 'secondary';
    case 'Cancellation Pending':
        return 'outline'
    default:
      return 'secondary';
  }
};

function OrderRow({ order }: { order: Order }) {
    const [isOpen, setIsOpen] = React.useState(false);
    const { updateOrderStatus } = useOrders();
    const [newStatus, setNewStatus] = React.useState<OrderStatus>(order.order_status);
    const [comment, setComment] = React.useState('');
    const { toast } = useToast();
    const { pdpSettings } = useSettings();

    const handleStatusUpdate = () => {
        updateOrderStatus(order.order_id, newStatus, comment);
        toast({ title: 'Order Updated', description: `Order ${order.order_id} status set to ${newStatus}`});
        setComment('');
    }

    const isPaid = !!order.payment_reference_id;

    return (
        <>
            <TableRow>
                <TableCell>
                    <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={() => setIsOpen(!isOpen)}>
                            {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            <span className="sr-only">{isOpen ? 'Collapse' : 'Expand'}</span>
                        </Button>
                    </CollapsibleTrigger>
                </TableCell>
                <TableCell className="font-medium">
                  <Link href={`/admin/orders/${order.order_id}`} className="hover:underline text-primary">{order.order_id}</Link>
                </TableCell>
                <TableCell>{order.shipping_details?.name || 'N/A'}</TableCell>
                <TableCell>{new Date(order.order_date).toLocaleDateString()}</TableCell>
                <TableCell className="text-right">{formatPrice(order.total)}</TableCell>
                <TableCell>
                  <Badge variant={getBadgeVariant(order.order_status)}>
                    {order.order_status}
                  </Badge>
                </TableCell>
                 <TableCell>
                   <Badge variant={isPaid ? 'default' : 'secondary'}>
                     {isPaid ? 'Paid' : 'Pending'}
                   </Badge>
                </TableCell>
            </TableRow>
            <CollapsibleContent asChild>
                <TableRow>
                    <TableCell colSpan={7} className="p-0">
                       <div className="p-6 bg-muted/50">
                         <h4 className="font-semibold text-lg mb-4">Order Details for {order.order_id}</h4>
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="md:col-span-2 space-y-4">
                                <Card>
                                    <CardHeader><CardTitle>Products</CardTitle></CardHeader>
                                    <CardContent>
                                        {order.cart_items.map((item, index) => {
                                            return (
                                                <div key={index} className="flex items-start gap-4 py-2">
                                                    {item.product && item.product.imageUrls && item.product.imageUrls[0] && <Image src={item.product.imageUrls[0]} alt={item.product.productName} width={64} height={64} className="rounded-md border object-cover" />}
                                                    <div>
                                                        <p className="font-semibold">{item.product.productName} (x{item.quantity})</p>
                                                        {item.customizations && (
                                                            <div className="text-xs text-muted-foreground space-y-1 mt-1">
                                                                {Object.entries(item.customizations).map(([key, value]) => {
                                                                    if (!value || value === 'No' || (typeof value === 'object' && Object.keys(value).length === 0)) return null;

                                                                    if (typeof value === 'object' && value !== null) {
                                                                        return Object.entries(value).map(([subKey, subValue]) => (
                                                                            <div key={subKey}><span className="font-medium">{subKey}:</span> {subValue as string}</div>
                                                                        ));
                                                                    }
                                                                    
                                                                    return <div key={key}><span className="font-medium">{key}:</span> {value as string}</div>
                                                                })}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </CardContent>
                                </Card>
                                 <Card>
                                    <CardHeader><CardTitle>Status History</CardTitle></CardHeader>
                                    <CardContent>
                                        <ul className="space-y-3 text-sm">
                                            {Array.isArray(order.status_history) && order.status_history?.map((history, index) => (
                                            <li key={index}>
                                                <div className="flex justify-between">
                                                    <span>Status set to <Badge variant={getBadgeVariant(history.status)}>{history.status}</Badge></span>
                                                    <span className="text-muted-foreground">{new Date(history.date).toLocaleString('en-IN')}</span>
                                                </div>
                                                {history.comment && <p className="text-muted-foreground italic pl-4 border-l-2 ml-2 mt-1">"{history.comment}"</p>}
                                            </li>
                                            ))}
                                        </ul>
                                    </CardContent>
                                </Card>
                            </div>
                            <div className="space-y-4">
                                <Card>
                                    <CardHeader><CardTitle>Shipping Details</CardTitle></CardHeader>
                                    <CardContent className="text-sm">
                                        <p className="font-semibold">{order.shipping_details?.name}</p>
                                        <p className="text-muted-foreground">{order.shipping_details?.address}</p>
                                        <p className="text-muted-foreground">{order.shipping_details?.city}, {order.shipping_details?.pincode}</p>
                                        <p className="text-muted-foreground">{order.shipping_details?.phone}</p>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader><CardTitle>Manage Status</CardTitle></CardHeader>
                                    <CardContent className="space-y-4">
                                        <div>
                                            <label className="text-sm font-medium">Update Status</label>
                                            <Select value={newStatus} onValueChange={(val: OrderStatus) => setNewStatus(val)}>
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
                                        <div>
                                            <label className="text-sm font-medium">Add Comment (Optional)</label>
                                            <Textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Reason for status change..." />
                                        </div>
                                        <Button onClick={handleStatusUpdate} className="w-full">Update Order</Button>
                                    </CardContent>
                                </Card>
                            </div>
                         </div>
                       </div>
                    </TableCell>
                </TableRow>
            </CollapsibleContent>
        </>
    );
}

const filterMappings: { [key: string]: OrderStatus[] } = {
  all: ['Placed', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Cancellation Pending', 'Refunded'],
  new: ['Placed'],
  unfulfilled: ['Processing'],
  shipped: ['Shipped'],
  issues: ['Cancelled', 'Cancellation Pending', 'Refunded'],
};

export default function AdminOrdersPage() {
  const { orders, fetchOrders, isLoaded } = useOrders();
  const [filter, setFilter] = React.useState('all');
  const [searchTerm, setSearchTerm] = React.useState('');


  React.useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const filteredOrders = React.useMemo(() => {
    if (!isLoaded) return [];
    
    let tempOrders = [...orders];

    if (searchTerm) {
        tempOrders = tempOrders.filter(order => 
            order.order_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.shipping_details?.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }
    
    return tempOrders
      .filter(order => filterMappings[filter].includes(order.order_status))
      .sort((a, b) => new Date(b.order_date).getTime() - new Date(a.order_date).getTime());
  }, [orders, filter, isLoaded, searchTerm]);


  return (
     <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
                <CardTitle>Orders</CardTitle>
                <CardDescription>A list of all orders in your store.</CardDescription>
            </div>
             <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                    placeholder="Search by Order ID or Name..." 
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={filter} onValueChange={setFilter}>
            <TabsList className="mb-4">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="new">New</TabsTrigger>
                <TabsTrigger value="unfulfilled">Unfulfilled</TabsTrigger>
                <TabsTrigger value="shipped">Shipped</TabsTrigger>
                <TabsTrigger value="issues">Issues</TabsTrigger>
            </TabsList>
            <Table>
            <TableHeader>
                <TableRow>
                <TableHead className="w-12"></TableHead>
                <TableHead>Order ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Payment</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {filteredOrders.map((order) => (
                <Collapsible key={order.order_id} asChild>
                    <OrderRow order={order} />
                </Collapsible>
                ))}
            </TableBody>
            </Table>
            {!isLoaded && (
                <div className="text-center py-12 text-muted-foreground">
                    Loading orders...
                </div>
            )}
            {isLoaded && filteredOrders.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                    No orders found.
                </div>
            )}
        </Tabs>
      </CardContent>
    </Card>
  );
}
