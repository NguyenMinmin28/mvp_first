"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/ui/components/card";
import { Button } from "@/ui/components/button";
import { Input } from "@/ui/components/input";
import { Label } from "@/ui/components/label";

import { ErrorDisplay, FieldError } from "@/ui/components/error-display";
import { Mail, Eye, EyeOff, LogIn, HelpCircle } from "lucide-react";
import { toast } from "sonner";
import { Icons } from "@/features/shared/components/icons";
import { useSession } from "next-auth/react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/ui/components/tooltip";

const signInSchema = z.object({
  email: z
    .string()
    .min(1, "Please enter your email address")
    .refine((email) => email.includes("@"), {
      message: "Invalid email address",
    })
    .email("Invalid email address"),
  password: z.string().min(1, "Please enter your password"),
});

type SignInFormData = z.infer<typeof signInSchema>;

export default function SignInClient() {
  const { update, data: session, status } = useSession();
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [hasFallbackRedirected, setHasFallbackRedirected] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Reset fallback redirect flag when user changes
  useEffect(() => {
    setHasFallbackRedirected(false);
  }, [session?.user?.id]);

  // Fallback redirect mechanism - detect when user is authenticated and redirect
  useEffect(() => {
    if (status === "authenticated" && session?.user && !hasFallbackRedirected) {
      console.log("🔄 Fallback redirect triggered - user authenticated:", session.user);
      
      const user = session.user;
      const userRole = user.role;
      const isProfileCompleted = user.isProfileCompleted;
      
      console.log("🎯 Fallback - User role:", userRole, "Profile completed:", isProfileCompleted);
      
      // Set flag to prevent multiple redirects
      setHasFallbackRedirected(true);
      
      // Use window.location.href to force a hard redirect and prevent loops
      if (userRole === "ADMIN") {
        console.log("🔄 Fallback redirecting to /admin");
        window.location.href = "/admin";
      } else if (userRole === "CLIENT") {
        // Check if user has subscription - redirect to pricing if not, dashboard if yes
        fetch("/api/user/subscriptions", { cache: "no-store" })
          .then((subRes) => {
            if (subRes.ok) {
              return subRes.json();
            } else {
              throw new Error("Subscription check failed");
            }
          })
          .then((subData) => {
            const hasSubscription = subData.subscriptions && subData.subscriptions.length > 0;
            if (hasSubscription) {
              console.log("🔄 Fallback redirecting CLIENT to /client-dashboard (has subscription)");
              window.location.href = "/client-dashboard";
            } else {
              console.log("🔄 Fallback redirecting CLIENT to /pricing (no subscription)");
              window.location.href = "/pricing";
            }
          })
          .catch((error) => {
            console.error("Error checking subscription:", error);
            console.log("🔄 Fallback redirecting CLIENT to /pricing (error)");
            window.location.href = "/pricing";
          });
      } else if (userRole === "DEVELOPER") {
        if (isProfileCompleted) {
          console.log("🔄 Fallback redirecting to /dashboard-user");
          window.location.href = "/dashboard-user";
        } else {
          console.log("🔄 Fallback redirecting to /onboarding/freelancer/basic-information");
          window.location.href = "/onboarding/freelancer/basic-information";
        }
      } else {
        console.log("🔄 Fallback redirecting to /role-selection");
        window.location.href = "/role-selection";
      }
    }
  }, [status, session?.user?.id, hasFallbackRedirected]);

  const searchParams = useSearchParams();

  // Note: We handle redirect manually after sign-in to avoid loops

  // Xử lý error query parameter từ URL
  useEffect(() => {
    const error = searchParams.get("error");
    if (error) {
      if (error === "AccessDenied") {
        setServerError(
          "This Google account has not been registered. Please register first."
        );
      } else if (error === "OAuthAccountNotLinked") {
        setServerError(
          "This email is already registered with another sign-in method. Please sign in with email and password, then connect Google in your account settings."
        );
      } else if (error === "Configuration") {
        setServerError(
          "Authentication configuration error. Please contact admin."
        );
      } else if (error === "Verification") {
        setServerError("Account not verified. Please check your email.");
      } else {
        setServerError(
          "An error occurred during authentication. Please try again."
        );
      }
    }
  }, [searchParams]);

  const {
    register,
    handleSubmit,
    watch,
    clearErrors,
    formState: { errors, isValid },
  } = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
    mode: "onChange",
  });

  const emailValue = watch("email");
  const passwordValue = watch("password");

  // Clear errors when user starts typing
  useEffect(() => {
    if (emailValue && errors.email) {
      clearErrors("email");
    }
  }, [emailValue, errors.email, clearErrors]);

  useEffect(() => {
    if (passwordValue && errors.password) {
      clearErrors("password");
    }
  }, [passwordValue, errors.password, clearErrors]);

  const handleEmailSignIn = async (data: SignInFormData) => {
    setIsLoading(true);
    setServerError(null);

    try {
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });
      const credError = (result as any)?.error as string | undefined;
      if (credError) {
        setServerError("Invalid email or password");
        return;
      }
      
      // Decide redirect after session is ready
      if (result?.ok) {
        // Small delay for session to persist
        setTimeout(async () => {
          try {
            const res = await fetch("/api/user/me", { cache: "no-store" });
            const { user } = await res.json();
            if (user?.role === "ADMIN") {
              window.location.href = "/admin";
              return;
            }
            if (user?.role === "CLIENT") {
              // Check if user has subscription - redirect to pricing if not, dashboard if yes
              try {
                const subRes = await fetch("/api/user/subscriptions", { cache: "no-store" });
                if (subRes.ok) {
                  const subData = await subRes.json();
                  const hasSubscription = subData.subscriptions && subData.subscriptions.length > 0;
                  if (hasSubscription) {
                    console.log("🔄 Redirecting CLIENT to /client-dashboard (has subscription)");
                    window.location.href = "/client-dashboard";
                  } else {
                    console.log("🔄 Redirecting CLIENT to /pricing (no subscription)");
                    window.location.href = "/pricing";
                  }
                } else {
                  console.log("🔄 Redirecting CLIENT to /pricing (subscription check failed)");
                  window.location.href = "/pricing";
                }
              } catch (error) {
                console.error("Error checking subscription:", error);
                console.log("🔄 Redirecting CLIENT to /pricing (error)");
                window.location.href = "/pricing";
              }
              return;
            }
            if (user?.role === "DEVELOPER") {
              if (!user?.isProfileCompleted) {
                window.location.href = "/onboarding/freelancer/basic-information";
              } else if (user?.adminApprovalStatus === "approved") {
                window.location.href = "/dashboard-user";
              } else {
                // Pending, draft, or rejected - go to pending page
                window.location.href = "/onboarding/freelancer/pending-approval";
              }
              return;
            }
            // Default - no role or role is null/undefined
            window.location.href = "/role-selection";
          } catch {
            window.location.href = "/";
          }
        }, 400);
      }
    } catch (error) {
      console.error("Sign in error:", error);
      setServerError("An error occurred during sign in");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setServerError(null);

    try {
      console.log("🔄 Starting Google sign in...");
      const result = await signIn("google", {
        redirect: false,
      });
      
      console.log("🔄 Google sign in result:", result);

      const googleError = (result as any)?.error as string | undefined;
      if (googleError) {
        if (googleError === "AccessDenied") {
          setServerError(
            "Google sign in was cancelled or failed. Please try again."
          );
        } else {
          setServerError("Google sign in failed. Please try again.");
        }
        setIsGoogleLoading(false);
        return;
      }
      
      if (result?.ok) {
        console.log("✅ Google sign in successful, refreshing session...");
        // Force refresh session to get updated user data
        await update();
        console.log("✅ Session refreshed");
        
        setTimeout(async () => {
          try {
            console.log("🔄 Fetching user data from /api/user/me...");
            const res = await fetch("/api/user/me", { cache: "no-store" });
            
            if (!res.ok) {
              console.error("❌ API /api/user/me failed:", res.status, res.statusText);
              throw new Error(`API call failed: ${res.status}`);
            }
            
            const data = await res.json();
            console.log("✅ API response:", data);
            
            const user = data.user;
            console.log("👤 User data after Google signin:", user);
            
            if (!user) {
              console.error("❌ No user data in response");
              window.location.href = "/";
              return;
            }
            
            console.log("🎯 User role:", user.role, "Profile completed:", user.isProfileCompleted);
            
            if (user?.role === "ADMIN") {
              console.log("🔄 Redirecting to /admin");
              window.location.href = "/admin";
              return;
            }
            if (user?.role === "CLIENT") {
              // Check if user has subscription - redirect to pricing if not, dashboard if yes
              try {
                const subRes = await fetch("/api/user/subscriptions", { cache: "no-store" });
                if (subRes.ok) {
                  const subData = await subRes.json();
                  const hasSubscription = subData.subscriptions && subData.subscriptions.length > 0;
                  if (hasSubscription) {
                    console.log("🔄 Redirecting CLIENT to /client-dashboard (has subscription)");
                    window.location.href = "/client-dashboard";
                  } else {
                    console.log("🔄 Redirecting CLIENT to /pricing (no subscription)");
                    window.location.href = "/pricing";
                  }
                } else {
                  console.log("🔄 Redirecting CLIENT to /pricing (subscription check failed)");
                  window.location.href = "/pricing";
                }
              } catch (error) {
                console.error("Error checking subscription:", error);
                console.log("🔄 Redirecting CLIENT to /pricing (error)");
                window.location.href = "/pricing";
              }
              return;
            }
            if (user?.role === "DEVELOPER") {
              if (user?.isProfileCompleted) {
                console.log("🔄 Redirecting to /dashboard-user (profile completed)");
                window.location.href = "/dashboard-user";
              } else {
                console.log("🔄 Redirecting to /onboarding/freelancer/basic-information (profile not completed)");
                window.location.href = "/onboarding/freelancer/basic-information";
              }
              return;
            }
            // If no role or role is null, redirect to signup flow
            console.log("🔄 No role found, redirecting to /auth/signup");
            window.location.href = "/auth/signup";
          } catch (error) {
            console.error("❌ Error fetching user data after Google signin:", error);
            console.log("🔄 Fallback redirect to /");
            window.location.href = "/";
          }
        }, 1000); // Increased timeout to allow session update
      }
    } catch (error) {
      console.error("Google sign in error:", error);
      setServerError("An error occurred during Google sign in");
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="bg-white">
      {/* Centered form */}
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex justify-center py-16">
          <div className="w-full max-w-md">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-semibold text-gray-900 mb-2">Sign in</h1>
              <p className="text-sm text-gray-600">Welcome back! Please enter your details.</p>
            </div>

            {/* Server Error Display */}
            {serverError && (
              <div className="mb-6">
                <ErrorDisplay error={serverError} onDismiss={() => setServerError(null)} />
              </div>
            )}

            {/* Form */}
            <TooltipProvider>
              <form onSubmit={handleSubmit(handleEmailSignIn)} className="space-y-4">
                {/* Email Input */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <label htmlFor="email" className="text-sm font-medium text-gray-700">
                      Email
                    </label>
                    <Tooltip delayDuration={200}>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          tabIndex={-1}
                          className="text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
                          aria-label="Email help"
                        >
                          <HelpCircle className="w-4 h-4" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="max-w-xs bg-gray-900 text-white p-3">
                        <p className="text-sm">
                          Enter the email address you used to create your account. 
                          <br />
                          <span className="text-gray-300">Example: name@example.com</span>
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email address"
                    autoFocus
                    autoComplete="email"
                    tabIndex={1}
                    {...register("email")}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !errors.email && !errors.password && isValid) {
                        e.preventDefault();
                        handleSubmit(handleEmailSignIn)();
                      }
                    }}
                    className={`h-12 ${errors.email ? "border-red-500 focus:border-red-500 focus:ring-red-200" : "border-gray-300 focus:border-black focus:ring-black/20"} transition-all hover:border-gray-400`}
                  />
                  <FieldError error={errors.email?.message} />
                </div>

                {/* Password Input */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <label htmlFor="password" className="text-sm font-medium text-gray-700">
                        Password
                      </label>
                      <Tooltip delayDuration={200}>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            className="text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
                            aria-label="Password help"
                          >
                            <HelpCircle className="w-4 h-4" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="max-w-xs bg-gray-900 text-white p-3">
                          <p className="text-sm">
                            Enter the password you created when you signed up. 
                            <br />
                            <span className="text-gray-300">Click the eye icon to show/hide your password.</span>
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Link 
                      href="/auth/forgot-password" 
                      className="text-sm text-gray-600 hover:text-black transition-colors"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    tabIndex={2}
                    {...register("password")}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !errors.email && !errors.password && isValid) {
                        e.preventDefault();
                        handleSubmit(handleEmailSignIn)();
                      }
                    }}
                    className={`h-12 pr-12 ${errors.password ? "border-red-500 focus:border-red-500 focus:ring-red-200" : "border-gray-300 focus:border-black focus:ring-black/20"} transition-all hover:border-gray-400`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
                <FieldError error={errors.password?.message} />
              </div>

              {/* Continue button */}
              <Button
                type="submit"
                disabled={isLoading}
                tabIndex={3}
                className="w-full h-12 mt-6 bg-black text-white hover:bg-black/90 active:scale-[0.98] active:bg-black/95 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150 cursor-pointer"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Signing in...
                  </span>
                ) : (
                  "Continue"
                )}
              </Button>
            </form>
            </TooltipProvider>

            {/* Divider */}
            <div className="flex items-center my-6">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="mx-4 text-xs text-gray-900">or</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            {/* Google button */}
            <Button
              onClick={handleGoogleSignIn}
              disabled={isLoading || isGoogleLoading}
              variant="outline"
              type="button"
              className="w-full h-12 bg-white hover:bg-gray-50 active:scale-[0.98] active:bg-gray-100 text-gray-900 border border-gray-300 rounded-full shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150 cursor-pointer"
            >
              {mounted ? (
                <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
              ) : (
                <div className="w-5 h-5 mr-3 bg-current rounded" />
              )}
              <span className="font-medium">
                {isGoogleLoading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Connecting...
                  </span>
                ) : (
                  "Continue with Google"
                )}
              </span>
            </Button>

            {/* Sign up section */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600 mb-3">
                Don't have an account?
              </p>
              <Link href="/auth/signup">
                <Button
                  variant="outline"
                  className="w-full border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Create Account
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
