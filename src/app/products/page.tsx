
'use client';

import { ProductCard } from '@/components/product-card';
import { ProductFilters } from '@/components/product-filters';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Button } from '@/components/ui/button';
import { ChevronDown, Filter } from 'lucide-react';
import type { Product } from '@/lib/types';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ScrollArea } from '@/components/ui/scroll-area';
import React, { Suspense, useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { AnimateOnScroll } from '@/components/animate-on-scroll';
import { Skeleton } from '@/components/ui/skeleton';
import { getProducts as getProductsFromSupabase } from '@/lib/products';

const PRODUCTS_PER_PAGE = 12;

function ProductsGrid() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [isSheetOpen, setIsSheetOpen] = React.useState(false);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
        setIsLoading(true);
        const products = await getProductsFromSupabase();
        setAllProducts(products);
        setIsLoading(false);
    };
    fetchProducts();
  }, []);

  const { filteredProducts, totalPages, currentPage } = React.useMemo(() => {
    let filtered: Product[] = [...allProducts];

    // Search query
    const query = searchParams.get('q');
    if (query) {
      filtered = filtered.filter(p => p.productName.toLowerCase().includes(query.toLowerCase()) || p.description?.toLowerCase().includes(query.toLowerCase()));
    }
    
    // Product Type (flute or accessory)
    const productTypes = searchParams.getAll('productType');
    if (productTypes.length > 0) {
      filtered = filtered.filter(p => productTypes.includes(p.productType));
    } else {
      // Default to showing all product types if none are selected
      // This ensures accessories are shown by default.
    }

    // Filtering by specifications
    const categories = searchParams.getAll('type');
    if (categories.length > 0) {
      filtered = filtered.filter(p => p.specifications?.Type && categories.includes(p.specifications.Type as string));
    }
    
    const scales = searchParams.getAll('scale');
    if (scales.length > 0) {
      filtered = filtered.filter(p => p.specifications?.Scale && scales.includes(p.specifications.Scale as string));
    }
    
    const materials = searchParams.getAll('material');
    if (materials.length > 0) {
      filtered = filtered.filter(p => p.specifications?.Material && materials.includes(p.specifications.Material as string));
    }
    
    const minPrice = searchParams.get('minPrice');
    if (minPrice) {
      filtered = filtered.filter(p => p.price >= Number(minPrice));
    }
    const maxPrice = searchParams.get('maxPrice');
    if (maxPrice) {
      filtered = filtered.filter(p => p.price <= Number(maxPrice));
    }
    const rating = searchParams.get('rating');
    if (rating) {
      filtered = filtered.filter(p => p.avgRating >= Number(rating));
    }

    // Sorting
    const sort = searchParams.get('sort') || 'newest';
    if (sort === 'newest') {
      filtered.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    } else if (sort === 'price-asc') {
      filtered.sort((a, b) => a.price - b.price);
    } else if (sort === 'price-desc') {
      filtered.sort((a, b) => b.price - a.price);
    } else if (sort === 'rating') {
      filtered.sort((a, b) => b.avgRating - a.avgRating);
    }
    
    const page = parseInt(searchParams.get('page') || '1', 10);
    const calculatedTotalPages = Math.ceil(filtered.length / PRODUCTS_PER_PAGE);

    const paginatedProducts = filtered.slice(
      (page - 1) * PRODUCTS_PER_PAGE,
      page * PRODUCTS_PER_PAGE
    );

    return { filteredProducts: paginatedProducts, totalPages: calculatedTotalPages, currentPage: page };
  }, [searchParams, allProducts]);
  
  const createPageURL = (pageNumber: number | string) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', pageNumber.toString());
    return `${pathname}?${params.toString()}`;
  };
  
  const createSortLink = (sortValue: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('sort', sortValue);
    params.set('page', '1'); // Reset to first page on sort
    return `/products?${params.toString()}`;
  }

  const handleFiltersApplied = (productCount: number) => {
    setIsSheetOpen(false);
    toast({
      title: "Filters Applied",
      description: `Found ${productCount} product${productCount !== 1 ? 's' : ''}.`,
    });
  };

  if (isLoading) {
    return <ProductsPageSkeleton />;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
      <aside className="hidden lg:block lg:col-span-1">
        <ProductFilters onFiltersApplied={handleFiltersApplied} allProducts={allProducts} />
      </aside>

      <main className="lg:col-span-3">
        <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-muted-foreground">Showing {filteredProducts.length} of {allProducts.length} products</p>
            
            <div className="flex items-center gap-2">
               <div className="lg:hidden">
                  <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                      <SheetTrigger asChild>
                          <Button variant="outline" size="icon">
                              <Filter className="h-4 w-4" />
                              <span className="sr-only">Filters</span>
                          </Button>
                      </SheetTrigger>
                      <SheetContent>
                          <SheetHeader>
                              <SheetTitle>Filters</SheetTitle>
                          </SheetHeader>
                          <ScrollArea className="h-[calc(100%-4rem)]">
                              <div className="p-4 pt-0">
                                  <ProductFilters onFiltersApplied={handleFiltersApplied} allProducts={allProducts} />
                              </div>
                          </ScrollArea>
                      </SheetContent>
                  </Sheet>
               </div>
              <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="shrink-0">
                          Sort by: <span className="capitalize ml-1">{(searchParams.get('sort') || 'newest').replace('-', ' ')}</span> <ChevronDown className="w-4 h-4 ml-2"/>
                      </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                      <DropdownMenuLabel>Sort by</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href={createSortLink('newest')}>Newest</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                         <Link href={createSortLink('price-asc')}>Price: Low to High</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                         <Link href={createSortLink('price-desc')}>Price: High to Low</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                         <Link href={createSortLink('rating')}>Rating</Link>
                      </DropdownMenuItem>
                  </DropdownMenuContent>
              </DropdownMenu>
            </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredProducts.map((product, i) => (
            <AnimateOnScroll key={product.productId} delay={i * 50}>
              <ProductCard product={product} />
            </AnimateOnScroll>
          ))}
           {filteredProducts.length === 0 && (
            <div className="sm:col-span-2 xl:col-span-3 text-center py-12">
              <p className="text-muted-foreground">No products found matching your criteria.</p>
            </div>
          )}
        </div>

        {totalPages > 1 && (
            <Pagination className="mt-12">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    href={createPageURL(currentPage - 1)}
                    aria-disabled={currentPage <= 1}
                    className={currentPage <= 1 ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <PaginationItem key={page}>
                        <PaginationLink href={createPageURL(page)} isActive={currentPage === page}>
                            {page}
                        </PaginationLink>
                    </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext
                    href={createPageURL(currentPage + 1)}
                    aria-disabled={currentPage >= totalPages}
                    className={currentPage >= totalPages ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
        )}
      </main>
    </div>
  );
}

function ProductsPageSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
      <aside className="hidden lg:block lg:col-span-1">
        <Skeleton className="w-full h-96" />
      </aside>
      <main className="lg:col-span-3">
        <div className="flex justify-between items-center mb-4">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-10 w-36" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="aspect-square w-full" />
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-5 w-1/2" />
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}


export default function ProductsPage() {
  return (
    <div className="container mx-auto px-4 md:px-6 py-8">
      <div className="text-center mb-8">
        <AnimateOnScroll>
            <h1 className="text-4xl md:text-5xl font-bold">Our Collection</h1>
            <p className="mt-2 text-lg text-muted-foreground max-w-2xl mx-auto">
            From the aspiring student to the seasoned professional, find the instrument that speaks to you.
            </p>
        </AnimateOnScroll>
      </div>
      <Suspense fallback={<ProductsPageSkeleton />}>
        <ProductsGrid />
      </Suspense>
    </div>
  );
}
