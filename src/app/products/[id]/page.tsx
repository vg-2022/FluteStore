
'use client';
import { notFound, useParams } from "next/navigation";
import { ProductDetailsClient } from "@/components/product-details-client";
import type { Product } from "@/lib/types";
import { ProductCard } from "@/components/product-card";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { AnimateOnScroll } from "@/components/animate-on-scroll";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { getProductById, getProducts } from "@/lib/products";

function ProductDetailPageSkeleton() {
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

export default function ProductDetailPage() {
    const params = useParams();
    const [product, setProduct] = useState<Product | null>(null);
    const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
    const [accessories, setAccessories] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (params.id) {
            const fetchProduct = async () => {
                setLoading(true);
                const id = Array.isArray(params.id) ? params.id[0] : params.id;
                const foundProduct = await getProductById(id);
                setProduct(foundProduct || null);

                if (foundProduct) {
                    const allProducts = await getProducts();
                    const related = allProducts.filter(p => p.categories?.some(cat => foundProduct.categories?.includes(cat)) && p.productId !== foundProduct.productId && p.productType === 'flute').slice(0, 8);
                    setRelatedProducts(related);
                    setAccessories(allProducts.filter(p => p.productType === 'accessory'));
                }

                setLoading(false);
            };
            fetchProduct();
        }
    }, [params.id]);

    if (loading) {
        return <ProductDetailPageSkeleton />;
    }

    if (!product) {
        notFound();
    }

    return (
        <div className="container mx-auto px-4 md:px-6 py-12">
            <ProductDetailsClient product={product} />
            
            {/* Recommended Accessories */}
            <div className="mt-16">
                <h2 className="text-2xl font-bold mb-6">Recommended Accessories</h2>
                <Carousel
                    opts={{ align: "start" }}
                    className="w-full"
                >
                    <CarouselContent>
                        {accessories.map((p, i) => (
                            <CarouselItem key={p.productId} className="basis-1/2 md:basis-1/3 lg:basis-1/4">
                                <AnimateOnScroll className="p-1 h-full" delay={i * 100}>
                                    <ProductCard product={p} />
                                </AnimateOnScroll>
                            </CarouselItem>
                        ))}
                    </CarouselContent>
                    <CarouselPrevious />
                    <CarouselNext />
                </Carousel>
            </div>

            {/* Related Products */}
            <div className="mt-16">
                <h2 className="text-2xl font-bold mb-6">You Might Also Like</h2>
                <Carousel
                opts={{
                    align: "start",
                }}
                className="w-full"
                >
                <CarouselContent>
                    {relatedProducts.map((p, i) => (
                    <CarouselItem key={p.productId} className="basis-1/2 md:basis-1/3 lg:basis-1/4">
                        <AnimateOnScroll className="p-1 h-full" delay={i * 100}>
                        <ProductCard product={p} />
                        </AnimateOnScroll>
                    </CarouselItem>
                    ))}
                </CarouselContent>
                <CarouselPrevious />
                <CarouselNext />
                </Carousel>
            </div>
        </div>
    );
}
