
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useSettings } from '../_components/settings-provider';
import { getProducts } from '@/lib/products';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AnimateOnScroll } from '@/components/animate-on-scroll';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import type { FileObject } from '@supabase/storage-js';
import type { Product, HomepageSection } from '@/lib/types';
import { findImageById } from '@/lib/placeholder-images';

interface MediaFile extends FileObject {
  url: string;
  isUsed: boolean;
}

function StorageSkeleton() {
    return (
        <TableRow>
            <TableCell><Skeleton className="h-16 w-16 rounded-md" /></TableCell>
            <TableCell><Skeleton className="h-5 w-48" /></TableCell>
            <TableCell><Skeleton className="h-6 w-20" /></TableCell>
            <TableCell><Skeleton className="h-8 w-8" /></TableCell>
        </TableRow>
    );
}

export default function StorageManagementPage() {
    const supabase = createClient();
    const { toast } = useToast();
    const { storeDetails, homepageSections, aboutContent, isLoading: isLoadingSettings } = useSettings();
    const [allProducts, setAllProducts] = useState<Product[]>([]);
    const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
    const [loading, setLoading] = useState(true);
    const [fileToDelete, setFileToDelete] = useState<MediaFile | null>(null);

    const fetchAllData = useCallback(async () => {
        setLoading(true);
        try {
            const BUCKET_NAME = 'product_media';

            // 1. Fetch all files from storage
            const { data: storageFiles, error: storageError } = await supabase.storage.from(BUCKET_NAME).list();
            if (storageError) throw storageError;

            // 2. Fetch all products
            const products = await getProducts();
            setAllProducts(products);
            
            // This needs to wait for settings to be loaded
            if (isLoadingSettings) {
                 // We can't proceed without settings, let's wait for the effect to re-run
                return;
            }

            // 3. Build a set of all used URLs
            const usedUrls = new Set<string>();
            
            // From store settings
            if (storeDetails.logo) usedUrls.add(storeDetails.logo);
            
            // From products
            products.forEach(p => {
                p.imageUrls.forEach(url => usedUrls.add(url));
                if (p.audioUrl) usedUrls.add(p.audioUrl);
            });

            // From homepage sections
            homepageSections.forEach(section => {
                if (section.type === 'hero' || section.type === 'featuredProducts' || section.type === 'newArrivals' || section.type === 'accessories') {
                    // These sections use productIds, their URLs are already covered by product iteration
                } else if (section.type === 'collections' || section.type === 'categories') {
                    section.data.cards.forEach((card: any) => {
                       const img = findImageById(card.imageId);
                       if (img && img.imageUrl.startsWith('https://')) usedUrls.add(img.imageUrl);
                    });
                } else if (section.type === 'testimonials') {
                    section.data.testimonials.forEach((t: any) => {
                        if (t.imageUrl && t.imageUrl.startsWith('https://')) usedUrls.add(t.imageUrl);
                    });
                } else if (section.type === 'specialOffers') {
                    section.data.promotions.forEach((p: any) => {
                        if (p.imageUrl && p.imageUrl.startsWith('https://')) usedUrls.add(p.imageUrl);
                    });
                }
            });

            // From about page
            const aboutImg = findImageById(aboutContent.aboutImageId);
            if(aboutImg && aboutImg.imageUrl.startsWith('https://')) usedUrls.add(aboutImg.imageUrl);
            aboutContent.teamMembers.forEach(member => {
                const memberImg = findImageById(member.imageId);
                if (memberImg && memberImg.imageUrl.startsWith('https://')) usedUrls.add(memberImg.imageUrl);
            });

            // 4. Map storage files to MediaFile objects with usage status
            const processedFiles = storageFiles.map(file => {
                const { data: { publicUrl } } = supabase.storage.from(BUCKET_NAME).getPublicUrl(file.name);
                return {
                    ...file,
                    url: publicUrl,
                    isUsed: usedUrls.has(publicUrl),
                };
            });

            setMediaFiles(processedFiles);
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error fetching storage data', description: error.message });
        } finally {
            if (!isLoadingSettings) { // Only stop loading if settings are also done
                setLoading(false);
            }
        }
    }, [supabase, storeDetails, homepageSections, aboutContent, toast, isLoadingSettings]);

    useEffect(() => {
        fetchAllData();
    }, [fetchAllData]);

    const handleDelete = async () => {
        if (!fileToDelete) return;
        
        try {
            const { error } = await supabase.storage.from('product_media').remove([fileToDelete.name]);
            if (error) throw error;
            
            setMediaFiles(prev => prev.filter(f => f.id !== fileToDelete.id));
            toast({ title: 'File Deleted', description: `Successfully deleted ${fileToDelete.name}` });
        } catch (error: any) {
             toast({ variant: 'destructive', title: 'Error deleting file', description: error.message });
        } finally {
            setFileToDelete(null);
        }
    };

    return (
        <AnimateOnScroll>
            <Card>
                <CardHeader>
                    <CardTitle>Storage Management</CardTitle>
                    <CardDescription>View, preview, and delete uploaded media assets from your storage bucket.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Preview</TableHead>
                                <TableHead>File Name</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <>
                                    <StorageSkeleton />
                                    <StorageSkeleton />
                                    <StorageSkeleton />
                                </>
                            ) : (
                                mediaFiles.map(file => (
                                    <TableRow key={file.id}>
                                        <TableCell>
                                            {file.metadata.mimetype?.startsWith('image/') ? (
                                                <Image src={file.url} alt={file.name} width={64} height={64} className="rounded-md object-cover h-16 w-16" />
                                            ) : file.metadata.mimetype?.startsWith('audio/') ? (
                                                <audio controls src={file.url} className="w-48 h-10" />
                                            ) : (
                                                <div className="h-16 w-16 bg-muted rounded-md flex items-center justify-center text-xs text-muted-foreground">
                                                    No Preview
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell className="font-mono text-xs">{file.name}</TableCell>
                                        <TableCell>
                                            <Badge variant={file.isUsed ? 'secondary' : 'default'}>
                                                {file.isUsed ? 'In Use' : 'Unused'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-destructive"
                                                onClick={() => setFileToDelete(file)}
                                                disabled={file.isUsed}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                             {!loading && mediaFiles.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                                        No files found in storage bucket.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <AlertDialog open={!!fileToDelete} onOpenChange={() => setFileToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action will permanently delete the file <span className="font-mono bg-muted p-1 rounded">{fileToDelete?.name}</span>. This cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AnimateOnScroll>
    );
}
