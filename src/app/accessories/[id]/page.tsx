

'use client';

import Image from "next/image";
import React from "react";
import { notFound, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Star, ShoppingCart, Minus, Plus } from "lucide-react";
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
import { useCart } from "@/components/cart-provider";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { AnimateOnScroll } from "@/components/animate-on-scroll";
import type { CartItem } from "@/components/cart-provider";
import type { Product, Review } from "@/lib/types";
import { ProductCard } from "@/components/product-card";
import { Skeleton } from "@/components/ui/skeleton";
import { getProductById, getProducts } from "@/lib/products";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { createClient } from "@/lib/supabase/client";

function AccessoryDetailSkeleton() {
    return (
        <div className="container mx-auto px-4 md:px-6 py-12">
            <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
                <div className="flex flex-col gap-4">
                    <Skeleton className="aspect-square w-full" />
                    <div className="grid grid-cols-5 gap-2">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <Skeleton key={i} className="aspect-square w-full" />
                        ))}
                    </div>
                </div>
                <div className="flex flex-col gap-4">
                    <Skeleton className="h-10 w-3/4" />
                    <Skeleton className="h-5 w-1/4" />
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-8 w-1/3" />
                    <div className="flex gap-4 mt-4">
                        <Skeleton className="h-12 w-full" />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function AccessoryDetailPage() {
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const supabase = createClient();
  
  const [product, setProduct] = React.useState<Product | null>();
  const [allProducts, setAllProducts] = React.useState<Product[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [reviews, setReviews] = React.useState<any[]>([]);
  
  const { addToCart, updateQuantity, getCartItem } = useCart();
  const [api, setApi] = React.useState<CarouselApi>()
  const [current, setCurrent] = React.useState(0)
  
  const reviewCount = product?.reviewCount ?? 0;

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

  React.useEffect(() => {
    const fetchProductData = async () => {
        setLoading(true);
        const products = await getProducts();
        setAllProducts(products);
        const foundProduct = await getProductById(id);
        
        if (foundProduct) {
            setProduct(foundProduct);
            const { data: reviewData } = await supabase.from('reviews_with_user_info').select('*').eq('product_id', foundProduct.productId).eq('status', 'approved');
            setReviews(reviewData || []);
        }
        setLoading(false);
    };
    fetchProductData();
  }, [id, supabase]);

  React.useEffect(() => {
    if (!api) return;
    setCurrent(api.selectedScrollSnap());
    api.on("select", () => setCurrent(api.selectedScrollSnap()));
  }, [api]);
  
  if (loading) {
    return <AccessoryDetailSkeleton />;
  }

  if (!product) {
    notFound();
  }

  const cartItem: CartItem | undefined = getCartItem(product.productId);
  const quantity = cartItem?.quantity || 0;

  const handleAddToCart = () => {
    addToCart(product, 1);
  };
   
  const handleUpdateQuantity = (newQuantity: number) => {
    updateQuantity(product.productId, newQuantity);
  };

  const productImages = product.imageUrls;
  const relatedProducts = allProducts.filter(p => p.productType === 'accessory' && p.productId !== product.productId).slice(0, 4);
  const avgRating = product.avgRating;

  return (
    <div className="container mx-auto px-4 md:px-6 py-12">
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
          
           {product.specifications && <div className="grid gap-2 text-sm">
            <h3 className="font-semibold text-lg">Specifications</h3>
            {Object.entries(product.specifications).map(([key, value]) => (
                <div key={key} className="grid grid-cols-2">
                    <span className="text-muted-foreground">{key}</span>
                    <span>{value as string}</span>
                </div>
            ))}
           </div>}
        </AnimateOnScroll>
      </div>

      {/* Reviews Section */}
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
                            <Button variant="outline" className="w-full">Write a Review</Button>
                        </CardContent>
                    </Card>
                </AnimateOnScroll>
            </div>
            <div className="md:col-span-3 space-y-6">
                {reviews.map((review, i) => {
                    return (
                        <AnimateOnScroll key={review.id} delay={i * 100}>
                            <Card>
                                <CardHeader>
                                    <div className="flex items-center gap-4">
                                        <Avatar>
                                            <AvatarImage src={review.avatar_url} />
                                            <AvatarFallback>{(review.first_name || 'A')[0]}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <CardTitle className="text-base">{review.first_name}</CardTitle>
                                            <div className="flex text-yellow-400 mt-1">
                                                {[...Array(review.rating_value)].map((_, i) => <Star key={i} className="w-4 h-4 fill-current stroke-yellow-600" />)}
                                                {[...Array(5 - review.rating_value)].map((_, i) => <Star key={i} className="w-4 h-4 fill-current text-gray-300 dark:text-gray-600" />)}
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <p className="font-semibold mb-2">{review.review_title}</p>
                                    <p className="text-muted-foreground italic whitespace-pre-wrap">"{review.review_desc}"</p>
                                </CardContent>
                            </Card>
                        </AnimateOnScroll>
                    )
                })}
                {reviews.length > 3 && <Button variant="link" className="w-full">Show all {reviews.length} reviews</Button>}
                {reviews.length === 0 && (
                    <div className="text-center p-8 text-muted-foreground">No reviews yet for this accessory.</div>
                )}
            </div>
        </div>
      </div>
      
      {/* Related Accessories */}
        <div className="mt-16">
            <h2 className="text-2xl font-bold mb-6">More Accessories</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {relatedProducts.map((p, i) => (
                    <AnimateOnScroll key={p.productId} delay={i * 100}>
                        <ProductCard product={p} />
                    </AnimateOnScroll>
                ))}
            </div>
        </div>
    </div>
  );
}
