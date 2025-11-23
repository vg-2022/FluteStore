
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

const signInSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
  password: z.string().min(1, "Password is required."),
});

const signUpSchema = z.object({
  firstName: z.string().min(1, "First name is required."),
  lastName: z.string().optional(),
  countryCode: z.string(),
  phone: z.string().length(10, "Please enter a valid 10-digit mobile number."),
  email: z.string().email("Please enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

export function AuthForm() {
  const supabase = createClient();
  const router = useRouter();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("sign-in");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signInForm = useForm<z.infer<typeof signInSchema>>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
    mode: 'onBlur',
  });

  const signUpForm = useForm<z.infer<typeof signUpSchema>>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { 
        firstName: "", 
        lastName: "", 
        email: "", 
        countryCode: "+91", 
        phone: "", 
        password: "" 
    },
    mode: 'onBlur',
  });

  const handleSignIn = async (values: z.infer<typeof signInSchema>) => {
    setLoading(true);
    setError(null);
    
    const { data, error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
    });

    if (error) {
        setError(error.message);
        toast({ variant: 'destructive', title: 'Sign In Failed', description: error.message });
    } else if (data.user) {
        toast({ title: 'Welcome back!', description: 'You have been successfully signed in.' });
        router.refresh();
    }
    setLoading(false);
  };
  
  const handleSignUp = async (values: z.infer<typeof signUpSchema>) => {
    setLoading(true);
    setError(null);

    const { data, error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
            data: {
                first_name: values.firstName,
                last_name: values.lastName,
                phone: `${values.countryCode}${values.phone}`,
            },
        },
    });
    
    if (error) {
        setError(error.message);
        toast({ variant: 'destructive', title: 'Sign Up Failed', description: error.message });
    } else if (data.user) {
        toast({ title: 'Account Created!', description: 'You have been successfully signed up. Please check your email to verify your account.' });
        router.refresh();
    }

    setLoading(false);
  };

  return (
    <div className="flex justify-center items-center py-12">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full max-w-md">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="sign-in">Sign In</TabsTrigger>
                <TabsTrigger value="sign-up">Sign Up</TabsTrigger>
            </TabsList>
            <TabsContent value="sign-in">
                <Card>
                <CardHeader>
                    <CardTitle>Welcome Back!</CardTitle>
                    <CardDescription>Sign in to access your account and continue your journey with us.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...signInForm}>
                        <form onSubmit={signInForm.handleSubmit(handleSignIn)} className="space-y-4">
                            <FormField
                                control={signInForm.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email Address</FormLabel>
                                        <FormControl>
                                            <Input type="email" placeholder="you@example.com" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={signInForm.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Password</FormLabel>
                                        <FormControl>
                                            <Input type="password" placeholder="••••••••" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            {error && <p className="text-sm font-medium text-destructive">{error}</p>}
                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading ? 'Signing In...' : 'Sign In'}
                            </Button>
                        </form>
                    </Form>
                </CardContent>
                 <CardFooter className="text-sm text-center block">
                     Don't have an account? <Button variant="link" type="button" className="p-0" onClick={() => setActiveTab('sign-up')}>Create one</Button>
                </CardFooter>
                </Card>
            </TabsContent>
            <TabsContent value="sign-up">
                <Card>
                    <CardHeader>
                        <CardTitle>Create Your Account</CardTitle>
                        <CardDescription>It's quick, easy, and opens the door to a world of melody.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form {...signUpForm}>
                            <form onSubmit={signUpForm.handleSubmit(handleSignUp)} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={signUpForm.control}
                                        name="firstName"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>First Name</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Shekhar" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={signUpForm.control}
                                        name="lastName"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Last Name (Optional)</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Mishra" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <FormItem>
                                    <FormLabel>Mobile Number</FormLabel>
                                    <div className="flex gap-2">
                                        <FormField
                                            control={signUpForm.control}
                                            name="countryCode"
                                            render={({ field }) => (
                                                <FormItem className="w-24">
                                                    <FormControl>
                                                         <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Code" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="+91">+91</SelectItem>
                                                                <SelectItem value="+1">+1</SelectItem>
                                                                <SelectItem value="+44">+44</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={signUpForm.control}
                                            name="phone"
                                            render={({ field }) => (
                                                <FormItem className="flex-1">
                                                    <FormControl>
                                                        <Input type="tel" placeholder="9876543210" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </FormItem>
                                <FormField
                                    control={signUpForm.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Email Address</FormLabel>
                                            <FormControl>
                                                <Input type="email" placeholder="you@example.com" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={signUpForm.control}
                                    name="password"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Password</FormLabel>
                                            <FormControl>
                                                <Input type="password" placeholder="••••••••" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <Button type="submit" className="w-full" disabled={loading}>
                                    {loading ? 'Creating Account...' : 'Create Account'}
                                </Button>
                            </form>
                        </Form>
                    </CardContent>
                    <CardFooter className="text-sm text-center block">
                        Already registered? <Button variant="link" type="button" className="p-0" onClick={() => setActiveTab('sign-in')}>Sign in here</Button>
                    </CardFooter>
                </Card>
            </TabsContent>
        </Tabs>
    </div>
  );
}
