
'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';
import type { User } from '@supabase/supabase-js';
import { createUser, updateUser } from '@/app/actions/user-management';

interface AdminUser extends User {
    user_metadata: {
        avatar_url?: string;
        first_name?: string;
        last_name?: string;
        is_admin?: boolean;
    }
}

const userFormSchema = z.object({
  first_name: z.string().min(1, 'First name is required.'),
  last_name: z.string().optional(),
  email: z.string().email('Please enter a valid email address.'),
  password: z.string().min(8, 'Password must be at least 8 characters.').optional().or(z.literal('')),
  is_admin: z.boolean(),
});

type UserFormValues = z.infer<typeof userFormSchema>;

interface UserFormProps {
  user?: AdminUser | null;
  onSuccess: () => void;
}

export function UserForm({ user, onSuccess }: UserFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const isEditing = !!user;

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      first_name: user?.user_metadata?.first_name || '',
      last_name: user?.user_metadata?.last_name || '',
      email: user?.email || '',
      password: '',
      is_admin: user?.user_metadata?.is_admin || false,
    },
  });

  const onSubmit = async (values: UserFormValues) => {
    setLoading(true);

    try {
        if (isEditing && user) {
            await updateUser(user.id, {
                first_name: values.first_name,
                last_name: values.last_name,
                is_admin: values.is_admin,
            });
            toast({ title: 'User Updated', description: 'The user details have been saved.' });
        } else {
            if (!values.password) {
                form.setError('password', { message: 'Password is required for new users.' });
                setLoading(false);
                return;
            }
            await createUser(values);
            toast({ title: 'User Created', description: 'The new user has been successfully created.' });
        }
        onSuccess();
    } catch (err: any) {
        toast({ variant: 'destructive', title: 'Error', description: err.message });
    } finally {
        setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
            <FormField
            control={form.control}
            name="first_name"
            render={({ field }) => (
                <FormItem>
                <FormLabel>First Name</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="last_name"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Last Name</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl><Input type="email" {...field} disabled={isEditing} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {!isEditing && (
            <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl><Input type="password" {...field} /></FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
        )}
        <FormField
          control={form.control}
          name="is_admin"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
              <div className="space-y-0.5">
                <FormLabel>Administrator</FormLabel>
                <FormMessage />
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />
        <div className="flex justify-end gap-2 pt-4">
           <Button type="button" variant="outline" onClick={onSuccess}>Cancel</Button>
           <Button type="submit" disabled={loading}>
            {loading ? 'Saving...' : (isEditing ? 'Save Changes' : 'Create User')}
           </Button>
        </div>
      </form>
    </Form>
  );
}
