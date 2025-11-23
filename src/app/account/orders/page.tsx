
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
import { Button } from "@/components/ui/button";
import { useOrders } from "@/components/order-provider";
import { formatPrice } from "@/lib/utils";
import { ArrowRight, ShoppingBag } from "lucide-react";
import { AnimateOnScroll } from "@/components/animate-on-scroll";
import type { Order } from "@/lib/types";
import { useEffect } from "react";
import { useAccount } from "../_components/account-provider";

const getBadgeVariant = (status: Order['order_status']) => {
  switch (status) {
    case 'Delivered':
      return 'default';
    case 'Cancelled':
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

export default function OrderHistoryPage() {
  const { orders, fetchOrders, isLoaded } = useOrders();
  const { user, loading: userLoading } = useAccount();

  useEffect(() => {
    if (user?.id) {
      fetchOrders(user.id);
    }
  }, [user, fetchOrders]);
  
  if (userLoading || !isLoaded) {
    return <p>Loading orders...</p>
  }
  
  if (orders.length === 0) {
    return (
       <div className="container mx-auto px-4 md:px-6 py-12 text-center">
        <AnimateOnScroll>
          <ShoppingBag className="mx-auto h-16 w-16 text-muted-foreground" />
          <h1 className="text-3xl md:text-4xl font-bold mt-4">No Orders Yet</h1>
          <p className="text-muted-foreground mt-2">You haven't placed any orders with us yet. Let's change that!</p>
          <Button asChild className="mt-6">
            <Link href="/products">Start Shopping</Link>
          </Button>
        </AnimateOnScroll>
      </div>
    )
  }

  return (
    <AnimateOnScroll>
        <Card>
        <CardHeader>
            <CardTitle>Order History</CardTitle>
            <CardDescription>View your past orders and their status.</CardDescription>
        </CardHeader>
        <CardContent>
            <Table>
            <TableHeader>
                <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="w-24"></TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {orders.map(order => (
                <TableRow key={order.order_id}>
                    <TableCell className="font-medium">{order.order_id}</TableCell>
                    <TableCell>{new Date(order.order_date).toLocaleDateString('en-IN')}</TableCell>
                    <TableCell>
                      <Badge variant={getBadgeVariant(order.order_status)}>{order.order_status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">{formatPrice(order.total)}</TableCell>
                    <TableCell>
                        <Button asChild variant="outline" size="sm">
                            <Link href={`/account/orders/${order.order_id}`}>View <ArrowRight className="ml-2 h-4 w-4"/></Link>
                        </Button>
                    </TableCell>
                </TableRow>
                ))}
            </TableBody>
            </Table>
        </CardContent>
        </Card>
    </AnimateOnScroll>
  );
}
