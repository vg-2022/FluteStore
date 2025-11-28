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
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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
import { useAccount } from "./_components/account-provider";
import { LogOut, Eye, EyeOff } from "lucide-react";

const profileSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  email: z.string().email("Please enter a valid email address."),
  phone: z.string().min(10, "Must be a valid mobile number").optional(),
});

function PasswordInputWithToggle({ id, label }: { id: string; label: string }) {
  const [showPassword, setShowPassword] = useState(false);
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input id={id} type={showPassword ? "text" : "password"} />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute inset-y-0 right-0 h-full px-3"
          onClick={() => setShowPassword(!showPassword)}
        >
          {showPassword ? <EyeOff /> : <Eye />}
          <span className="sr-only">
            {showPassword ? "Hide password" : "Show password"}
          </span>
        </Button>
      </div>
    </div>
  );
}

export default function AccountProfilePage() {
  const supabase = createClient();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [isSigningOutOthers, setIsSigningOutOthers] = useState(false);
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
        phone: user.user_metadata?.phone || user.phone || "",
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
            <CardTitle>Communication Preferences</CardTitle>
            <CardDescription>
              Manage your newsletter and notification settings.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox id="newsletter" defaultChecked />
              <Label htmlFor="newsletter" className="font-normal">
                Subscribe to our newsletter for new arrivals and special offers.
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="order-updates" defaultChecked />
              <Label htmlFor="order-updates" className="font-normal">
                Receive email notifications for order status updates.
              </Label>
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
            <CardDescription>
              For your security, we recommend using a strong password.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <PasswordInputWithToggle
              id="current-password"
              label="Current Password"
            />
            <PasswordInputWithToggle id="new-password" label="New Password" />
            <PasswordInputWithToggle
              id="confirm-password"
              label="Confirm New Password"
            />
          </CardContent>
          <CardFooter>
            <Button>Change Password</Button>
          </CardFooter>
        </Card>
      </AnimateOnScroll>

      <AnimateOnScroll delay={300}>
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
