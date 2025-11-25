"use client";

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
import { AnimateOnScroll } from "@/components/animate-on-scroll";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { createClient } from "@/lib/supabase/client";
import { LogOut } from "lucide-react";
import type { User } from "@supabase/supabase-js";

const profileSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  email: z.string().email("Please enter a valid email address."),
  phone: z.string().min(10, "Must be a valid mobile number").optional(),
});

export default function AdminProfilePage() {
  const supabase = createClient();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [isSigningOutOthers, setIsSigningOutOthers] = useState(false);
  const [user, setUser] = useState<User | null>(null);

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
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (user) {
        form.reset({
          email: user.email || "",
          first_name: user.user_metadata?.first_name || "",
          last_name: user.user_metadata?.last_name || "",
          phone: user.user_metadata?.phone || user.phone || "",
        });
      }
    });
  }, [supabase, form]);

  const handleProfileUpdate = async (values: z.infer<typeof profileSchema>) => {
    if (!user) return;
    setLoading(true);

    const { data, error } = await supabase.auth.updateUser({
      email: values.email,
      data: {
        first_name: values.first_name,
        last_name: values.last_name,
        phone: values.phone,
      },
    });

    if (error) {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: error.message,
      });
    } else if (data.user) {
      toast({
        title: "Profile Updated",
        description: "Your personal information has been saved.",
      });
    }

    setLoading(false);
  };

  const handleSignOutFromOtherDevices = async () => {
    setIsSigningOutOthers(true);
    const { error } = await supabase.auth.signOut({ scope: "others" });
    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } else {
      toast({
        title: "Success",
        description: "You have been signed out from all other devices.",
      });
    }
    setIsSigningOutOthers(false);
  };

  if (!user) {
    return <p>Loading profile...</p>;
  }

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <AnimateOnScroll>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleProfileUpdate)}>
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>
                  Update your personal details here.
                </CardDescription>
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
                <Button type="submit" disabled={loading}>
                  {loading ? "Saving..." : "Save Changes"}
                </Button>
              </CardFooter>
            </Card>
          </form>
        </Form>
      </AnimateOnScroll>

      <AnimateOnScroll delay={100}>
        <Card>
          <CardHeader>
            <CardTitle>Security</CardTitle>
            <CardDescription>Manage your active sessions.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              If you notice any suspicious activity, you can sign out from all
              other sessions except this one.
            </p>
          </CardContent>
          <CardFooter>
            <Button
              variant="outline"
              onClick={handleSignOutFromOtherDevices}
              disabled={isSigningOutOthers}
            >
              <LogOut className="mr-2 h-4 w-4" />
              {isSigningOutOthers
                ? "Signing out..."
                : "Sign out from all other devices"}
            </Button>
          </CardFooter>
        </Card>
      </AnimateOnScroll>
    </div>
  );
}
