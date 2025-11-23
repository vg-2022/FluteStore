
'use client';

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { countries, indianStates } from '@/lib/data/locations';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Check, ChevronsUpDown } from 'lucide-react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { ScrollArea } from '@/components/ui/scroll-area';
import { createClient } from '@/lib/supabase/client';
import type { UserAddress } from '@/lib/types';

const FormLabelWithAsterisk = ({ children }: { children: React.ReactNode }) => (
  <FormLabel>
    {children} <span className="text-destructive">*</span>
  </FormLabel>
);

const addressSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  address_line_1: z.string().min(1, 'House/Flat number is required.'),
  street: z.string().min(3, 'Street address must be at least 3 characters.'),
  city: z.string().min(2, 'City is required.'),
  state: z.string().min(2, 'State is required.'),
  pincode: z.string().min(6, 'A valid 6-digit pincode is required.').max(6, 'A valid 6-digit pincode is required.'),
  country: z.string().min(2, 'Country is required.'),
  phone_number: z.string().length(10, "A valid 10-digit mobile number is required."),
  alternate_phone_number: z.string().length(10, "A valid 10-digit mobile number is required.").optional().or(z.literal('')),
  is_default: z.boolean(),
});

type AddressFormValues = z.infer<typeof addressSchema>;

interface AddressFormProps {
  userId?: string;
  address?: UserAddress | null;
  existingAddresses: UserAddress[];
  onSuccess: () => void;
}

export function AddressForm({ userId, address, existingAddresses, onSuccess }: AddressFormProps) {
  const supabase = createClient();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [isPincodeLoading, setIsPincodeLoading] = useState(false);

  const defaultFormValues: AddressFormValues = {
    name: '',
    address_line_1: '',
    street: '',
    city: '',
    state: '',
    pincode: '',
    country: 'India',
    phone_number: '',
    alternate_phone_number: '',
    is_default: false,
  };

  const form = useForm<AddressFormValues>({
    resolver: zodResolver(addressSchema),
    defaultValues: address ? {
      name: address.name || '',
      address_line_1: address.address_line_1 || '',
      street: address.street || '',
      city: address.city || '',
      state: address.state || '',
      pincode: address.pincode || '',
      country: address.country || 'India',
      phone_number: address.phone_number || '',
      alternate_phone_number: address.alternate_phone_number || '',
      is_default: address.is_default || false,
    } : defaultFormValues,
  });
  
  const selectedCountry = form.watch('country');
  const pincodeValue = form.watch('pincode');

  useEffect(() => {
    if (address) {
      form.reset({
        name: address.name || '',
        address_line_1: address.address_line_1 || '',
        street: address.street || '',
        city: address.city || '',
        state: address.state || '',
        pincode: address.pincode || '',
        country: address.country || 'India',
        phone_number: address.phone_number || '',
        alternate_phone_number: address.alternate_phone_number || '',
        is_default: address.is_default || false,
      });
    } else {
        form.reset(defaultFormValues);
    }
  }, [address, form]);
  
  useEffect(() => {
    const fetchPincodeDetails = async (pincode: string) => {
        if (pincode.length === 6 && selectedCountry === 'India') {
            setIsPincodeLoading(true);
            try {
                const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
                const data = await response.json();
                if (data && data[0] && data[0].Status === 'Success') {
                    const postOffice = data[0].PostOffice[0];
                    form.setValue('city', postOffice.District, { shouldValidate: true });
                    form.setValue('state', postOffice.State, { shouldValidate: true });
                } else {
                    toast({ variant: 'destructive', title: 'Invalid Pincode', description: 'Could not find details for this pincode.' });
                }
            } catch (error) {
                toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch pincode details.' });
            } finally {
                setIsPincodeLoading(false);
            }
        }
    };
    fetchPincodeDetails(pincodeValue);
  }, [pincodeValue, selectedCountry, form, toast]);

  const onSubmit = async (values: AddressFormValues) => {
    setLoading(true);
    if (!userId) {
      toast({ variant: 'destructive', title: 'Error', description: 'User not found.' });
      setLoading(false);
      return;
    }

    let newAddresses: UserAddress[];

    if (address) {
      // Editing an existing address
      newAddresses = existingAddresses.map(a =>
        a.id === address.id ? { ...a, ...values } : a
      );
    } else {
      // Adding a new address
      const newAddress: UserAddress = {
        ...values,
        id: Date.now(), // Use timestamp for a simple unique ID
      };
      newAddresses = [...existingAddresses, newAddress];
    }
    
    // Handle default address logic
    if (values.is_default) {
        newAddresses = newAddresses.map(a => ({
            ...a,
            is_default: a.id === (address?.id || newAddresses[newAddresses.length-1].id)
        }));
    }

    try {
      const { error } = await supabase
        .from('shipping_details')
        .upsert({ user_id: userId, addresses: newAddresses }, { onConflict: 'user_id' });

      if (error) throw error;
      
      toast({ title: address ? 'Address Updated' : 'Address Added' });
      onSuccess();

    } catch (err: any) {
        toast({ variant: 'destructive', title: 'Database Error', description: err.message });
    } finally {
        setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabelWithAsterisk>Full Name</FormLabelWithAsterisk>
              <FormControl>
                <Input placeholder="e.g. Shekhar Mishra" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="address_line_1"
          render={({ field }) => (
            <FormItem>
              <FormLabelWithAsterisk>House / Flat No.</FormLabelWithAsterisk>
              <FormControl>
                <Input placeholder="e.g. 12B" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="street"
          render={({ field }) => (
            <FormItem>
              <FormLabelWithAsterisk>Street Address / Colony</FormLabelWithAsterisk>
              <FormControl>
                <Input placeholder="e.g. Ocean View Apartments" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
           <FormField
            control={form.control}
            name="pincode"
            render={({ field }) => (
              <FormItem>
                <FormLabelWithAsterisk>Postal Code</FormLabelWithAsterisk>
                <FormControl>
                  <Input placeholder="e.g. 400049" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
           <FormField
            control={form.control}
            name="city"
            render={({ field }) => (
              <FormItem>
                <FormLabelWithAsterisk>City</FormLabelWithAsterisk>
                <FormControl>
                  <Input placeholder="e.g. Mumbai" {...field} disabled={isPincodeLoading} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
         <div className="grid grid-cols-2 gap-4">
           <FormField
              control={form.control}
              name="state"
              render={({ field }) => (
                <FormItem className="flex flex-col pt-2">
                  <FormLabelWithAsterisk>State</FormLabelWithAsterisk>
                  {selectedCountry === 'India' ? (
                     <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              role="combobox"
                              className={cn(
                                "w-full justify-between",
                                !field.value && "text-muted-foreground"
                              )}
                              disabled={isPincodeLoading}
                            >
                              {field.value
                                ? indianStates.find(
                                    (state) => state === field.value
                                  )
                                : "Select state"}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0">
                           <Command>
                            <CommandInput placeholder="Search state..." />
                            <CommandEmpty>No state found.</CommandEmpty>
                            <CommandGroup>
                              <ScrollArea className="h-72">
                                {indianStates.map((state) => (
                                  <CommandItem
                                    value={state}
                                    key={state}
                                    onSelect={() => {
                                      form.setValue("state", state)
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        state === field.value
                                          ? "opacity-100"
                                          : "opacity-0"
                                      )}
                                    />
                                    {state}
                                  </CommandItem>
                                ))}
                              </ScrollArea>
                            </CommandGroup>
                          </Command>
                        </PopoverContent>
                      </Popover>
                  ) : (
                     <FormControl>
                        <Input placeholder="e.g. California" {...field} />
                     </FormControl>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
          <FormField
              control={form.control}
              name="country"
              render={({ field }) => (
                <FormItem>
                  <FormLabelWithAsterisk>Country</FormLabelWithAsterisk>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a country" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <ScrollArea className="h-72">
                        {countries.map(country => (
                          <SelectItem key={country} value={country}>{country}</SelectItem>
                        ))}
                      </ScrollArea>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
        </div>
        <FormField
          control={form.control}
          name="phone_number"
          render={({ field }) => (
            <FormItem>
              <FormLabelWithAsterisk>Phone Number</FormLabelWithAsterisk>
              <FormControl>
                <Input type="tel" placeholder="e.g. 9876543210" {...field} value={field.value ?? ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="alternate_phone_number"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Alternate Phone Number (Optional)</FormLabel>
              <FormControl>
                <Input type="tel" placeholder="e.g. 9876543211" {...field} value={field.value ?? ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="is_default"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>
                  Set as default shipping address
                </FormLabel>
              </div>
            </FormItem>
          )}
        />
        <div className="flex justify-end gap-2 pt-4">
           <Button type="button" variant="outline" onClick={() => onSuccess()}>Cancel</Button>
           <Button type="submit" disabled={loading || isPincodeLoading}>
            {loading ? (address ? 'Saving...' : 'Adding...') : (address ? 'Save Changes' : 'Add Address')}
           </Button>
        </div>
      </form>
    </Form>
  );
}
