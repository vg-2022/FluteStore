
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MoreVertical, PlusCircle } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
import { cn } from "@/lib/utils";
import { AnimateOnScroll } from "@/components/animate-on-scroll";
import { AddressForm } from './_components/address-form';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { createClient } from '@/lib/supabase/client';
import type { UserAddress } from '@/lib/types';
import { useAccount } from '../_components/account-provider';

function AddressSkeleton() {
    return (
        <Card>
            <CardHeader>
                <Skeleton className="h-6 w-1/2" />
                <Skeleton className="h-4 w-1/4 mt-1" />
            </CardHeader>
            <CardContent>
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-4 w-2/3" />
            </CardContent>
        </Card>
    );
}

export default function AddressesPage() {
  const supabase = createClient();
  const { toast } = useToast();
  const { user, loading: userLoading } = useAccount();
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<UserAddress | null>(null);
  const [addressToDelete, setAddressToDelete] = useState<UserAddress | null>(null);

  const loadAddresses = useCallback(async () => {
    if (!user) {
        setLoading(false);
        return;
    };
    setLoading(true);
    const { data, error } = await supabase
        .from('shipping_details')
        .select('addresses')
        .eq('user_id', user.id)
        .single();

    if (error && error.code !== 'PGRST116') { // Ignore 'single row not found' error
        toast({ variant: 'destructive', title: 'Error fetching addresses', description: error.message });
        setAddresses([]);
    } else {
        const sortedAddresses = (data?.addresses || []).sort((a: UserAddress, b: UserAddress) => (b.is_default ? 1 : -1));
        setAddresses(sortedAddresses);
    }
    setLoading(false);
  }, [user, supabase, toast]);
  
  useEffect(() => {
    if (!userLoading) {
      loadAddresses();
    }
  }, [loadAddresses, userLoading]);

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setEditingAddress(null);
    loadAddresses();
  };
  
  const handleSetDefault = async (addressId: number) => {
    if (!user) return;
    
    const updatedAddresses = addresses.map(addr => ({
        ...addr,
        is_default: addr.id === addressId
    }));
    
    const { error } = await supabase
        .from('shipping_details')
        .upsert({ user_id: user.id, addresses: updatedAddresses }, { onConflict: 'user_id' });

    if (error) {
        toast({ variant: 'destructive', title: 'Error setting default', description: error.message });
    } else {
        toast({ title: "Default address updated."});
        loadAddresses();
    }
  };

  const handleDelete = async () => {
    if (!addressToDelete || !user) return;
    
    const updatedAddresses = addresses.filter(addr => addr.id !== addressToDelete.id);

    const { error } = await supabase
        .from('shipping_details')
        .upsert({ user_id: user.id, addresses: updatedAddresses }, { onConflict: 'user_id' });
    
    if (error) {
        toast({ variant: 'destructive', title: 'Error deleting address', description: error.message });
    } else {
        toast({ title: "Address removed." });
        setAddressToDelete(null);
        loadAddresses();
    }
  };
  
  const isLoading = userLoading || loading;

  return (
    <div>
        <div className="flex justify-between items-center mb-6">
            <div>
                 <h1 className="text-2xl font-bold">Manage Addresses</h1>
                 <p className="text-muted-foreground">Add, edit, or remove your shipping addresses.</p>
            </div>
            <Dialog open={isFormOpen} onOpenChange={(open) => {
                setIsFormOpen(open);
                if (!open) setEditingAddress(null);
            }}>
                <DialogTrigger asChild>
                    <Button><PlusCircle className="mr-2 h-4 w-4"/> Add New Address</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px] md:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>{editingAddress ? 'Edit Address' : 'Add New Address'}</DialogTitle>
                    </DialogHeader>
                    <ScrollArea className="h-[calc(80vh-4rem)] pr-6 -mr-6">
                        <AddressForm 
                            userId={user?.id}
                            address={editingAddress} 
                            existingAddresses={addresses}
                            onSuccess={handleFormSuccess}
                        />
                    </ScrollArea>
                </DialogContent>
            </Dialog>
        </div>

        {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <AddressSkeleton />
                <AddressSkeleton />
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {addresses.map((address, i) => (
                    <AnimateOnScroll key={address.id} delay={i * 100}>
                        <Card className={cn("flex flex-col", address.is_default && "border-primary")}>
                            <CardHeader className="flex flex-row items-start justify-between">
                                <div>
                                    <CardTitle className="text-lg">{address.name}</CardTitle>
                                    {address.is_default && <CardDescription className="text-primary font-semibold">Default Address</CardDescription>}
                                </div>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                            <MoreVertical className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => { setEditingAddress(address); setIsFormOpen(true); }}>Edit</DropdownMenuItem>
                                        {!address.is_default && <DropdownMenuItem onClick={() => handleSetDefault(address.id)}>Set as Default</DropdownMenuItem>}
                                        <DropdownMenuItem className="text-destructive" onClick={() => setAddressToDelete(address)}>Delete</DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </CardHeader>
                            <CardContent className="text-muted-foreground flex-grow">
                                <p>{address.address_line_1}, {address.street}</p>
                                <p>{address.city}, {address.state} {address.pincode}</p>
                                <p>{address.country}</p>
                                <p>Phone: {address.phone_number}</p>
                                {address.alternate_phone_number && <p>Alt Phone: {address.alternate_phone_number}</p>}
                            </CardContent>
                        </Card>
                    </AnimateOnScroll>
                ))}
                 {addresses.length === 0 && (
                    <div className="col-span-full text-center py-12 text-muted-foreground">
                        You haven't added any addresses yet.
                    </div>
                 )}
            </div>
        )}

        <AlertDialog open={!!addressToDelete} onOpenChange={() => setAddressToDelete(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This will permanently delete this address. This action cannot be undone.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </div>
  );
}
