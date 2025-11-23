
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { AnimateOnScroll } from "@/components/animate-on-scroll";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { createClient } from "@/lib/supabase/client";
import { useAccount } from "./_components/account-provider";

const profileSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  email: z.string().email("Please enter a valid email address."),
  phone: z.string().min(10, "Must be a valid mobile number").optional(),
});

export default function AccountProfilePage() {
  const supabase = createClient();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const { user } = useAccount();

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
    },
  });

  useEffect(() => {
    if (user) {
        form.reset({
            email: user.email || "",
            first_name: user.user_metadata?.first_name || "",
            last_name: user.user_metadata?.last_name || "",
            phone: user.user_metadata?.phone || user.phone || ""
        });
    }
  }, [user, form]);
  
  const handleProfileUpdate = async (values: z.infer<typeof profileSchema>) => {
    if (!user) return;
    setLoading(true);
    
    const { data, error } = await supabase.auth.updateUser({
        email: values.email,
        data: {
            first_name: values.first_name,
            last_name: values.last_name,
            phone: values.phone,
        }
    });

    if (error) {
        toast({ variant: 'destructive', title: 'Update Failed', description: error.message });
    } else if (data.user) {
        toast({ title: 'Profile Updated', description: 'Your personal information has been saved.' });
    }

    setLoading(false);
  };
  
  if (!user) {
    return null;
  }

  return (
    <div className="space-y-8">
        <AnimateOnScroll>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleProfileUpdate)}>
                <Card>
                    <CardHeader>
                    <CardTitle>Personal Information</CardTitle>
                    <CardDescription>Update your personal details here.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="first_name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>First Name</FormLabel>
                                <FormControl>
                                  <Input {...field} disabled={loading} />
                                </FormControl>
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
                                <FormControl>
                                  <Input {...field} disabled={loading} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                  <Input type="email" {...field} disabled={loading} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="phone"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Mobile Number</FormLabel>
                                <FormControl>
                                  <Input type="tel" {...field} disabled={loading} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                      </div>
                    </CardContent>
                    <CardFooter>
                    <Button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save Changes'}</Button>
                    </CardFooter>
                </Card>
              </form>
            </Form>
        </AnimateOnScroll>
      
        <AnimateOnScroll delay={100}>
            <Card>
                <CardHeader>
                <CardTitle>Communication Preferences</CardTitle>
                <CardDescription>Manage your newsletter and notification settings.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                    <Checkbox id="newsletter" defaultChecked/>
                    <Label htmlFor="newsletter" className="font-normal">Subscribe to our newsletter for new arrivals and special offers.</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                    <Checkbox id="order-updates" defaultChecked/>
                    <Label htmlFor="order-updates" className="font-normal">Receive email notifications for order status updates.</Label>
                    </div>
                </CardContent>
                <CardFooter>
                <Button>Update Preferences</Button>
                </CardFooter>
            </Card>
        </AnimateOnScroll>

        <AnimateOnScroll delay={200}>
            <Card>
                <CardHeader>
                <CardTitle>Change Password</CardTitle>
                <CardDescription>For your security, we recommend using a strong password.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="current-password">Current Password</Label>
                    <Input id="current-password" type="password" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <Input id="new-password" type="password" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm New Password</Label>
                    <Input id="confirm-password" type="password" />
                </div>
                </CardContent>
                <CardFooter>
                <Button>Change Password</Button>
                </CardFooter>
            </Card>
        </AnimateOnScroll>
    </div>
  );
}
