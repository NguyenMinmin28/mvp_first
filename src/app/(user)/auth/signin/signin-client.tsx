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
import { Mail, Eye, EyeOff, LogIn } from "lucide-react";
import { toast } from "sonner";
import { Icons } from "@/features/shared/components/icons";
import { useSession } from "next-auth/react";

const signInSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Please enter your password"),
});

type SignInFormData = z.infer<typeof signInSchema>;

export default function SignInClient() {
  const { update, data: session, status } = useSession();
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
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
        // Check if user has saved form data
        const savedFormData = sessionStorage.getItem('guestProjectForm');
        if (savedFormData) {
          console.log("🔄 Fallback redirecting to /client-dashboard with saved form data");
        } else {
          console.log("🔄 Fallback redirecting to /client-dashboard");
        }
        window.location.href = "/client-dashboard";
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
    formState: { errors, isValid },
  } = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
    mode: "onChange",
  });

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
              // Check if user has saved form data
              const savedFormData = sessionStorage.getItem('guestProjectForm');
              if (savedFormData) {
                console.log("🔄 Redirecting to /client-dashboard with saved form data");
              } else {
                console.log("🔄 Redirecting to /client-dashboard");
              }
              window.location.href = "/client-dashboard";
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
    setIsLoading(true);
    setServerError(null); // Reset error state

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
        setIsLoading(false);
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
              // Check if user has saved form data
              const savedFormData = sessionStorage.getItem('guestProjectForm');
              if (savedFormData) {
                console.log("🔄 Redirecting to /client-dashboard with saved form data");
              } else {
                console.log("🔄 Redirecting to /client-dashboard");
              }
              window.location.href = "/client-dashboard";
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
            // If no role or role is null, redirect to role selection
            console.log("🔄 No role found, redirecting to /role-selection");
            window.location.href = "/role-selection";
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
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      {/* Top Navigation */}
      <nav className="absolute top-0 left-0 right-0 z-10 py-6 px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <img 
              src="/images/home/clervelogoblack.png" 
              alt="Clevrs" 
              className="h-10 w-auto transition-transform duration-300 group-hover:scale-105"
            />
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/help" className="text-sm text-gray-600 hover:text-black transition-colors">
              Help Center
            </Link>
            <Link href="/pricing" className="text-sm text-gray-600 hover:text-black transition-colors">
              Pricing
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content - Two Column Layout */}
      <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 pt-20 pb-12">
        <div className="max-w-7xl w-full mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            
            {/* Left Column - Branding & Features */}
            <div className="hidden lg:block space-y-8 animate-fade-in-bottom">
              <div>
                <h1 className="text-5xl font-extrabold text-gray-900 mb-4 leading-tight">
                  Welcome back to
                  <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                    Clevrs
                  </span>
                </h1>
                <p className="text-xl text-gray-600 leading-relaxed">
                  Connect with talented freelancers or find your next project. Zero commission, direct collaboration.
                </p>
              </div>

              {/* Trust Indicators */}
              <div className="space-y-6">
                <div className="flex items-start gap-4 group">
                  <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Secure & Trusted</h3>
                    <p className="text-gray-600 text-sm">Bank-level security to protect your data and transactions</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 group">
                  <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Lightning Fast</h3>
                    <p className="text-gray-600 text-sm">Get matched with perfect freelancers in minutes, not days</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 group">
                  <div className="flex-shrink-0 w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">0% Commission</h3>
                    <p className="text-gray-600 text-sm">Keep 100% of your earnings. No hidden fees ever.</p>
                  </div>
                </div>
              </div>

              {/* Testimonial */}
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                <div className="flex items-center gap-1 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-gray-700 mb-4 italic">"Clevrs transformed how I find projects. Direct contact with clients means better rates and relationships!"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                    SK
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Sarah Kim</p>
                    <p className="text-sm text-gray-500">Full-stack Developer</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Sign In Form */}
            <div className="w-full max-w-md mx-auto lg:mx-0">
              <div className="bg-white rounded-2xl shadow-2xl p-8 sm:p-10 border border-gray-100 animate-scale-up">
                {/* Mobile Logo */}
                <div className="lg:hidden mb-6 text-center">
                  <img 
                    src="/images/home/clervelogoblack.png" 
                    alt="Clevrs" 
                    className="h-10 w-auto mx-auto mb-4"
                  />
                </div>

                {/* Header */}
                <div className="mb-8">
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">Sign in</h2>
                  <p className="text-gray-600">Welcome back! Please enter your details.</p>
            </div>

            {/* Server Error Display */}
            {serverError && (
                  <div className="mb-6">
                <ErrorDisplay error={serverError} onDismiss={() => setServerError(null)} />
              </div>
            )}

                {/* Form */}
                <form onSubmit={handleSubmit(handleEmailSignIn)} className="space-y-5">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      Email address
                    </label>
              <Input
                id="email"
                type="email"
                      placeholder="name@example.com"
                {...register("email")}
                      className={`h-12 ${errors.email ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"} transition-all duration-300`}
                    />
                    {errors.email && (
                      <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                      Password
                    </label>
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                {...register("password")}
                      className={`h-12 ${errors.password ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"} transition-all duration-300`}
              />
                    {errors.password && (
                      <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                    )}
            </div>

            <Button
                    type="submit"
              disabled={!isValid || isLoading}
                    className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        Signing in...
                      </div>
                    ) : (
                      "Sign in"
                    )}
            </Button>
                </form>

            {/* Divider */}
            <div className="flex items-center my-6">
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
                  <span className="mx-4 text-sm text-gray-500 font-medium">OR</span>
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
            </div>

                {/* Google Sign In */}
            <Button
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              variant="outline"
                  className="w-full h-12 border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-all duration-300 transform hover:scale-105"
            >
              {mounted ? (
                    <Icons.google className="w-5 h-5 mr-3" />
                  ) : (
                    <div className="w-5 h-5 mr-3 bg-current rounded" />
                  )}
                  <span className="font-semibold text-gray-700">Continue with Google</span>
                </Button>

                {/* Sign Up Link */}
                <div className="mt-8 text-center">
                  <p className="text-gray-600">
                    Don't have an account?{" "}
                    <Link href="/auth/signup" className="font-semibold text-blue-600 hover:text-blue-700 transition-colors">
                      Sign up for free
              </Link>
                  </p>
                </div>

                {/* Security Badge */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <span>Your data is protected with 256-bit encryption</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-black text-white mt-16">
        <div className="container mx-auto px-4 sm:px-6 py-12">
          <div className="mb-10">
            <img 
              src="/images/home/clervelogo.png" 
              alt="Clevrs" 
              className="h-8 w-auto mb-2"
            />
            <a href="/help" className="mt-2 inline-block underline text-sm text-gray-300">Visit Help Center</a>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-8 text-gray-300">
            <div>
              <h4 className="font-semibold text-white mb-3">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:underline">About us</a></li>
                <li><a href="#" className="hover:underline">Our offerings</a></li>
                <li><a href="#" className="hover:underline">Newsroom</a></li>
                <li><a href="#" className="hover:underline">Investors</a></li>
                <li><a href="#" className="hover:underline">Careers</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-3">Products</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:underline">Client</a></li>
                <li><a href="#" className="hover:underline">Freelancer</a></li>
                <li><a href="#" className="hover:underline">Pricing</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-3">Global citizenship</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:underline">Safety</a></li>
                <li><a href="#" className="hover:underline">Sustainability</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-3">Travel</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:underline">Reserve</a></li>
                <li><a href="#" className="hover:underline">Airports</a></li>
                <li><a href="#" className="hover:underline">Cities</a></li>
              </ul>
            </div>
          </div>

          <div className="mt-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-gray-400 text-sm">
            <div className="flex items-center gap-6 text-white">
              {/* Facebook */}
              <a href="#" aria-label="Facebook" className="hover:opacity-80 transition-opacity">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
              
              {/* X (Twitter) */}
              <a href="#" aria-label="X" className="hover:opacity-80 transition-opacity">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
              
              {/* YouTube */}
              <a href="#" aria-label="YouTube" className="hover:opacity-80 transition-opacity">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </a>
              
              {/* LinkedIn */}
              <a href="#" aria-label="LinkedIn" className="hover:opacity-80 transition-opacity">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </a>
              
              {/* Instagram */}
              <a href="#" aria-label="Instagram" className="hover:opacity-80 transition-opacity">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 6.62 5.367 11.987 11.988 11.987 6.62 0 11.987-5.367 11.987-11.987C24.014 5.367 18.637.001 12.017.001zM8.449 16.988c-1.297 0-2.448-.49-3.323-1.297C4.198 14.895 3.708 13.744 3.708 12.447s.49-2.448 1.418-3.323c.875-.807 2.026-1.297 3.323-1.297s2.448.49 3.323 1.297c.928.875 1.418 2.026 1.418 3.323s-.49 2.448-1.418 3.244c-.875.807-2.026 1.297-3.323 1.297zm7.83-9.781c-.49 0-.928-.175-1.297-.49-.368-.315-.49-.753-.49-1.243 0-.49.122-.928.49-1.243.369-.315.807-.49 1.297-.49s.928.175 1.297.49c.368.315.49.753.49 1.243 0 .49-.122.928-.49 1.243-.369.315-.807.49-1.297.49z"/>
                </svg>
              </a>
            </div>
          </div>
          
          {/* Bottom Section - Apps, Copyright, and Legal Links */}
          <div className="mt-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            {/* Left Side - Apps and Copyright */}
            <div className="flex flex-col gap-4">
              {/* Apps Section */}
              <div className="flex justify-start">
                <a href="#" className="inline-block">
                  <img 
                    src="/images/home/picgoapp.png" 
                    alt="Download on Google Play and App Store" 
                    className="h-12 w-auto"
                  />
                </a>
              </div>
              
              {/* Copyright - Bottom Left */}
              <p className="text-gray-400 text-sm">© 2025 Clevrs</p>
            </div>

            {/* Right Side - Privacy, Accessibility, Terms */}
            <div className="flex items-center gap-6 text-sm">
              <a href="#" className="hover:underline text-gray-400">Privacy</a>
              <a href="#" className="hover:underline text-gray-400">Accessibility</a>
              <a href="#" className="hover:underline text-gray-400">Terms</a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
