"use client";

import Image from "next/image";
import { useParams } from "next/navigation";
import { useOrders } from "@/components/order-provider";
import { formatPrice } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  CheckCircle,
  Package,
  Truck,
  Home,
  XCircle,
  Ban,
  History,
  Undo2,
  Info,
  Printer,
  MessageCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import React from "react";
import { AnimateOnScroll } from "@/components/animate-on-scroll";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Invoice } from "./_components/invoice";
import { useSettings } from "@/app/admin/settings/_components/settings-provider";
import { useAppLayout } from "@/components/app-layout";

export default function OrderDetailsPage() {
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const { getOrderById, updateOrderStatus } = useOrders();
  const { openChatbot } = useAppLayout();
  const order = getOrderById(id);
  const { toast } = useToast();
  const { pdpSettings } = useSettings();

  const handlePrint = () => {
    const printContent = document.getElementById("invoice-content");
    if (printContent) {
      const originalContents = document.body.innerHTML;
      const printSection = printContent.innerHTML;
      document.body.innerHTML = printSection;
      window.print();
      document.body.innerHTML = originalContents;
      window.location.reload();
    }
  };

  if (!order) {
    return (
      <div className="text-center py-12">
        <p>Loading order details...</p>
      </div>
    );
  }

  const handleCancelOrder = async () => {
    try {
      if (order.order_status === "Placed") {
        await updateOrderStatus(order.order_id, "Cancelled");
        toast({
          title: "Order Cancelled",
          description: "Your order has been successfully cancelled.",
        });
      } else if (
        order.order_status === "Processing" ||
        order.order_status === "Shipped"
      ) {
        await updateOrderStatus(order.order_id, "Cancellation Pending");
        toast({
          title: "Cancellation Requested",
          description: "Your request to cancel has been submitted.",
        });
      }
    } catch (error) {
      // The provider will show a toast on error, so we just log it here.
      console.error("Failed to cancel order:", error);
    }
  };

  const isCancelable =
    order.order_status === "Placed" ||
    order.order_status === "Processing" ||
    order.order_status === "Shipped";
  const cancelBtnText =
    order.order_status === "Processing" || order.order_status === "Shipped"
      ? "Request Cancellation"
      : "Cancel Order";

  const statusSteps = ["Placed", "Processing", "Shipped", "Delivered"];
  const statusIcons = {
    Placed: Package,
    Processing: CheckCircle,
    Shipped: Truck,
    Delivered: Home,
    Cancelled: XCircle,
    "Cancellation Pending": Ban,
    Refunded: Undo2,
  };
  const currentStatusIndex = statusSteps.indexOf(order.order_status);

  const subtotal =
    order.order_summary?.subtotal ||
    order.cart_items.reduce((acc, item) => {
      if (!item.product) return acc;
      let itemPrice = item.product.price;
      if (item.customizations) {
        for (const [key, value] of Object.entries(item.customizations)) {
          const customizationConfig = pdpSettings.customizations.find(
            (c) => c.label === key
          );
          if (customizationConfig?.options) {
            const selectedOption = customizationConfig.options.find(
              (opt) => opt.value === value
            );
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
    if (!method) return "N/A";
    switch (method) {
      case "card":
        return "Card";
      case "upi":
        return "UPI";
      case "netbanking":
        return "Netbanking";
      case "wallet":
        return "Wallet";
      default:
        return method.charAt(0).toUpperCase() + method.slice(1);
    }
  };

  return (
    <div className="space-y-8">
      <AnimateOnScroll>
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>Order {order.order_id}</CardTitle>
                <CardDescription>
                  Placed on{" "}
                  {new Date(order.order_date).toLocaleDateString("en-IN", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    openChatbot(`I need help with my order #${order.order_id}`)
                  }
                >
                  <MessageCircle className="mr-2 h-4 w-4" /> Need Help?
                </Button>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Printer className="mr-2 h-4 w-4" /> Invoice
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl">
                    <DialogHeader>
                      <DialogTitle>Invoice</DialogTitle>
                      <DialogDescription>
                        Here is a summary of your order. You can print this page
                        or save it as a PDF.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="max-h-[70vh] overflow-auto p-1">
                      <Invoice order={order} />
                    </div>
                    <DialogFooter>
                      <Button onClick={handlePrint} className="w-full">
                        Print / Save as PDF
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                {isCancelable && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm">
                        {cancelBtnText}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          Are you absolutely sure?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently
                          cancel your order and you may not receive a refund
                          depending on the order status.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Go Back</AlertDialogCancel>
                        <AlertDialogAction onClick={handleCancelOrder}>
                          Continue
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-8">
              {["Cancelled", "Cancellation Pending", "Refunded"].includes(
                order.order_status
              ) ? (
                <div className="flex items-center justify-center text-center p-4 bg-muted rounded-lg">
                  <div
                    className={cn(
                      order.order_status === "Cancelled"
                        ? "text-destructive"
                        : "text-amber-600",
                      order.order_status === "Refunded" && "text-blue-600"
                    )}
                  >
                    {React.createElement(
                      statusIcons[
                        order.order_status as keyof typeof statusIcons
                      ],
                      { className: "w-12 h-12 mx-auto mb-2" }
                    )}
                    <p className="font-semibold text-xl">
                      {order.order_status}
                    </p>
                    {order.order_status === "Cancellation Pending" && (
                      <p className="text-sm text-muted-foreground">
                        Your cancellation request is being reviewed.
                      </p>
                    )}
                    {order.order_status === "Refunded" && (
                      <p className="text-sm text-muted-foreground">
                        Your payment has been refunded.
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex justify-between items-center relative">
                  <div className="absolute left-0 top-1/2 w-full h-0.5 bg-muted -translate-y-1/2" />
                  <div
                    className="absolute left-0 top-1/2 h-0.5 bg-primary -translate-y-1/2"
                    style={{
                      width: `${
                        (currentStatusIndex / (statusSteps.length - 1)) * 100
                      }%`,
                    }}
                  />
                  {statusSteps.map((step, index) => {
                    const isActive = index <= currentStatusIndex;
                    const Icon =
                      statusIcons[step as keyof typeof statusIcons] || History;
                    return (
                      <div key={step} className="z-10 text-center">
                        <div
                          className={cn(
                            "mx-auto h-10 w-10 rounded-full flex items-center justify-center",
                            isActive
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground"
                          )}
                        >
                          <Icon className="h-5 w-5" />
                        </div>
                        <p
                          className={cn(
                            "mt-2 text-sm",
                            isActive
                              ? "font-semibold text-primary"
                              : "text-muted-foreground"
                          )}
                        >
                          {step}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <Separator className="my-6" />

            <div className="space-y-4">
              {order.cart_items.map((item, index) => {
                const product = item.product;
                if (!product) return null;

                let itemPrice = product.price;
                if (item.customizations) {
                  for (const [key, value] of Object.entries(
                    item.customizations
                  )) {
                    const customizationConfig = pdpSettings.customizations.find(
                      (c) => c.label === key
                    );
                    if (customizationConfig?.options) {
                      const selectedOption = customizationConfig.options.find(
                        (opt) => opt.value === value
                      );
                      if (selectedOption?.price_change) {
                        itemPrice += selectedOption.price_change;
                      }
                    }
                  }
                }

                return (
                  <div
                    key={`${product.productId}-${index}`}
                    className="flex items-start gap-4"
                  >
                    <div className="relative w-16 h-16 rounded-md overflow-hidden border">
                      {product.imageUrls[0] && (
                        <Image
                          src={product.imageUrls[0]}
                          alt={product.productName}
                          fill
                          className="object-cover"
                        />
                      )}
                    </div>
                    <div className="flex-grow">
                      <Link
                        href={`/products/${product.productId}`}
                        className="font-semibold hover:text-primary"
                      >
                        {product.productName}
                      </Link>
                      <p className="text-sm text-muted-foreground">
                        Qty: {item.quantity}
                      </p>
                      {item.customizations && (
                        <div className="text-xs text-muted-foreground mt-2 space-y-1">
                          {Object.entries(item.customizations).map(
                            ([key, value]) => {
                              if (
                                !value ||
                                value === "No" ||
                                (typeof value === "object" &&
                                  Object.keys(value).length === 0)
                              )
                                return null;

                              if (typeof value === "object" && value !== null) {
                                return Object.entries(value).map(
                                  ([subKey, subValue]) => (
                                    <div key={subKey}>
                                      <span className="font-semibold">
                                        {subKey}:
                                      </span>{" "}
                                      {subValue as string}
                                    </div>
                                  )
                                );
                              }

                              return (
                                <div key={key}>
                                  <span className="font-semibold">{key}:</span>{" "}
                                  {value as string}
                                </div>
                              );
                            }
                          )}
                        </div>
                      )}
                    </div>
                    <p className="font-semibold">
                      {formatPrice(itemPrice * item.quantity)}
                    </p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </AnimateOnScroll>

      {order.adminComments && (
        <AnimateOnScroll delay={100}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5 text-primary" /> Admin Notes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground italic">
                "{order.adminComments}"
              </p>
            </CardContent>
          </Card>
        </AnimateOnScroll>
      )}

      {(order.status_history || []).length > 0 && (
        <AnimateOnScroll delay={100}>
          <Card>
            <CardHeader>
              <CardTitle>Order History</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4 text-sm">
                {order.status_history?.map((history, index) => (
                  <li
                    key={index}
                    className="flex flex-col sm:flex-row justify-between"
                  >
                    <div>
                      <span>
                        Status set to{" "}
                        <Badge variant="secondary">{history.status}</Badge>
                      </span>
                      {history.comment && (
                        <p className="text-muted-foreground italic pl-4 border-l-2 ml-2 mt-1">
                          "{history.comment}"
                        </p>
                      )}
                    </div>
                    <span className="text-muted-foreground text-xs mt-1 sm:mt-0">
                      {new Date(history.date).toLocaleString("en-IN")}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </AnimateOnScroll>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <AnimateOnScroll delay={200}>
          <Card>
            <CardHeader>
              <CardTitle>Shipping Address</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              <p>{order.shipping_details?.name}</p>
              <p>{order.shipping_details?.address}</p>
              <p>
                {order.shipping_details?.city},{" "}
                {order.shipping_details?.pincode}
              </p>
              <p>{order.shipping_details?.phone}</p>
            </CardContent>
          </Card>
        </AnimateOnScroll>
        <AnimateOnScroll delay={300}>
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Shipping</span>
                <span>{formatPrice(shippingCost)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>{formatPrice(order.total)}</span>
              </div>
              {order.payment_reference_id && (
                <>
                  <Separator />
                  <div className="flex justify-between">
                    <span>Payment Method</span>
                    <span>{getPaymentMethodLabel(paymentMethod)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Transaction ID</span>
                    <span>{order.payment_reference_id}</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </AnimateOnScroll>
      </div>
    </div>
  );
}
