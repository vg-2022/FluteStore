
'use client';

import Image from "next/image";
import React, { useCallback, useEffect, useState, useMemo } from "react";
import type { Product, Review, PDPCustomization, PDPCustomizationOption, StringColor } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Star, ShoppingCart, Minus, Plus, PlayCircle, Trash2, Info } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import {
  Carousel,
  type CarouselApi,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Badge } from "@/components/ui/badge";
import { useCart } from "./cart-provider";
import { cn } from "@/lib/utils";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { AnimateOnScroll } from "@/components/animate-on-scroll";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { CartItem } from "./cart-provider";
import { createClient } from "@/lib/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "./ui/form";
import { useToast } from "@/hooks/use-toast";
import type { User } from "@supabase/supabase-js";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { useSettings } from "@/app/admin/settings/_components/settings-provider";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";


const reviewSchema = z.object({
  rating_value: z.number().min(1, "Rating is required").max(5),
  review_title: z.string().min(1, "Title is required").max(100),
  review_desc: z.string().min(1, "Review text is required").max(1000),
});


function ReviewForm({ product, user, onReviewSubmitted }: { product: Product, user: User, onReviewSubmitted: () => void }) {
  const supabase = createClient();
  const { toast } = useToast();
  
  const form = useForm({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      rating_value: 0,
      review_title: "",
      review_desc: "",
    },
  });
  
  const onSubmit = async (values: z.infer<typeof reviewSchema>) => {
    const { data, error } = await supabase.from('reviews').insert({
      product_id: product.productId,
      user_id: user.id,
      rating_value: values.rating_value,
      review_title: values.review_title,
      review_desc: values.review_desc,
      status: 'pending'
    });

    if (error) {
      toast({ variant: "destructive", title: "Error submitting review", description: error.message });
    } else {
      toast({ title: "Review Submitted!", description: "Thank you! Your review is pending approval." });
      onReviewSubmitted();
    }
  };

  return (
     <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="rating_value"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Your Rating</FormLabel>
              <FormControl>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={cn("w-6 h-6 cursor-pointer transition-colors", star <= field.value ? "text-yellow-400 fill-yellow-400" : "text-gray-300")}
                      onClick={() => field.onChange(star)}
                    />
                  ))}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="review_title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Review Title</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Best flute I've ever played!" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="review_desc"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Your Review</FormLabel>
              <FormControl>
                <Textarea placeholder="Share your thoughts about the product..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Submitting..." : "Submit Review"}
        </Button>
      </form>
    </Form>
  )
}

function MultipleColorSelector({ customization, value, onChange }: { customization: PDPCustomization, value: any, onChange: (value: any) => void }) {
    const count = customization.count || 1;
    const colors = customization.colors || [];

    const handleColorChange = (index: number, colorValue: string) => {
        const newColors = { ...(value || {}) };
        newColors[`Color ${index + 1}`] = colorValue;
        onChange(newColors);
    };

    return (
        <div className="space-y-2">
            <Label className="font-semibold text-base">{customization.label}</Label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {Array.from({ length: count }).map((_, index) => (
                    <div key={index}>
                        <Label htmlFor={`color-${index}`} className="text-sm text-muted-foreground">{`String Color ${index + 1}`}</Label>
                        <Select
                            value={value?.[`Color ${index + 1}`] || colors[0]?.value}
                            onValueChange={(val) => handleColorChange(index, val)}
                        >
                            <SelectTrigger id={`color-${index}`} className="mt-1">
                                <SelectValue placeholder="Select color" />
                            </SelectTrigger>
                            <SelectContent>
                                {colors.map((option: StringColor) => (
                                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                ))}
            </div>
        </div>
    );
}

function DynamicCustomization({ customization, value, onChange }: { customization: PDPCustomization, value: any, onChange: (value: any) => void }) {
    const isEngraving = customization.label.toLowerCase().includes('engrav');

    if (customization.type === 'multiple-color-select') {
        return <MultipleColorSelector customization={customization} value={value} onChange={onChange} />;
    }

    switch(customization.type) {
        case 'radio':
            return (
                <div>
                    <Label className="font-semibold text-base">{customization.label}</Label>
                    <RadioGroup value={value} onValueChange={onChange} className="mt-2 grid grid-cols-2 gap-4">
                        {customization.options?.map(option => (
                             <div key={option.value}>
                                <RadioGroupItem value={option.value} id={option.value} className="peer sr-only" />
                                <Label htmlFor={option.value} className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                                    {option.label}
                                    {option.price_change && option.price_change > 0 && <span className="font-normal text-sm text-primary">(+ {formatPrice(option.price_change)})</span>}
                                </Label>
                             </div>
                        ))}
                    </RadioGroup>
                </div>
            );
        case 'select':
            return (
                <div>
                    <Label htmlFor={customization.id} className="font-semibold text-base">{customization.label}</Label>
                    <Select value={value} onValueChange={onChange}>
                        <SelectTrigger id={customization.id} className="mt-1">
                            <SelectValue placeholder={`Select ${customization.label}`} />
                        </SelectTrigger>
                        <SelectContent>
                            {customization.options?.map(option => (
                                <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            )
        case 'checkbox':
             return (
                <div className="flex items-center space-x-2">
                    <Checkbox id={customization.id} checked={value} onCheckedChange={onChange} />
                    <Label htmlFor={customization.id} className="font-semibold">{customization.label}</Label>
                </div>
            )
        case 'text':
             return (
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <Label htmlFor={customization.id} className="font-semibold">{customization.label}</Label>
                        {isEngraving && (
                            <Dialog>
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <DialogTrigger asChild>
                                                <Info className="h-4 w-4 text-muted-foreground cursor-pointer" />
                                            </DialogTrigger>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Return policy information</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                                <DialogContent className="sm:max-w-md">
                                    <DialogHeader>
                                        <DialogTitle>Return & Refund Policy</DialogTitle>
                                    </DialogHeader>
                                    <div className="py-4">
                                        <p>Items with custom name engraving are personalized specifically for you. Due to their custom nature, these items cannot be returned or refunded if you are not satisfied with the product. Please ensure you are happy with your choice before adding an engraving.</p>
                                    </div>
                                </DialogContent>
                            </Dialog>
                        )}
                    </div>
                    <Input id={customization.id} value={value ?? ''} onChange={(e) => onChange(e.target.value)} placeholder={(customization.default_value as string) || ''} />
                </div>
            )
        case 'textarea':
             return (
                <div className="space-y-2">
                    <Label htmlFor={customization.id} className="font-semibold">{customization.label}</Label>
                    <Textarea id={customization.id} value={value ?? ''} onChange={(e) => onChange(e.target.value)} placeholder={(customization.default_value as string) || ''} />
                </div>
            )
        default:
            return null;
    }
}


export function ProductDetailsClient({ product }: { product: Product }) {
  const supabase = createClient();
  const { toast } = useToast();
  const { pdpSettings } = useSettings();
  const { addToCart, updateQuantity, getCartItem } = useCart();
  const [api, setApi] = React.useState<CarouselApi>()
  const [current, setCurrent] = React.useState(0);
  const [reviews, setReviews] = React.useState<any[]>([]);
  const [hasPurchased, setHasPurchased] = React.useState(false);
  const [user, setUser] = React.useState<User | null>(null);
  const [isReviewFormOpen, setIsReviewFormOpen] = React.useState(false);
  const [reviewToDelete, setReviewToDelete] = React.useState<any | null>(null);
  
  const [customizationState, setCustomizationState] = useState<Record<string, any>>({});
  
  const applicableCustomizations = useMemo(() => {
    return pdpSettings.customizations.filter(cust => {
      if (!cust.productTypes || cust.productTypes.length === 0) {
        return true;
      }
      return cust.productTypes.includes(product.productType);
    });
  }, [pdpSettings.customizations, product.productType]);

   useEffect(() => {
    const defaultState: Record<string, any> = {};
    applicableCustomizations.forEach(cust => {
        if (cust.type === 'multiple-color-select') {
            const colors: Record<string, string> = {};
            const count = cust.count || 1;
            for (let i = 0; i < count; i++) {
                colors[`Color ${i + 1}`] = cust.colors?.[0]?.value; 
            }
            defaultState[cust.label] = colors;
        } else if (cust.type === 'checkbox') {
            defaultState[cust.label] = cust.default_value || false;
        }
        else {
            defaultState[cust.label] = cust.default_value;
        }
    });
    setCustomizationState(defaultState);
  }, [applicableCustomizations]);
  
  const handleCustomizationChange = (label: string, value: any) => {
    setCustomizationState(prevState => ({...prevState, [label]: value}));
  }

  const finalCustomizations = useMemo(() => {
      const result: Record<string, any> = {};
      applicableCustomizations.forEach(cust => {
          const value = customizationState[cust.label];
          if (cust.type === 'checkbox') {
              // Only include the checkbox customization if it's checked (true)
              if (value) {
                result[cust.label] = 'Yes';
              }
          } else if (value) { // For other types, only include if a value is set
              result[cust.label] = value;
          }
      });
      return result;
  }, [customizationState, applicableCustomizations]);


  const fetchReviews = useCallback(async () => {
    const { data } = await supabase.from('reviews_with_user_info').select('*').eq('product_id', product.productId).eq('status', 'approved');
    setReviews(data || []);
  }, [supabase, product.productId]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);
  
  useEffect(() => {
    const checkUserAndPurchase = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user && product) {
        const { data: orders, error } = await supabase
            .from('orders')
            .select('cart_items')
            .eq('user_id', user.id)
            .in('order_status', ['Delivered', 'Shipped']);
            
        if (orders) {
            const purchased = orders.some(order => 
                (order.cart_items as any[]).some(item => item.productId === product.productId)
            );
            setHasPurchased(purchased);
        }
      }
    };
    checkUserAndPurchase();
  }, [supabase, product]);


  const cartItem: CartItem | undefined = getCartItem(product.productId, finalCustomizations);
  const quantity = cartItem?.quantity || 0;

  React.useEffect(() => {
    if (!api) return;
    setCurrent(api.selectedScrollSnap());
    api.on("select", () => setCurrent(api.selectedScrollSnap()));
  }, [api]);
  
  const handleAddToCart = () => {
    if(product) addToCart(product, 1, finalCustomizations);
  };
   
  const handleUpdateQuantity = (newQuantity: number) => {
    updateQuantity(product.productId, newQuantity, finalCustomizations);
  };

  const handleDeleteReview = async () => {
    if (!reviewToDelete || !user) return;
    const { error } = await supabase
      .from('reviews')
      .delete()
      .match({ user_id: user.id, product_id: reviewToDelete.product_id });

    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Could not delete your review.' });
    } else {
      toast({ title: 'Review Deleted' });
      fetchReviews(); // Re-fetch reviews to update the list
    }
    setReviewToDelete(null);
  };

  const productImages = product.imageUrls || [];
  
  const avgRating = product.avgRating;
  const reviewCount = product.reviewCount;
  
  const ratingDistribution = React.useMemo(() => {
    if (reviewCount === 0) return { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    const counts = reviews.reduce((acc, review) => {
        acc[review.rating_value] = (acc[review.rating_value] || 0) + 1;
        return acc;
    }, {} as Record<number, number>);

    return {
        5: ((counts[5] || 0) / reviewCount) * 100,
        4: ((counts[4] || 0) / reviewCount) * 100,
        3: ((counts[3] || 0) / reviewCount) * 100,
        2: ((counts[2] || 0) / reviewCount) * 100,
        1: ((counts[1] || 0) / reviewCount) * 100,
    };
  }, [reviews, reviewCount]);

  return (
    <>
      <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
        {/* Image Gallery */}
        <AnimateOnScroll>
            <div className="flex flex-col gap-4">
            <Carousel setApi={setApi} className="w-full">
                <CarouselContent>
                    {productImages.map((imageUrl, index) => (
                    <CarouselItem key={index}>
                        <Card className="overflow-hidden">
                        <CardContent className="p-0">
                            <div className="aspect-square w-full relative">
                            {imageUrl && (
                                <Image
                                src={imageUrl}
                                alt={`${product.productName} - view ${index + 1}`}
                                fill
                                className="object-cover"
                                priority={index === 0}
                                />
                            )}
                            {product.tags && product.tags[0] && <Badge className="absolute top-4 left-4" variant={product.tags[0] === 'New' ? 'default' : 'secondary'}>{product.tags[0]}</Badge>}
                            </div>
                        </CardContent>
                        </Card>
                    </CarouselItem>
                    ))}
                </CarouselContent>
                <CarouselPrevious className="left-4" />
                <CarouselNext className="right-4" />
            </Carousel>
            <div className="grid grid-cols-5 gap-2">
                {productImages.map((imageUrl, i) => (
                <button key={i} onClick={() => api?.scrollTo(i)} className={cn("overflow-hidden rounded-lg border-2", current === i ? "border-primary" : "border-transparent")}>
                    <div className="aspect-square relative">
                    {imageUrl && <Image src={imageUrl} alt={`Thumbnail ${i+1}`} fill className="object-cover" />}
                    </div>
                </button>
                ))}
            </div>
            </div>
        </AnimateOnScroll>

        {/* Product Info */}
        <AnimateOnScroll delay={100} className="flex flex-col gap-4">
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold">{product.productName}</h1>
            <div className="mt-2 flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-600" />
                  <span className="text-muted-foreground">{avgRating.toFixed(1)} ({reviewCount} reviews)</span>
                </div>
            </div>
          </div>
          
          <p className="text-muted-foreground text-base">{product.description}</p>
          
          <div>
            <span className="text-3xl font-bold">{formatPrice(product.price)}</span>
            {product.mrp && <span className="ml-2 text-muted-foreground line-through">{formatPrice(product.mrp)}</span>}
          </div>

          {product.audioUrl && (
            <Card>
              <CardContent className="p-4 flex items-center gap-4">
                <PlayCircle className="w-6 h-6 text-primary" />
                <div className="flex-grow">
                  <Label className="font-semibold">Listen to a sample</Label>
                  <audio controls className="w-full mt-2">
                    <source src={product.audioUrl} type="audio/mpeg" />
                    Your browser does not support the audio element.
                  </audio>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Customization Options */}
          {applicableCustomizations.length > 0 && (
            <div className="space-y-6">
                  {applicableCustomizations.map(cust => (
                      <DynamicCustomization 
                          key={cust.id}
                          customization={cust}
                          value={customizationState[cust.label]}
                          onChange={(value) => handleCustomizationChange(cust.label, value)}
                      />
                  ))}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4 mt-4">
             {quantity === 0 ? (
                <Button size="lg" className="flex-1" onClick={handleAddToCart}><ShoppingCart className="mr-2 h-5 w-5" /> Add to Cart</Button>
              ) : (
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" className="h-12 w-12" onClick={() => handleUpdateQuantity(quantity - 1)}><Minus className="h-4 w-4" /></Button>
                  <span className="text-lg font-bold w-12 text-center">{quantity}</span>
                  <Button variant="outline" size="icon" className="h-12 w-12" onClick={() => handleUpdateQuantity(quantity + 1)}><Plus className="h-4 w-4" /></Button>
                </div>
             )}
          </div>

          <Separator />
          
           <div className="grid gap-2 text-sm">
            <h3 className="font-semibold text-lg">Specifications</h3>
            {product.specifications && Object.entries(product.specifications).map(([key, value]) => (
                <div key={key} className="grid grid-cols-2">
                    <span className="text-muted-foreground">{key}</span>
                    <span>{value as string}</span>
                </div>
            ))}
           </div>
        </AnimateOnScroll>
      </div>

      <div className="mt-16">
        <h2 className="text-2xl font-bold mb-6">Customer Reviews & Ratings</h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
            <div className="md:col-span-2">
                <AnimateOnScroll>
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Overall Rating</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-2">
                                <p className="text-4xl font-bold">{avgRating.toFixed(1)}</p>
                                <div className="flex flex-col">
                                    <div className="flex text-yellow-400">
                                        {[...Array(Math.floor(avgRating))].map((_, i) => <Star key={i} className="w-5 h-5 fill-current stroke-yellow-600" />)}
                                        {[...Array(5 - Math.floor(avgRating))].map((_, i) => <Star key={i} className="w-5 h-5 fill-current text-gray-300 dark:text-gray-600" />)}
                                    </div>
                                    <p className="text-sm text-muted-foreground">{reviewCount} reviews</p>
                                </div>
                            </div>
                            <div className="space-y-2">
                                {(Object.keys(ratingDistribution).reverse() as (keyof typeof ratingDistribution)[]).map(star => (
                                    <div key={star} className="flex items-center gap-2">
                                        <span className="text-sm text-muted-foreground">{star} star</span>
                                        <Progress value={ratingDistribution[star]} className="w-full h-2" />
                                        <span className="text-sm text-muted-foreground w-8 text-right">{ratingDistribution[star].toFixed(0)}%</span>
                                    </div>
                                ))}
                            </div>
                            <Dialog open={isReviewFormOpen} onOpenChange={setIsReviewFormOpen}>
                              <DialogTrigger asChild>
                                {user ? (
                                    <Button variant="outline" className="w-full" disabled={!hasPurchased}>
                                      {hasPurchased ? "Write a Review" : "Buy to Review"}
                                    </Button>
                                ) : (
                                    <Button variant="outline" className="w-full" asChild>
                                      <Link href="/account">Login to Review</Link>
                                    </Button>
                                )}
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Write a review for {product.productName}</DialogTitle>
                                  <DialogDescription>Share your experience with this product.</DialogDescription>
                                </DialogHeader>
                                {user && <ReviewForm product={product} user={user} onReviewSubmitted={() => {
                                  setIsReviewFormOpen(false);
                                  fetchReviews();
                                }} />}
                              </DialogContent>
                            </Dialog>
                        </CardContent>
                    </Card>
                </AnimateOnScroll>
            </div>
            <div className="md:col-span-3 space-y-6">
                {reviews.map((review, i) => (
                    <AnimateOnScroll key={review.id} delay={i * 100}>
                        <Card>
                            <CardHeader>
                                <div className="flex items-start gap-4">
                                     <Avatar>
                                        <AvatarImage src={review.avatar_url} />
                                        <AvatarFallback>{(review.first_name || 'A')[0]}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-grow">
                                        <CardTitle className="text-base">{review.first_name || 'Anonymous'}</CardTitle>
                                        <div className="flex text-yellow-400 mt-1">
                                            {[...Array(review.rating_value)].map((_, i) => <Star key={i} className="w-4 h-4 fill-current stroke-yellow-600" />)}
                                            {[...Array(5 - review.rating_value)].map((_, i) => <Star key={i} className="w-4 h-4 fill-current text-gray-300 dark:text-gray-600" />)}
                                        </div>
                                    </div>
                                    <div className="text-xs text-muted-foreground">{new Date(review.review_date).toLocaleDateString()}</div>
                                     {user && user.id === review.user_id && (
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setReviewToDelete(review)}>
                                            <Trash2 className="h-4 w-4"/>
                                        </Button>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent>
                                <p className="font-semibold mb-2">{review.review_title}</p>
                                <p className="text-muted-foreground italic whitespace-pre-wrap">"{review.review_desc}"</p>
                            </CardContent>
                        </Card>
                    </AnimateOnScroll>
                ))}
                 {reviews.length === 0 && <div className="text-center p-8 text-muted-foreground">No reviews yet. Be the first to write one!</div>}
            </div>
        </div>
      </div>
      <AlertDialog open={!!reviewToDelete} onOpenChange={() => setReviewToDelete(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    This will permanently delete your review. This action cannot be undone.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteReview}>Delete</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
