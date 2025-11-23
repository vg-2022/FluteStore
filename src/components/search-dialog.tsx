
'use client';

import * as React from "react"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { getProducts } from "@/lib/products"
import { useRouter } from "next/navigation";
import { Music } from "lucide-react";
import type { Product } from "@/lib/types";

interface SearchDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function SearchDialog({ open, onOpenChange }: SearchDialogProps) {
    const router = useRouter();
    const [products, setProducts] = React.useState<Product[]>([]);

    React.useEffect(() => {
        const fetchProducts = async () => {
            if (open) {
                const prods = await getProducts();
                setProducts(prods);
            }
        };
        fetchProducts();
    }, [open]);
    
    const runCommand = React.useCallback((command: () => unknown) => {
        onOpenChange(false)
        command()
    }, [onOpenChange])

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Products">
            {products.map(product => (
                 <CommandItem
                    key={product.productId}
                    value={product.productName}
                    onSelect={() => {
                        const url = product.productType === 'accessory' ? `/accessories/${product.productId}` : `/products/${product.productId}`;
                        runCommand(() => router.push(url))
                    }}
                 >
                    <Music className="mr-2 h-4 w-4" />
                    {product.productName}
                </CommandItem>
            ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
