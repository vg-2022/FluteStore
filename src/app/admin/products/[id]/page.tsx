
'use client';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ProductForm } from "../_components/product-form";
import { notFound, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import type { Product } from "@/lib/types";
import { getProductById } from "@/lib/products";

export default function EditProductPage() {
    const params = useParams();
    const id = Array.isArray(params.id) ? params.id[0] : params.id;
    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProduct = async () => {
            setLoading(true);
            const foundProduct = await getProductById(id);
            setProduct(foundProduct || null);
            setLoading(false);
        };
        fetchProduct();
    }, [id]);

    if (loading) {
        return <p>Loading product...</p>;
    }

    // After loading, if product is still not found, show 404
    if (!product) {
        notFound();
    }
    
    return (
        <Card>
            <CardHeader>
                <CardTitle>Edit Product</CardTitle>
                <CardDescription>Update the details for "{product?.productName || 'product'}".</CardDescription>
            </CardHeader>
            <CardContent>
                <ProductForm product={product}/>
            </CardContent>
        </Card>
    );
}
