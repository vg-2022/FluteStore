"use client";

import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import Autoplay from "embla-carousel-autoplay";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ProductCard } from "@/components/product-card";
import {
  ArrowRight,
  Eye,
  Heart,
  Minus,
  Plus,
  ShoppingCart,
  Star,
} from "lucide-react";
import type {
  Product,
  HomepageSection,
  Testimonial,
  Promotion,
  HomepageCollectionCard,
  HomepageCategoryCard,
} from "@/lib/types";
import { formatPrice } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { CarouselApi } from "@/components/ui/carousel";
import { useCart } from "@/components/cart-provider";
import { AnimateOnScroll } from "@/components/animate-on-scroll";
import { getProducts } from "@/lib/products";
import { useWishlist } from "@/components/wishlist-provider";
import { Skeleton } from "@/components/ui/skeleton";
import { useSettings } from "./admin/settings/_components/settings-provider";
import { findImageById } from "@/lib/placeholder-images";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

function HomepageSkeleton() {
  return (
    <div className="space-y-12">
      <div className="container mx-auto px-4 md:px-6 py-8 md:py-12">
        <Skeleton className="h-[400px] w-full" />
      </div>
      <div className="container mx-auto px-4 md:px-6 space-y-4">
        <Skeleton className="h-10 w-1/3" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    </div>
  );
}

function ProductCarouselSection({
  section,
  allProducts,
}: {
  section: HomepageSection;
  allProducts: Product[];
}) {
  if (
    !section.visible ||
    !section.data?.productIds ||
    section.data.productIds.length === 0
  )
    return null;

  const productMap = new Map(allProducts.map((p) => [p.productId, p]));
  const products = section.data.productIds
    .map((id: string) => productMap.get(id))
    .filter((p): p is Product => Boolean(p));

  if (products.length === 0) return null;

  const viewAllLink =
    section.type === "accessories" ? "/accessories" : "/products";

  return (
    <section className="container mx-auto px-4 md:px-6">
      <div className="flex justify-between items-baseline mb-6">
        <h2 className="text-3xl md:text-4xl font-bold">{section.title}</h2>
        <Button variant="link" asChild className="text-accent">
          <Link href={viewAllLink}>
            View All <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
      <Carousel opts={{ align: "start" }} className="w-full">
        <CarouselContent>
          {products.map((product, i) => (
            <CarouselItem
              key={product.productId}
              className="basis-1/2 sm:basis-1/3 md:basis-1/4"
            >
              <AnimateOnScroll className="p-1 h-full" delay={i * 100}>
                <ProductCard product={product} />
              </AnimateOnScroll>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="hidden md:flex" />
        <CarouselNext className="hidden md:flex" />
      </Carousel>
    </section>
  );
}

function HeroSection({
  section,
  allProducts,
}: {
  section: HomepageSection;
  allProducts: Product[];
}) {
  const { addToCart, updateQuantity, getCartItem } = useCart();
  const { isInWishlist, toggleWishlistItem } = useWishlist();

  const [api, setApi] = React.useState<CarouselApi>();
  const [current, setCurrent] = React.useState(0);

  if (
    !section.visible ||
    (!section.data?.productIds?.length && !section.data?.promotions?.length)
  )
    return null;

  const productMap = new Map(allProducts.map((p) => [p.productId, p]));
  const heroProducts = (section.data.productIds || [])
    .map((id: string) => productMap.get(id))
    .filter((p): p is Product => Boolean(p));

  const heroPromotions = section.data.promotions || [];

  const carouselItems = [...heroProducts, ...heroPromotions];

  const currentItem =
    carouselItems[current] ||
    (carouselItems.length > 0 ? carouselItems[0] : null);

  const isProduct = (item: any): item is Product => "productId" in item;

  const cartItem =
    currentItem && isProduct(currentItem)
      ? getCartItem(currentItem.productId)
      : undefined;
  const quantity = cartItem?.quantity || 0;
  const isWishlisted =
    currentItem && isProduct(currentItem)
      ? isInWishlist(currentItem.productId)
      : false;

  React.useEffect(() => {
    if (!api) return;
    setCurrent(api.selectedScrollSnap());
    const handleSelect = () => setCurrent(api.selectedScrollSnap());
    api.on("select", handleSelect);
    return () => {
      api.off("select", handleSelect);
    };
  }, [api]);

  if (!currentItem) return null;

  const currentBgImage = isProduct(currentItem)
    ? currentItem.imageUrls?.[0]
    : currentItem.imageUrl;

  return (
    <section className="relative w-full bg-background overflow-hidden">
      {currentBgImage && (
        <Image
          src={currentBgImage}
          alt="Background"
          fill
          className="object-cover object-center opacity-70"
          priority
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent"></div>
      <div className="container mx-auto px-4 md:px-6 py-8 md:py-12 relative z-10">
        <Carousel
          setApi={setApi}
          opts={{ loop: true }}
          plugins={[Autoplay({ delay: 4000, stopOnInteraction: true })]}
          className="w-full"
        >
          <CarouselContent>
            {carouselItems.map((item, index) => (
              <CarouselItem key={index}>
                <AnimateOnScroll className="grid grid-cols-1 md:grid-cols-5 gap-4 md:gap-8 items-start">
                  <div className="col-span-1 md:col-span-3 text-foreground">
                    {isProduct(item) ? (
                      <>
                        {item.tags?.[0] && <Badge>{item.tags[0]}</Badge>}
                        <Link
                          href={`/products/${item.productId}`}
                          className="hover:text-primary transition-colors"
                        >
                          <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold font-headline !leading-tight mt-4">
                            {item.productName}
                          </h1>
                        </Link>
                        <p className="mt-4 text-muted-foreground text-sm sm:text-base max-w-lg">
                          {item.description}
                        </p>
                        <div className="flex items-center gap-2 mt-4">
                          <div className="flex items-center gap-0.5 text-yellow-400">
                            {[...Array(Math.floor(item.avgRating))].map(
                              (_, i) => (
                                <Star
                                  key={i}
                                  className="w-5 h-5 fill-yellow-400 stroke-yellow-600"
                                />
                              )
                            )}
                            {item.avgRating % 1 !== 0 && (
                              <Star className="w-5 h-5 fill-yellow-400 star-half" />
                            )}
                            {[...Array(5 - Math.ceil(item.avgRating))].map(
                              (_, i) => (
                                <Star
                                  key={i}
                                  className="w-5 h-5 fill-gray-300 dark:fill-gray-600 stroke-yellow-600"
                                />
                              )
                            )}
                          </div>
                          <span className="text-muted-foreground text-sm">
                            {item.avgRating.toFixed(1)} ({item.reviewCount}{" "}
                            reviews)
                          </span>
                        </div>
                        <div className="flex items-baseline gap-4 mt-6">
                          <span className="text-3xl md:text-4xl font-bold">
                            {formatPrice(item.price)}
                          </span>
                          {item.mrp && (
                            <span className="text-xl md:text-2xl text-muted-foreground line-through">
                              {formatPrice(item.mrp)}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 mt-8">
                          {getCartItem(item.productId)?.quantity || 0 === 0 ? (
                            <Button
                              size="lg"
                              className="text-sm h-10 px-4 sm:text-base sm:h-12 sm:px-6"
                              onClick={() => addToCart(item)}
                            >
                              <ShoppingCart className="mr-2 h-5 w-5" /> Add to
                              Cart
                            </Button>
                          ) : (
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-12 w-12"
                                onClick={() =>
                                  updateQuantity(
                                    item.productId,
                                    (getCartItem(item.productId)?.quantity ||
                                      0) - 1
                                  )
                                }
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                              <span className="text-lg font-bold w-12 text-center">
                                {getCartItem(item.productId)?.quantity}
                              </span>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-12 w-12"
                                onClick={() =>
                                  updateQuantity(
                                    item.productId,
                                    (getCartItem(item.productId)?.quantity ||
                                      0) + 1
                                  )
                                }
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                          <Button
                            asChild
                            size="lg"
                            variant="outline"
                            className="text-sm h-10 px-4 sm:text-base sm:h-12 sm:px-6"
                          >
                            <Link href={`/products/${item.productId}`}>
                              <Eye className="mr-2 h-5 w-5" /> View Details
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => toggleWishlistItem(item.productId)}
                          >
                            <Heart
                              className={cn(
                                "h-6 w-6",
                                isInWishlist(item.productId) &&
                                  "fill-destructive text-destructive"
                              )}
                            />
                            <span className="sr-only">Add to Wishlist</span>
                          </Button>
                        </div>
                      </>
                    ) : (
                      <>
                        <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold font-headline !leading-tight mt-4">
                          {item.name}
                        </h1>
                        <p className="mt-4 text-muted-foreground text-sm sm:text-base max-w-lg">
                          {item.info}
                        </p>
                      </>
                    )}
                  </div>
                  <div className="hidden md:block md:col-span-2 relative">
                    <Card className="overflow-hidden shadow-2xl">
                      <CardContent className="p-0">
                        <div className="relative aspect-square">
                          <Image
                            src={
                              isProduct(item)
                                ? item.imageUrls[0]
                                : item.imageUrl
                            }
                            alt={isProduct(item) ? item.productName : item.name}
                            fill
                            className="object-cover"
                          />
                          {isProduct(item) && item.tags && item.tags[0] && (
                            <Badge className="absolute top-2 right-2 sm:top-4 sm:right-4">
                              {item.tags[0]}
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </AnimateOnScroll>
              </CarouselItem>
            ))}
          </CarouselContent>
          <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-2 z-20">
            {carouselItems.map((_, i) => (
              <button
                key={i}
                onClick={() => api?.scrollTo(i)}
                className={cn(
                  "h-2 w-2 rounded-full",
                  current === i ? "bg-primary" : "bg-primary/50"
                )}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
          <CarouselPrevious className="hidden md:flex -left-4 md:-left-12" />
          <CarouselNext className="hidden md:flex -right-4 md:-right-12" />
        </Carousel>
      </div>
    </section>
  );
}

function CollectionsSection({ section }: { section: HomepageSection }) {
  if (
    !section.visible ||
    !section.data?.cards ||
    section.data.cards.length === 0
  )
    return null;
  const cards = section.data.cards as HomepageCollectionCard[];

  return (
    <section className="container mx-auto px-4 md:px-6">
      <h2 className="text-3xl md:text-4xl font-bold mb-6 text-center">
        {section.title}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, i) => {
          const image = findImageById(card.imageId);
          return (
            <AnimateOnScroll key={card.id} delay={i * 100}>
              <Link href={card.href} className="group block">
                <Card className="overflow-hidden h-full">
                  <div className="relative aspect-[4/5]">
                    {image && (
                      <Image
                        src={image.imageUrl}
                        alt={card.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                  </div>
                  <CardHeader className="absolute bottom-0 text-white">
                    <CardTitle>{card.title}</CardTitle>
                    <CardDescription className="text-white/80">
                      {card.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            </AnimateOnScroll>
          );
        })}
      </div>
    </section>
  );
}

function CategoriesSection({ section }: { section: HomepageSection }) {
  if (
    !section.visible ||
    !section.data?.cards ||
    section.data.cards.length === 0
  )
    return null;
  const cards = section.data.cards as HomepageCategoryCard[];

  return (
    <section className="container mx-auto px-4 md:px-6">
      <h2 className="text-3xl md:text-4xl font-bold mb-6 text-center">
        {section.title}
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map((card, i) => {
          const image = findImageById(card.imageId);
          return (
            <AnimateOnScroll key={card.id} delay={i * 100}>
              <Link href={card.href} className="group block">
                <Card className="overflow-hidden">
                  <div className="relative aspect-square">
                    {image && (
                      <Image
                        src={image.imageUrl}
                        alt={card.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    )}
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <h3 className="text-white font-bold text-lg md:text-xl text-center">
                        {card.title}
                      </h3>
                    </div>
                  </div>
                </Card>
              </Link>
            </AnimateOnScroll>
          );
        })}
      </div>
    </section>
  );
}

function TestimonialsSection({ section }: { section: HomepageSection }) {
  if (
    !section.visible ||
    !section.data?.testimonials ||
    section.data.testimonials.length === 0
  )
    return null;
  const testimonials = section.data.testimonials as Testimonial[];

  return (
    <section className="container mx-auto px-4 md:px-6">
      <h2 className="text-3xl md:text-4xl font-bold mb-6 text-center">
        {section.title}
      </h2>
      <Carousel
        opts={{ loop: true, align: "start" }}
        plugins={[Autoplay({ delay: 5000, stopOnInteraction: true })]}
        className="w-full max-w-4xl mx-auto"
      >
        <CarouselContent>
          {testimonials.map((testimonial, i) => (
            <CarouselItem key={testimonial.id || i}>
              <Card>
                <CardContent className="p-8 text-center">
                  <Avatar className="w-20 h-20 mx-auto mb-4 border-4 border-primary/20">
                    <AvatarImage
                      src={testimonial.imageUrl}
                      alt={testimonial.name}
                    />
                    <AvatarFallback>
                      {testimonial.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <p className="italic text-muted-foreground">
                    "{testimonial.comment}"
                  </p>
                  <p className="font-bold mt-4">{testimonial.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {testimonial.location}
                  </p>
                </CardContent>
              </Card>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="hidden md:flex -left-4 md:-left-12" />
        <CarouselNext className="hidden md:flex -right-4 md:-right-12" />
      </Carousel>
    </section>
  );
}

function SpecialOffersSection({ section }: { section: HomepageSection }) {
  if (
    !section.visible ||
    !section.data?.promotions ||
    section.data.promotions.length === 0
  )
    return null;
  const promotions = section.data.promotions as Promotion[];

  return (
    <section className="container mx-auto px-4 md:px-6">
      <h2 className="text-3xl md:text-4xl font-bold mb-6 text-center">
        {section.title}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {promotions.map((promo, i) => (
          <AnimateOnScroll key={promo.id || i} delay={i * 100}>
            <Card className="overflow-hidden relative group">
              <div className="relative aspect-video">
                {promo.imageUrl && (
                  <Image
                    src={promo.imageUrl}
                    alt={promo.name}
                    fill
                    className="object-cover"
                  />
                )}
                <div className="absolute inset-0 bg-black/30 group-hover:bg-black/50 transition-colors" />
              </div>
              <div className="absolute inset-0 flex flex-col justify-end p-6 text-white">
                <h3 className="text-2xl font-bold">{promo.name}</h3>
                <p>{promo.info}</p>
              </div>
            </Card>
          </AnimateOnScroll>
        ))}
      </div>
    </section>
  );
}

export default function Home() {
  const { homepageSections, isLoading: isLoadingSettings } = useSettings();
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);

  useEffect(() => {
    async function fetchProducts() {
      setIsLoadingProducts(true);
      const products = await getProducts();
      setAllProducts(products);
      setIsLoadingProducts(false);
    }
    fetchProducts();
  }, []);

  const isLoading = isLoadingSettings || isLoadingProducts;

  if (isLoading) {
    return <HomepageSkeleton />;
  }

  return (
    <div className="flex flex-col gap-12 md:gap-16 lg:gap-24 pb-12 md:pb-16 lg:pb-24">
      {homepageSections.map((section) => {
        if (!section.visible) return null;
        const commonProps = { section, allProducts };

        switch (section.type) {
          case "hero":
            return <HeroSection key={section.id} {...commonProps} />;
          case "featuredProducts":
          case "newArrivals":
          case "accessories":
            return <ProductCarouselSection key={section.id} {...commonProps} />;
          case "collections":
            return <CollectionsSection key={section.id} {...commonProps} />;
          case "categories":
            return <CategoriesSection key={section.id} {...commonProps} />;
          case "testimonials":
            return <TestimonialsSection key={section.id} {...commonProps} />;
          case "specialOffers":
            return <SpecialOffersSection key={section.id} {...commonProps} />;
          default:
            return null;
        }
      })}
    </div>
  );
}
