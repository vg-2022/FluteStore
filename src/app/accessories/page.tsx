
'use client';

import { ProductCard } from '@/components/product-card';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import React, { Suspense, useEffect, useState } from 'react';
import { AnimateOnScroll } from '@/components/animate-on-scroll';
import { Skeleton } from '@/components/ui/skeleton';
import type { Product } from '@/lib/types';
import { getProducts as getProductsFromSupabase } from '@/lib/products';

function AccessoriesGrid() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const fetchProducts = async () => {
        setIsLoading(true);
        const allProducts = await getProductsFromSupabase();
        setProducts(allProducts.filter(p => p.productType === 'accessory'));
        setIsLoading(false);
    };
    fetchProducts();
  }, []);

  if (isLoading) {
    return <AccessoriesPageSkeleton />;
  }


  return (
    <main>
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
        {products.map((product, i) => (
          <AnimateOnScroll key={product.productId} delay={i * 50}>
            <ProductCard product={product} />
          </AnimateOnScroll>
        ))}
         {products.length === 0 && (
          <div className="col-span-full text-center py-12">
            <p className="text-muted-foreground">No accessories found.</p>
          </div>
        )}
      </div>

      <Pagination className="mt-12">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious href="#" />
          </PaginationItem>
          <PaginationItem>
            <PaginationLink href="#" isActive>1</PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationNext href="#" />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </main>
  );
}

function AccessoriesPageSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="aspect-square w-full" />
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-5 w-1/2" />
        </div>
      ))}
    </div>
  );
}

export default function AccessoriesPage() {
  return (
    <div className="container mx-auto px-4 md:px-6 py-8">
      <div className="text-center mb-8">
        <AnimateOnScroll>
            <h1 className="text-4xl md:text-5xl font-bold">Accessories</h1>
            <p className="mt-2 text-lg text-muted-foreground max-w-2xl mx-auto">
                Everything you need to care for and carry your beloved instruments.
            </p>
        </AnimateOnScroll>
      </div>
      <Suspense fallback={<AccessoriesPageSkeleton />}>
        <AccessoriesGrid />
      </Suspense>
    </div>
  );
}
