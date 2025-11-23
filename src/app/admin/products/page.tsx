
'use client';
import Link from "next/link";
import Image from "next/image";
import {
  Card,
  CardContent,
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
import { formatPrice } from "@/lib/utils";
import { MoreHorizontal, PlusCircle, Search } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState, useEffect, useCallback, useMemo } from "react";
import type { Product } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { getProducts } from "@/lib/products";
import { Input } from "@/components/ui/input";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  const loadProducts = useCallback(async () => {
    setLoading(true);
    const remoteProducts = await getProducts();
    setProducts(remoteProducts);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);
  
  const filteredProducts = useMemo(() => {
    if (!searchTerm) {
        return products;
    }
    return products.filter(p => 
        p.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.productId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.categories?.some(cat => cat.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [products, searchTerm]);


  const handleDelete = (productId: string) => {
    if (confirm('Are you sure you want to delete this product? This is a mock action.')) {
        toast({ title: 'Product deleted (mock)' });
        setProducts(prev => prev.filter(p => p.productId !== productId));
    }
  };


  const getStatusVariant = (status: Product['stockStatus'], stock?: number) => {
    if (stock === 0) return 'destructive';
    switch (status) {
      case 'in-stock': return 'default';
      case 'out-of-stock': return 'destructive';
      default: return 'secondary';
    }
  }

  if (loading) {
    return <p>Loading products...</p>;
  }

  return (
    <div>
        <div className="flex justify-between items-center mb-6 gap-4">
            <div>
                 <h1 className="text-2xl font-bold">Products</h1>
                 <p className="text-muted-foreground">Manage all the products in your store.</p>
            </div>
             <div className="flex items-center gap-2">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Search products..." 
                        className="pl-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <Button asChild>
                    <Link href="/admin/products/new">
                        <PlusCircle className="mr-2 h-5 w-5"/> Add Product
                    </Link>
                </Button>
            </div>
        </div>
        <Card>
        <CardContent>
            <Table>
            <TableHeader>
                <TableRow>
                <TableHead className="hidden w-[100px] sm:table-cell">
                    <span className="sr-only">Image</span>
                </TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right hidden md:table-cell">Stock</TableHead>
                <TableHead className="hidden md:table-cell">Type</TableHead>
                <TableHead>
                    <span className="sr-only">Actions</span>
                </TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {filteredProducts.map(product => {
                    const stockLevel = product.stockQuantity ?? 0;
                    return (
                        <TableRow key={product.productId}>
                            <TableCell className="hidden sm:table-cell">
                                {product.imageUrls && product.imageUrls[0] && (
                                    <Image
                                        alt={product.productName}
                                        className="aspect-square rounded-md object-cover"
                                        height="64"
                                        src={product.imageUrls[0]}
                                        width="64"
                                    />
                                )}
                            </TableCell>
                            <TableCell className="font-medium">{product.productName}</TableCell>
                            <TableCell>
                                <Badge variant={getStatusVariant(product.stockStatus, stockLevel)}>
                                  {stockLevel === 0 ? 'Out of Stock' : product.stockStatus}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-right">{formatPrice(product.price)}</TableCell>
                            <TableCell className={cn("text-right hidden md:table-cell", stockLevel <= 5 && "text-destructive font-bold")}>
                              {stockLevel}
                            </TableCell>
                            <TableCell className="hidden md:table-cell">{product.productType}</TableCell>
                            <TableCell>
                                <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button aria-haspopup="true" size="icon" variant="ghost">
                                    <MoreHorizontal className="h-4 w-4" />
                                    <span className="sr-only">Toggle menu</span>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                    <DropdownMenuItem asChild>
                                        <Link href={`/admin/products/${product.productId}`}>Edit</Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleDelete(product.productId)}>Delete</DropdownMenuItem>
                                </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                    )
                })}
                 {filteredProducts.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">
                            No products found.
                        </TableCell>
                    </TableRow>
                 )}
            </TableBody>
            </Table>
        </CardContent>
        </Card>
    </div>
  );
}
