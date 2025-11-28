"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";

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

const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
});

const updatePasswordSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters."),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

type AuthView =
  | "sign-in"
  | "sign-up"
  | "forgot-password"
  | "forgot-password-sent"
  | "update-password";

export function AuthForm() {
  const supabase = createClient();
  const router = useRouter();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"sign-in" | "sign-up">("sign-in");
  const [authView, setAuthView] = useState<AuthView>("sign-in");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSignInPassword, setShowSignInPassword] = useState(false);
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        setAuthView("update-password");
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  const signInForm = useForm<z.infer<typeof signInSchema>>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
    mode: "onBlur",
  });

  const signUpForm = useForm<z.infer<typeof signUpSchema>>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      countryCode: "+91",
      phone: "",
      password: "",
    },
    mode: "onBlur",
  });

  const forgotPasswordForm = useForm<z.infer<typeof forgotPasswordSchema>>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
    mode: "onBlur",
  });

  const updatePasswordForm = useForm<z.infer<typeof updatePasswordSchema>>({
    resolver: zodResolver(updatePasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
    mode: "onBlur",
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
      toast({
        variant: "destructive",
        title: "Sign In Failed",
        description: error.message,
      });
    } else if (data.user) {
      toast({
        title: "Welcome back!",
        description: "You have been successfully signed in.",
      });
      if (data.user.user_metadata?.is_admin) {
        router.push("/admin");
      } else {
        router.refresh();
      }
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
      toast({
        variant: "destructive",
        title: "Sign Up Failed",
        description: error.message,
      });
    } else if (data.user) {
      toast({
        title: "Account Created!",
        description:
          "You have been successfully signed up. Please check your email to verify your account.",
      });
      router.refresh();
    }
    setLoading(false);
  };

  const handleForgotPassword = async (
    values: z.infer<typeof forgotPasswordSchema>
  ) => {
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
      redirectTo: `${window.location.origin}/account`,
    });

    if (error) {
      setError(error.message);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } else {
      setAuthView("forgot-password-sent");
    }
    setLoading(false);
  };

  const handleUpdatePassword = async (
    values: z.infer<typeof updatePasswordSchema>
  ) => {
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.updateUser({
      password: values.password,
    });

    if (error) {
      setError(error.message);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } else {
      toast({
        title: "Password updated successfully!",
        description: "Please sign in with your new password.",
      });
      setAuthView("sign-in");
    }
    setLoading(false);
  };

  if (authView === "update-password") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Update Your Password</CardTitle>
          <CardDescription>
            Enter and confirm your new password below.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...updatePasswordForm}>
            <form
              onSubmit={updatePasswordForm.handleSubmit(handleUpdatePassword)}
              className="space-y-4"
            >
              <FormField
                control={updatePasswordForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Password</FormLabel>
                    <div className="relative">
                      <FormControl>
                        <Input
                          type={showNewPassword ? "text" : "password"}
                          placeholder="••••••••"
                          {...field}
                        />
                      </FormControl>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute inset-y-0 right-0 h-full px-3"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      >
                        {showNewPassword ? <EyeOff /> : <Eye />}
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={updatePasswordForm.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm New Password</FormLabel>
                    <div className="relative">
                      <FormControl>
                        <Input
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="••••••••"
                          {...field}
                        />
                      </FormControl>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute inset-y-0 right-0 h-full px-3"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                      >
                        {showConfirmPassword ? <EyeOff /> : <Eye />}
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {error && (
                <p className="text-sm font-medium text-destructive">{error}</p>
              )}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Updating..." : "Update Password"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex justify-center items-center py-12">
      <Tabs
        value={activeTab}
        onValueChange={(tab) => {
          const newAuthView = tab as AuthView;
          setActiveTab(tab as "sign-in" | "sign-up");
          setAuthView(newAuthView);
          setError(null); // Clear errors on tab change
        }}
        className="w-full max-w-md"
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="sign-in">Sign In</TabsTrigger>
          <TabsTrigger value="sign-up">Sign Up</TabsTrigger>
        </TabsList>
        <TabsContent value="sign-in">
          {authView === "sign-in" && (
            <Card>
              <CardHeader>
                <CardTitle>Welcome Back!</CardTitle>
                <CardDescription>
                  Sign in to access your account and continue your journey with
                  us.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...signInForm}>
                  <form
                    onSubmit={signInForm.handleSubmit(handleSignIn)}
                    className="space-y-4"
                  >
                    <FormField
                      control={signInForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address</FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="you@example.com"
                              {...field}
                            />
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
                          <div className="relative">
                            <FormControl>
                              <Input
                                type={showSignInPassword ? "text" : "password"}
                                placeholder="••••••••"
                                {...field}
                              />
                            </FormControl>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute inset-y-0 right-0 h-full px-3"
                              onClick={() =>
                                setShowSignInPassword(!showSignInPassword)
                              }
                            >
                              {showSignInPassword ? <EyeOff /> : <Eye />}
                              <span className="sr-only">
                                {showSignInPassword
                                  ? "Hide password"
                                  : "Show password"}
                              </span>
                            </Button>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="text-right">
                      <Button
                        variant="link"
                        size="sm"
                        type="button"
                        className="p-0 h-auto"
                        onClick={() => setAuthView("forgot-password")}
                      >
                        Forgot password?
                      </Button>
                    </div>
                    {error && (
                      <p className="text-sm font-medium text-destructive">
                        {error}
                      </p>
                    )}
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? "Signing In..." : "Sign In"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
              <CardFooter className="text-sm text-center block">
                Don't have an account?{" "}
                <Button
                  variant="link"
                  type="button"
                  className="p-0"
                  onClick={() => {
                    setActiveTab("sign-up");
                    setAuthView("sign-up");
                  }}
                >
                  Create one
                </Button>
              </CardFooter>
            </Card>
          )}
          {authView === "forgot-password" && (
            <Card>
              <CardHeader>
                <CardTitle>Reset Password</CardTitle>
                <CardDescription>
                  Enter your email to receive a password reset link.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...forgotPasswordForm}>
                  <form
                    onSubmit={forgotPasswordForm.handleSubmit(
                      handleForgotPassword
                    )}
                    className="space-y-4"
                  >
                    <FormField
                      control={forgotPasswordForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address</FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="you@example.com"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {error && (
                      <p className="text-sm font-medium text-destructive">
                        {error}
                      </p>
                    )}
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? "Sending..." : "Send Reset Link"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
              <CardFooter className="text-sm text-center block">
                Remembered your password?{" "}
                <Button
                  variant="link"
                  type="button"
                  className="p-0"
                  onClick={() => setAuthView("sign-in")}
                >
                  Back to Sign In
                </Button>
              </CardFooter>
            </Card>
          )}
          {authView === "forgot-password-sent" && (
            <Card>
              <CardHeader>
                <CardTitle>Check Your Email</CardTitle>
                <CardDescription>
                  A password reset link has been sent to the email address you
                  provided.
                </CardDescription>
              </CardHeader>
              <CardFooter>
                <Button
                  className="w-full"
                  onClick={() => setAuthView("sign-in")}
                >
                  Back to Sign In
                </Button>
              </CardFooter>
            </Card>
          )}
        </TabsContent>
        <TabsContent value="sign-up">
          <Card>
            <CardHeader>
              <CardTitle>Create Your Account</CardTitle>
              <CardDescription>
                It's quick, easy, and opens the door to a world of melody.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...signUpForm}>
                <form
                  onSubmit={signUpForm.handleSubmit(handleSignUp)}
                  className="space-y-4"
                >
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
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                              >
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
                              <Input
                                type="tel"
                                placeholder="9876543210"
                                {...field}
                              />
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
                          <Input
                            type="email"
                            placeholder="you@example.com"
                            {...field}
                          />
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
                        <div className="relative">
                          <FormControl>
                            <Input
                              type={showSignUpPassword ? "text" : "password"}
                              placeholder="••••••••"
                              {...field}
                            />
                          </FormControl>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute inset-y-0 right-0 h-full px-3"
                            onClick={() =>
                              setShowSignUpPassword(!showSignUpPassword)
                            }
                          >
                            {showSignUpPassword ? <EyeOff /> : <Eye />}
                            <span className="sr-only">
                              {showSignUpPassword
                                ? "Hide password"
                                : "Show password"}
                            </span>
                          </Button>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {error && (
                    <p className="text-sm font-medium text-destructive">
                      {error}
                    </p>
                  )}
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Creating Account..." : "Create Account"}
                  </Button>
                </form>
              </Form>
            </CardContent>
            <CardFooter className="text-sm text-center block">
              Already registered?{" "}
              <Button
                variant="link"
                type="button"
                className="p-0"
                onClick={() => {
                  setActiveTab("sign-in");
                  setAuthView("sign-in");
                }}
              >
                Sign in here
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
