
"use client";

import Image from "next/image";
import Link from "next/link";
import { Star, ShoppingCart, Eye, Heart } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Product } from "@/lib/types";
import { formatPrice } from "@/lib/utils";
import { useCart } from "./cart-provider";
import { cn } from "@/lib/utils";
import { useWishlist } from "./wishlist-provider";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlistItem } = useWishlist();

  const isWishlisted = isInWishlist(product.productId);

  const handleAddToCart = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    addToCart(product);
  };
  
  const handleWishlistToggle = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    toggleWishlistItem(product.productId);
  };
  
  const mrp = product.mrp ?? 0;
  const price = product.price;
  const savePercentage = mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;
  const isOutOfStock = product.stockStatus === 'out-of-stock' || (product.stockQuantity ?? 0) === 0;
  
  const productUrl = product.productType === 'accessory' ? `/accessories/${product.productId}` : `/products/${product.productId}`;

  return (
    <div className={cn("w-full h-full flex flex-col rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-xl group", isOutOfStock && "opacity-60")}>
      <div className="relative overflow-hidden rounded-t-lg">
        <Link href={productUrl} className={cn("block", isOutOfStock && "pointer-events-none")}>
          <div className="aspect-square w-full relative">
            {product.imageUrls && product.imageUrls[0] ? (
              <Image
                src={product.imageUrls[0]}
                alt={product.productName}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
                sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
              />
            ) : (
                <div className="w-full h-full bg-muted flex items-center justify-center text-muted-foreground text-xs">No Image</div>
            )}
          </div>
        </Link>
        <div className="absolute top-2 left-2 flex flex-col gap-1">
            {isOutOfStock && <Badge variant={'destructive'}>Out of Stock</Badge>}
            {product.tags && product.tags[0] && !isOutOfStock && <Badge variant={'secondary'}>{product.tags[0]}</Badge>}
            {savePercentage > 0 && !isOutOfStock && <Badge variant="destructive">-{savePercentage}%</Badge>}
        </div>
        <Button variant="ghost" size="icon" onClick={handleWishlistToggle} className="absolute top-2 right-2 bg-background/50 backdrop-blur-sm hover:bg-background/75" disabled={isOutOfStock}>
            <Heart className={cn("h-5 w-5", isWishlisted && "fill-destructive text-destructive")} />
            <span className="sr-only">Add to Wishlist</span>
        </Button>
      </div>
      <div className="p-4 flex flex-col flex-grow">
        <div className="flex justify-between items-center text-xs text-muted-foreground">
          <span>{(product.specifications?.Type as string) || (product.categories || []).join(', ')}</span>
          <div className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-yellow-400 stroke-yellow-600" />
              <span>{product.avgRating.toFixed(1)} ({product.reviewCount})</span>
          </div>
        </div>
        <h3 className="text-sm font-bold leading-snug mt-1 flex-grow">
          <Link href={productUrl} className={cn("hover:text-primary transition-colors", isOutOfStock && "pointer-events-none")}>
            {product.productName}
          </Link>
        </h3>
        <div className="flex items-baseline gap-2 mt-2">
          <p className="text-lg font-bold text-foreground">
            {formatPrice(product.price)}
          </p>
          {product.mrp && <p className="text-sm text-muted-foreground line-through">{formatPrice(product.mrp)}</p>}
        </div>
         <div className="mt-4 flex flex-col gap-2">
            <Button asChild variant="outline" size="sm" disabled={isOutOfStock}>
                <Link href={productUrl}>
                    <Eye className="mr-2 h-4 w-4"/>
                    View Details
                </Link>
            </Button>
            <Button onClick={handleAddToCart} size="sm" disabled={isOutOfStock}>
                <ShoppingCart className="mr-2 h-4 w-4"/>
                Add to Cart
            </Button>
         </div>
      </div>
    </div>
  );
}
