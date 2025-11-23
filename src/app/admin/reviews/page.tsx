

'use client';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Star, Check, X, MoreVertical, Trash2 } from "lucide-react";
import React, { useState, useEffect, useCallback } from "react";
import { AnimateOnScroll } from "@/components/animate-on-scroll";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { Review, Product } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
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
import { getProducts } from "@/lib/products";
import { Skeleton } from "@/components/ui/skeleton";

async function fetchReviews(supabase: any) {
    const { data, error } = await supabase.from('reviews_with_user_info').select('*').order('review_date', { ascending: false });
    if (error) {
        console.error("Error fetching reviews:", error);
        return [];
    }
    return data;
}

export default function AdminReviewsPage() {
    const supabase = createClient();
    const { toast } = useToast();
    const [reviews, setReviews] = useState<any[]>([]);
    const [products, setProducts] = useState<Map<string, Product>>(new Map());
    const [loading, setLoading] = useState(true);
    const [reviewToDelete, setReviewToDelete] = useState<any | null>(null);

    const loadData = useCallback(async () => {
        setLoading(true);
        const [reviewsData, productsData] = await Promise.all([
            fetchReviews(supabase),
            getProducts()
        ]);
        setReviews(reviewsData);
        setProducts(new Map(productsData.map(p => [p.productId, p])));
        setLoading(false);
    }, [supabase]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleStatusChange = async (review: any, status: 'approved' | 'rejected') => {
        const { error } = await supabase.from('reviews').update({ status }).match({ user_id: review.user_id, product_id: review.product_id });

        if (error) {
            toast({ variant: "destructive", title: "Error updating review", description: error.message });
        } else {
            toast({ title: `Review ${status}` });
            setReviews(prev => prev.map(r => r.id === review.id ? { ...r, status } : r));
        }
    };
    
    const handleDeleteReview = async () => {
        if (!reviewToDelete) return;
        const { error } = await supabase.from('reviews').delete().match({ user_id: reviewToDelete.user_id, product_id: reviewToDelete.product_id });
        
        if (error) {
            toast({ variant: "destructive", title: "Error deleting review", description: error.message });
        } else {
            toast({ title: "Review deleted" });
            setReviews(prev => prev.filter(r => r.id !== reviewToDelete.id));
        }
        setReviewToDelete(null);
    };

    const getStatusVariant = (status: Review['status']) => {
        switch (status) {
            case 'approved': return 'default';
            case 'rejected': return 'destructive';
            case 'pending': return 'secondary';
            default: return 'secondary';
        }
    };

  return (
    <div className="space-y-8">
        <div>
            <h1 className="text-2xl font-bold">Manage Product Reviews</h1>
            <p className="text-muted-foreground">Approve, reject, or delete reviews submitted by customers.</p>
        </div>
        
        <AnimateOnScroll>
             <Card>
                <CardHeader>
                    <CardTitle>All Reviews</CardTitle>
                    <CardDescription>A list of all product reviews submitted by users.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Customer</TableHead>
                                <TableHead>Product</TableHead>
                                <TableHead>Review</TableHead>
                                <TableHead>Rating</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="w-24">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading && Array.from({length: 5}).map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                                    <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                                    <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                                </TableRow>
                            ))}
                            {!loading && reviews.map(review => {
                                const productName = products.get(review.product_id)?.productName || 'Unknown Product';
                                return (
                                    <TableRow key={review.id}>
                                        <TableCell>
                                            <div className="font-semibold">{review.first_name || 'Anonymous'}</div>
                                        </TableCell>
                                        <TableCell className="text-xs text-muted-foreground">{productName}</TableCell>
                                        <TableCell>
                                            <p className="font-semibold">{review.review_title}</p>
                                            <p className="max-w-xs truncate text-sm text-muted-foreground whitespace-pre-wrap">"{review.review_desc}"</p>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1">
                                                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400"/>
                                                {review.rating_value}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={getStatusVariant(review.status)}>{review.status}</Badge>
                                        </TableCell>
                                        <TableCell>
                                             <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => handleStatusChange(review, 'approved')}><Check className="mr-2 h-4 w-4 text-green-500" /> Approve</DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleStatusChange(review, 'rejected')}><X className="mr-2 h-4 w-4 text-orange-500"/> Reject</DropdownMenuItem>
                                                    <DropdownMenuItem className="text-destructive" onClick={() => setReviewToDelete(review)}><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                )
                            })}
                        </TableBody>
                    </Table>
                     {!loading && reviews.length === 0 && <div className="text-center p-8 text-muted-foreground">No reviews found.</div>}
                </CardContent>
            </Card>
        </AnimateOnScroll>
        <AlertDialog open={!!reviewToDelete} onOpenChange={(open) => !open && setReviewToDelete(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This will permanently delete this review. This action cannot be undone.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteReview}>Delete</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </div>
  );
}
