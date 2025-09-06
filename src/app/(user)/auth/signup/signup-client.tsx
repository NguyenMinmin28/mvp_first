"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { useEffect } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/ui/components/select";
import { Badge } from "@/ui/components/badge";

import { ErrorDisplay, FieldError } from "@/ui/components/error-display";
import { Mail, Eye, EyeOff, UserPlus } from "lucide-react";
import { useFormSubmit } from "@/core/hooks/use-api";

const signUpSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type SignUpFormData = z.infer<typeof signUpSchema>;

export default function SignUpClient() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const router = useRouter();


  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    mode: "onChange",
  });

  const {
    submit,
    error: formError,
    isLoading,
    reset,
  } = useFormSubmit({
    onSuccess: async (data: any) => {
      setServerError(null); // Clear any existing errors
      setSuccessMessage("Signup successful! Please use this account to login to the system.");
      
      console.log("🎉 Signup successful, showing success message...");
      
      // Wait for message to show before redirecting
      setTimeout(() => {
        console.log("🔄 Redirecting after success message delay...");
        // Check if user has saved form data (from any session)
        const savedFormData = sessionStorage.getItem('guestProjectForm');
        if (savedFormData) {
          // Store pending role as CLIENT since they want to post projects
          localStorage.setItem("pendingRole", "CLIENT");
          console.log("🔄 Redirecting to /role-selection with saved form data");
          router.push("/role-selection");
        } else {
          console.log("🔄 Redirecting to /auth/signin for login");
          router.push("/auth/signin");
        }
      }, 3000); // Wait 3 seconds for message to show
    },
    onError: (error) => {
      console.error("Sign up error:", error);
      setServerError(error);
    },
  });

  const handleEmailSignUp = async (formData: SignUpFormData) => {
    setServerError(null); // Reset error state
    setSuccessMessage(null); // Reset success message
    
    // Store password temporarily for sign in
    const dataWithPassword = { ...formData, password: formData.password };

    await submit("/api/auth/signup", dataWithPassword);
  };

  const handleGoogleSignUp = async () => {
    setServerError(null); // Reset error state
    setSuccessMessage(null); // Reset success message

    try {
      // Check if user has saved form data (from any session)
      const savedFormData = sessionStorage.getItem('guestProjectForm');
      if (savedFormData) {
        // Store pending role as CLIENT since they want to post projects
        localStorage.setItem("pendingRole", "CLIENT");
      }

      const result = await signIn("google", {
        redirect: false,
        callbackUrl: "/role-selection",
      });

      if (result?.error) {
        if (result.error === "AccessDenied") {
          setServerError(
            "This Google account has not been registered. Please register first."
          );
        } else {
          setServerError("Google sign up failed. Please try again.");
        }
        return;
      }

      if (result?.ok) {
        setServerError(null); // Clear any existing errors
        setSuccessMessage("Signup successful! Please use this account to login to the system.");
        
        console.log("🎉 Google signup successful, showing success message...");
        
        // Wait for message to show before redirecting
        setTimeout(() => {
          console.log("🔄 Redirecting after Google success message delay...");
          // Check if user has saved form data (from any session)
          const savedFormData = sessionStorage.getItem('guestProjectForm');
          if (savedFormData) {
            console.log("🔄 Redirecting to /role-selection with saved form data");
            router.push("/role-selection");
          } else {
            console.log("🔄 Redirecting to /auth/signin for login");
            router.push("/auth/signin");
          }
        }, 3000); // Wait 3 seconds for message to show
      }
    } catch (error) {
      console.error("Google sign up error:", error);
      setServerError("An error occurred during Google sign up");
    }
  };

  return (
    <main className="min-h-screen bg-white">
      {/* Top black bar with LOGO and Menu */}
      <div className="w-full h-14 bg-black flex items-center">
        <div className="max-w-4xl mx-auto w-full px-4 flex items-center justify-between">
          <img 
            src="/images/home/clervelogo.png" 
            alt="Clevrs" 
            className="h-6 w-auto"
          />
          {/* Navigation Menu */}
          <nav className="flex items-center space-x-6">
            <Link 
              href="/" 
              className="text-white hover:text-gray-300 transition-colors text-sm font-medium"
            >
              Home
            </Link>
            <Link 
              href="/about" 
              className="text-white hover:text-gray-300 transition-colors text-sm font-medium"
            >
              About
            </Link>
            <Link 
              href="/pricing" 
              className="text-white hover:text-gray-300 transition-colors text-sm font-medium"
            >
              Pricing
            </Link>
            <Link 
              href="/help" 
              className="text-white hover:text-gray-300 transition-colors text-sm font-medium"
            >
              Help
            </Link>
          </nav>
        </div>
      </div>

      {/* Centered form */}
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex justify-center py-16">
          <div className="w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            Create account
          </h1>
          <p className="text-sm text-gray-600">
            Join the freelancer community today
          </p>
        </div>

        {/* Server Error Display */}
        {serverError && (
          <div className="mb-4">
            <ErrorDisplay
              error={serverError}
              onDismiss={() => setServerError(null)}
            />
            {serverError.includes("has not been registered") && (
              <div className="mt-3 text-center">
                <p className="text-sm text-gray-600 mb-2">
                  You need to register an account before signing in
                </p>
                <Link
                  href="/auth/signin"
                  className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-500"
                >
                  Go to Sign In →
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Success Message Display */}
        {successMessage && (
          <div className="mb-4">
            <div className="bg-green-50 border border-green-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-800">
                    {successMessage}
                  </p>
                </div>
                <div className="ml-auto pl-3">
                  <div className="-mx-1.5 -my-1.5">
                    <button
                      type="button"
                      className="inline-flex bg-green-50 rounded-md p-1.5 text-green-500 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-green-50 focus:ring-green-600"
                      onClick={() => setSuccessMessage(null)}
                    >
                      <span className="sr-only">Dismiss</span>
                      <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Form Error Display */}
        {formError && (
          <div className="mb-4">
            <ErrorDisplay error={formError} onDismiss={() => reset()} />
          </div>
        )}

        {/* Google Sign Up Button */}
        <Button
          onClick={handleGoogleSignUp}
          disabled={isLoading}
          variant="outline"
          className="w-full mb-4"
        >
          <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Continue with Google
        </Button>

        {/* Divider */}
        <div className="relative mb-4">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-gradient-to-br from-blue-50 via-white to-indigo-50 px-2 text-gray-500">
              Or continue with email
            </span>
          </div>
        </div>

        {/* Email Sign Up Form */}
        <Card className="border-0 shadow-none bg-transparent">
          <CardContent className="p-0">
            <form
              onSubmit={handleSubmit(handleEmailSignUp)}
              className="space-y-3"
            >
              {/* Name */}
              <div className="space-y-1">
                <Label htmlFor="name" className="text-sm font-medium">
                  Full Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="e.g. John Doe"
                  {...register("name")}
                  className={errors.name ? "border-red-500" : ""}
                />
                <FieldError error={errors.name?.message} />
              </div>

              {/* Email */}
              <div className="space-y-1">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="email@example.com"
                  {...register("email")}
                  className={errors.email ? "border-red-500" : ""}
                />
                <FieldError error={errors.email?.message} />
              </div>

              {/* Password */}
              <div className="space-y-1">
                <Label htmlFor="password" className="text-sm font-medium">
                  Password <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Minimum 6 characters"
                    {...register("password")}
                    className={errors.password ? "border-red-500" : ""}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <FieldError error={errors.password?.message} />
              </div>

              {/* Confirm Password */}
              <div className="space-y-1">
                <Label
                  htmlFor="confirmPassword"
                  className="text-sm font-medium"
                >
                  Confirm Password <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Re-enter password"
                    {...register("confirmPassword")}
                    className={errors.confirmPassword ? "border-red-500" : ""}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <FieldError error={errors.confirmPassword?.message} />
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={!isValid || isLoading}
                className="w-full mt-4"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Creating account...
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Create Account
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Sign In Link */}
        <div className="text-center mt-6">
          <p className="text-sm text-gray-600">
            Already have an account?{" "}
            <Link
              href="/auth/signin"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              Sign in
            </Link>
          </p>
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
