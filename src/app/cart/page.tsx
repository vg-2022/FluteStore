

'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { formatPrice } from '@/lib/utils';
import { Minus, Plus, Trash2, ArrowRight, ShoppingCart, Tag, Info, ChevronDown, MapPin, Edit, PlusCircle, Sparkles } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useCart } from '@/components/cart-provider';
import { AnimateOnScroll } from '@/components/animate-on-scroll';
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useOrders } from '@/components/order-provider';
import { useRouter } from 'next/navigation';
import { Label } from '@/components/ui/label';
import { AddressForm } from '../account/addresses/_components/address-form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { createOrder as createRazorpayOrder, verifyPayment } from '@/app/actions/payment';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import type { UserAddress, PDPSettings, PDPCustomizationOption, Coupon } from '@/lib/types';
import { createOrderInDatabase } from '@/app/actions/create-order';
import { useSettings } from '../admin/settings/_components/settings-provider';
import { applyCoupon, getAvailableCoupons } from '@/app/actions/coupon-actions';


declare const window: any;

export default function CartPage() {
  const { cartItems, updateQuantity, removeFromCart, total, clearCart } = useCart();
  const { pdpSettings, shippingSettings, storeDetails } = useSettings();
  const { addOrder } = useOrders();
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();
  
  const [couponCode, setCouponCode] = React.useState('');
  const [couponDiscount, setCouponDiscount] = React.useState(0);
  const [appliedCoupon, setAppliedCoupon] = React.useState<string | null>(null);
  const [availableCoupons, setAvailableCoupons] = React.useState<Coupon[]>([]);
  const [isProcessing, setIsProcessing] = React.useState(false);

  const [shippingAddresses, setShippingAddresses] = React.useState<UserAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = React.useState<number | null>(null);
  
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loadingAddresses, setLoadingAddresses] = useState(true);

  const [isShippingOpen, setIsShippingOpen] = React.useState(false);
  const [isAddressFormOpen, setIsAddressFormOpen] = React.useState(false);
  const [editingAddress, setEditingAddress] = React.useState<UserAddress | null>(null);
  
  useEffect(() => {
    async function fetchCoupons() {
        const coupons = await getAvailableCoupons();
        setAvailableCoupons(coupons);
    }
    fetchCoupons();
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        setUser(session?.user ?? null);
    });
     supabase.auth.getUser().then(({ data: { user } }) => {
        setUser(user);
    });
    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  const loadAddresses = useCallback(async () => {
    if (!user) return;
    setLoadingAddresses(true);
    const { data, error } = await supabase
        .from('shipping_details')
        .select('addresses')
        .eq('user_id', user.id)
        .single();

    if (error && error.code !== 'PGRST116') { // Ignore 'single row not found' error
        toast({ variant: 'destructive', title: 'Error fetching addresses', description: error.message });
        setShippingAddresses([]);
    } else if (data?.addresses) {
        const fetchedAddresses: UserAddress[] = data.addresses;
        const sortedAddresses = fetchedAddresses.sort((a, b) => (b.is_default ? 1 : -1));
        setShippingAddresses(sortedAddresses);
        
        const defaultAddress = sortedAddresses.find(a => a.is_default);
        if (defaultAddress) {
            setSelectedAddressId(defaultAddress.id);
        } else if (sortedAddresses.length > 0) {
            setSelectedAddressId(sortedAddresses[0].id);
        }
    } else {
        setShippingAddresses([]);
    }
    setLoadingAddresses(false);
  }, [user, supabase, toast]);

  useEffect(() => {
    if (user) {
      loadAddresses();
    }
  }, [user, loadAddresses]);


  const selectedAddress = shippingAddresses.find(a => a.id === selectedAddressId);

  const subtotal = total;

  const shippingFee = useMemo(() => {
    if (subtotal === 0) return 0;
    // Check for free shipping threshold
    if (shippingSettings.freeShippingThreshold > 0 && subtotal >= shippingSettings.freeShippingThreshold) {
      return 0;
    }
    // Calculate shipping based on rules
    let calculatedShipping = shippingSettings.defaultRate || 0;
    cartItems.forEach(item => {
        if (item.product.shippingCostOverride && item.product.shippingCostOverride > 0) {
            // If there's an override, we might add it or use it exclusively.
            // For simplicity, let's assume overrides are added to the base.
            // A more complex logic could be implemented here.
            calculatedShipping += item.product.shippingCostOverride * item.quantity;
        }
    });
    // If default rate was used and items have overrides, perhaps we should only use overrides.
    // Let's refine: if any item has an override, we sum those, otherwise use default.
    const itemsWithOverride = cartItems.filter(item => item.product.shippingCostOverride && item.product.shippingCostOverride > 0);
    if (itemsWithOverride.length > 0) {
        return itemsWithOverride.reduce((acc, item) => acc + (item.product.shippingCostOverride! * item.quantity), 0);
    }

    return shippingSettings.defaultRate || 0;
  }, [subtotal, cartItems, shippingSettings]);
  
  const totalMRP = useMemo(() => {
    return cartItems.reduce((acc, item) => {
      let mrp = item.product.mrp || item.product.price;
       if (item.customizations) {
        for (const [key, value] of Object.entries(item.customizations)) {
          const customizationConfig = pdpSettings.customizations.find(c => c.label === key);
          if (customizationConfig?.options) {
            const selectedOption = customizationConfig.options.find(opt => opt.value === value);
            if (selectedOption?.price_change) {
              mrp += selectedOption.price_change;
            }
          }
        }
      }
      return acc + mrp * item.quantity;
    }, 0);
  }, [cartItems, pdpSettings.customizations]);

  const productDiscount = totalMRP - subtotal;
  const totalDiscount = productDiscount + couponDiscount;
  const grandTotal = subtotal + shippingFee - couponDiscount;
  
  const handleApplyCoupon = useCallback(async (code: string) => {
    if (!code) {
        toast({ variant: 'destructive', title: 'Please enter a coupon code.' });
        return;
    }

    const result = await applyCoupon(code, subtotal);

    if (result.success) {
        setCouponDiscount(result.discountAmount);
        setAppliedCoupon(code.toUpperCase());
        toast({ title: 'Coupon Applied!', description: `You saved ${formatPrice(result.discountAmount)}.` });
    } else {
        setCouponDiscount(0);
        setAppliedCoupon(null);
        toast({ variant: 'destructive', title: 'Invalid Coupon', description: result.error });
    }
  }, [subtotal, toast]);

  const handlePlaceOrder = async () => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Please sign in to place an order.'});
      router.push('/account');
      return;
    }
  
    setIsProcessing(true);
    if (!selectedAddress) {
      toast({ variant: "destructive", title: "Please select a shipping address." });
      setIsProcessing(false);
      return;
    }
  
    try {
      const razorpayOrder = await createRazorpayOrder(grandTotal);
  
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: razorpayOrder.amount,
        currency: "INR",
        name: storeDetails?.name || "FluteStore",
        description: "Test Transaction",
        order_id: razorpayOrder.id,
        handler: async function (response: any) {
          const verificationResult = await verifyPayment({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          });

          if (verificationResult.isVerified) {
             const newOrderPayload = {
                user_id: user.id,
                cart_items: cartItems.map(item => ({
                    productId: item.product.productId,
                    quantity: item.quantity,
                    customizations: item.customizations,
                })),
                total: grandTotal,
                payment_reference_id: response.razorpay_payment_id,
                shipping_details: {
                    name: selectedAddress.name,
                    address: `${selectedAddress.address_line_1}, ${selectedAddress.street}`,
                    city: `${selectedAddress.city}, ${selectedAddress.state}`,
                    pincode: selectedAddress.pincode,
                    phone: selectedAddress.phone_number,
                },
                order_summary: {
                    subtotal: subtotal,
                    shipping: shippingFee,
                    coupon_discount: couponDiscount,
                    coupon_code: appliedCoupon,
                    total_discount: totalDiscount,
                    grand_total: grandTotal,
                    payment_method: verificationResult.paymentMethod,
                }
            };
            
            const newOrder = await createOrderInDatabase(newOrderPayload);
            
            if (newOrder) {
              clearCart();
              addOrder(newOrder); // Add to local state
              toast({
                  title: 'Order Placed!',
                  description: `Your order #${newOrder.order_id} has been successfully placed.`,
              });
      
              router.push(`/account/orders/${newOrder.order_id}`);
            } else {
                 toast({ variant: "destructive", title: "Order creation failed.", description: "Your order could not be saved after payment. Please contact support." });
            }
          } else {
             toast({ variant: "destructive", title: "Payment verification failed." });
          }
        },
        prefill: {
          name: selectedAddress.name,
          email: user.email || '',
          contact: selectedAddress.phone_number,
        },
        theme: {
          color: "#4B0082",
        },
      };
      
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
       const errorMessage = error instanceof Error ? error.message : "Please try again later.";
       toast({ variant: "destructive", title: "Could not create order.", description: errorMessage });
    } finally {
        setIsProcessing(false);
    }
  };
  
  const handleAddressFormSuccess = () => {
    setIsAddressFormOpen(false);
    setEditingAddress(null);
    loadAddresses();
  };


  if (cartItems.length === 0) {
    return (
      <div className="container mx-auto px-4 md:px-6 py-12 text-center">
        <AnimateOnScroll>
          <ShoppingCart className="mx-auto h-16 w-16 text-muted-foreground" />
          <h1 className="text-3xl md:text-4xl font-bold mt-4">Your Cart is Empty</h1>
          <p className="text-muted-foreground mt-2">Looks like you haven't added anything to your cart yet.</p>
          <Button asChild className="mt-6">
            <Link href="/products">Start Shopping</Link>
          </Button>
        </AnimateOnScroll>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 md:px-6 py-12">
      <h1 className="text-3xl md:text-4xl font-bold text-center mb-8">Your Shopping Cart</h1>
      
      <div className="mb-8">
        <AnimateOnScroll>
            <Collapsible open={isShippingOpen} onOpenChange={setIsShippingOpen} className="mb-8">
                <Card>
                    <CollapsibleTrigger asChild>
                        <div className="flex items-center justify-between p-4 cursor-pointer">
                            <div className="flex items-center gap-3">
                                <MapPin className="h-5 w-5 text-muted-foreground"/>
                                <div>
                                    <h3 className="font-semibold">Ship to</h3>
                                     {selectedAddress ? (
                                        <p className="text-sm text-muted-foreground">
                                            {selectedAddress.name}, {selectedAddress.address_line_1}, {selectedAddress.street}, {selectedAddress.city}...
                                        </p>
                                     ) : (
                                        <p className="text-sm text-destructive">No address selected</p>
                                     )}
                                </div>
                            </div>
                            <Button variant="ghost" size="sm">
                                Change
                                <ChevronDown className={`ml-2 h-4 w-4 transition-transform ${isShippingOpen ? 'rotate-180' : ''}`} />
                            </Button>
                        </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                        <CardContent className="pt-0 pb-6 px-6 border-t mt-4 pt-6">
                            <RadioGroup value={selectedAddressId?.toString()} onValueChange={(val) => setSelectedAddressId(Number(val))}>
                                <div className="space-y-4">
                                    {shippingAddresses.map(address => (
                                        <div key={address.id} className={cn("rounded-lg border p-4 flex justify-between items-start", selectedAddressId === address.id && "border-primary")}>
                                            <div className="flex items-start gap-4">
                                                <RadioGroupItem value={address.id.toString()} id={`addr-${address.id}`} className="mt-1"/>
                                                <Label htmlFor={`addr-${address.id}`} className="font-normal">
                                                    <p className="font-semibold">{address.name} {address.is_default && <span className="text-xs font-normal text-muted-foreground">(Default)</span>}</p>
                                                    <p className="text-muted-foreground">{address.address_line_1}, {address.street}</p>
                                                    <p className="text-muted-foreground">{address.city}, {address.state} - {address.pincode}</p>
                                                    <p className="text-muted-foreground">{address.phone_number}</p>
                                                </Label>
                                            </div>
                                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditingAddress(address); setIsAddressFormOpen(true); }}>
                                                <Edit className="h-4 w-4"/>
                                            </Button>
                                        </div>
                                    ))}
                                    {loadingAddresses && <p>Loading addresses...</p>}
                                    {!loadingAddresses && shippingAddresses.length === 0 && (
                                      <p className="text-muted-foreground text-center py-4">You have no saved addresses.</p>
                                    )}
                                </div>
                            </RadioGroup>
                            <Button variant="outline" className="mt-4 w-full" onClick={() => { setEditingAddress(null); setIsAddressFormOpen(true); }}><PlusCircle className="mr-2 h-4 w-4" /> Add New Address</Button>
                        </CardContent>
                    </CollapsibleContent>
                </Card>
            </Collapsible>
        </AnimateOnScroll>
      </div>
      
       <Dialog open={isAddressFormOpen} onOpenChange={(open) => {
            setIsAddressFormOpen(open);
            if (!open) setEditingAddress(null);
        }}>
            <DialogContent className="sm:max-w-[425px] md:max-w-lg">
                <DialogHeader>
                    <DialogTitle>{editingAddress ? 'Edit Address' : 'Add New Address'}</DialogTitle>
                </DialogHeader>
                <ScrollArea className="h-[calc(80vh-4rem)] pr-6 -mr-6">
                    <AddressForm 
                        userId={user?.id}
                        address={editingAddress}
                        existingAddresses={shippingAddresses}
                        onSuccess={handleAddressFormSuccess}
                    />
                </ScrollArea>
            </DialogContent>
        </Dialog>


      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2 space-y-4">
          <AnimateOnScroll>
            <Card>
              <CardHeader>
                <CardTitle>Items in your cart ({cartItems.length})</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  {cartItems.map((item, index) => {
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
                      <div key={`${item.product.productId}-${index}`} className="flex flex-col sm:flex-row p-4 gap-4">
                        <div className="w-24 h-24 relative flex-shrink-0 self-center">
                          {item.product.imageUrls && item.product.imageUrls[0] && (
                            <Image src={item.product.imageUrls[0]} alt={item.product.productName} fill className="object-cover rounded-md" />
                          )}
                        </div>
                        <div className="flex-grow text-center sm:text-left">
                          <Link href={`/products/${item.product.productId}`} className="font-semibold hover:text-primary">{item.product.productName}</Link>
                            {item.customizations && (
                                <div className="text-xs text-muted-foreground mt-2 space-y-1">
                                    {Object.entries(item.customizations).map(([key, value]) => {
                                        if (!value || value === 'No' || (typeof value === 'object' && Object.keys(value).length === 0)) return null;

                                        if (typeof value === 'object' && value !== null) {
                                            return Object.entries(value).map(([subKey, subValue]) => (
                                                <div key={`${key}-${subKey}`}><span className="font-semibold">{subKey}:</span> {subValue as string}</div>
                                            ));
                                        }

                                        return <div key={key}><span className="font-semibold">{key}:</span> {value as string}</div>
                                    })}
                                </div>
                            )}
                        </div>
                        <div className="flex items-center justify-center gap-2">
                          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateQuantity(item.product.productId, item.quantity - 1, item.customizations)}><Minus className="h-4 w-4" /></Button>
                          <span className="font-bold w-8 text-center">{item.quantity}</span>
                          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateQuantity(item.product.productId, item.quantity + 1, item.customizations)}><Plus className="h-4 w-4" /></Button>
                        </div>
                        <div className="font-bold w-24 text-center sm:text-right">{formatPrice(itemPrice * item.quantity)}</div>
                        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive mx-auto sm:mx-0" onClick={() => removeFromCart(item.product.productId, item.customizations)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </AnimateOnScroll>
        </div>
        <div className="lg:col-span-1 space-y-8 sticky top-24">
            <AnimateOnScroll delay={100}>
                <Card>
                    <CardHeader>
                        <CardTitle>Apply Coupon</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex w-full items-center space-x-2">
                            <div className="relative flex-grow">
                                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input 
                                    type="text" 
                                    placeholder="Enter Coupon Code" 
                                    className="pl-10"
                                    value={couponCode}
                                    onChange={(e) => setCouponCode(e.target.value)}
                                />
                            </div>
                            <Button type="submit" variant="secondary" onClick={() => handleApplyCoupon(couponCode)}>Apply</Button>
                        </div>
                         {availableCoupons.length > 0 && (
                            <Collapsible>
                                <CollapsibleTrigger asChild>
                                    <Button variant="link" className="p-0 h-auto text-xs">
                                        <Sparkles className="mr-2 h-3 w-3" />
                                        View Available Coupons
                                        <ChevronDown className="ml-1 h-3 w-3" />
                                    </Button>
                                </CollapsibleTrigger>
                                <CollapsibleContent>
                                    <div className="mt-2 space-y-2">
                                        {availableCoupons.map(coupon => (
                                            <div
                                                key={coupon.coupon_id}
                                                className="flex justify-between items-center text-xs p-2 rounded-md border border-dashed border-primary/50 bg-primary/10 cursor-pointer hover:bg-primary/20"
                                                onClick={() => {
                                                    setCouponCode(coupon.coupon_code);
                                                    handleApplyCoupon(coupon.coupon_code);
                                                }}
                                            >
                                                <span className="font-mono font-semibold">{coupon.coupon_code}</span>
                                                <span className="text-primary">
                                                    {coupon.discount_type === 'percentage' ? `${coupon.discount_value}% OFF` : `${formatPrice(coupon.discount_value)} OFF`}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </CollapsibleContent>
                            </Collapsible>
                         )}
                    </CardContent>
                </Card>
            </AnimateOnScroll>

            <AnimateOnScroll delay={200}>
              <Card>
                  <CardHeader>
                    <CardTitle>Price Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                      <div className="flex justify-between">
                          <span className="text-muted-foreground">Total MRP</span>
                          <span>{formatPrice(totalMRP)}</span>
                      </div>
                       <div className="flex justify-between text-green-600">
                          <span className="text-muted-foreground">Discount on MRP</span>
                          <span>-{formatPrice(productDiscount)}</span>
                      </div>
                      <div className="flex justify-between">
                          <span className="font-semibold">Subtotal</span>
                          <span className="font-semibold">{formatPrice(subtotal)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Coupon Discount</span>
                          {couponDiscount > 0 ? (
                            <span className="text-green-600">-{formatPrice(couponDiscount)}</span>
                          ) : (
                             <span className="text-muted-foreground">N/A</span>
                          )}
                      </div>
                      <div className="flex justify-between">
                          <span className="text-muted-foreground">Shipping Fee</span>
                           {shippingFee === 0 && subtotal > 0 ? (
                            <span className="line-through">{formatPrice(shippingSettings.defaultRate)}</span>
                          ) : null}
                          <span className={shippingFee === 0 && subtotal > 0 ? 'text-green-600' : ''}>
                            {shippingFee === 0 && subtotal > 0 ? 'FREE' : formatPrice(shippingFee)}
                          </span>
                      </div>
                      <Separator />
                      <div className="flex justify-between font-bold text-lg">
                          <span>Total Payable</span>
                          <span>{formatPrice(grandTotal)}</span>
                      </div>
                  </CardContent>
                  {totalDiscount > 0 && (
                    <CardFooter className="bg-green-50 dark:bg-green-900/20 p-4 rounded-b-lg">
                        <p className="text-sm font-semibold text-green-600">You will save {formatPrice(totalDiscount)} on this order!</p>
                    </CardFooter>
                  )}
              </Card>
            </AnimateOnScroll>
            <AnimateOnScroll delay={300}>
                <Button size="lg" className="w-full group mt-4" onClick={handlePlaceOrder} disabled={isProcessing}>
                    {isProcessing ? "Processing..." : <>Proceed to Payment <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" /></> }
                </Button>
            </AnimateOnScroll>
        </div>
      </div>
    </div>
  );
}
