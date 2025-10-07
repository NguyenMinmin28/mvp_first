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
import { Button } from "@/ui/components/button";
import { Input } from "@/ui/components/input";

import { ErrorDisplay, FieldError } from "@/ui/components/error-display";
import { Mail } from "lucide-react";
import { useFormSubmit } from "@/core/hooks/use-api";
import SendVerificationEmail from "@/features/auth/components/send-verification-email";
import VerifyOTP from "@/features/auth/components/verify-otp";
import { cn } from "@/core/utils/utils";

const signUpSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type SignUpFormData = z.infer<typeof signUpSchema>;

export default function SignUpClient() {
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<
    "signup" | "send-verification" | "verify-otp"
  >("signup");
  const [userEmail, setUserEmail] = useState<string>("");
  const [userPassword, setUserPassword] = useState<string>("");

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
      setSuccessMessage(
        "Signup successful! Please use this account to login to the system."
      );

      console.log("🎉 Signup successful, showing success message...");

      // Wait for message to show before redirecting
      setTimeout(() => {
        console.log("🔄 Redirecting after success message delay...");
        // Check if user has saved form data (from any session)
        const savedFormData = sessionStorage.getItem("guestProjectForm");
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

    // Store email and password for verification flow
    setUserEmail(formData.email);
    setUserPassword(formData.password);

    // Move to email verification step instead of directly creating account
    setCurrentStep("send-verification");
  };

  const handleVerificationCodeSent = () => {
    setCurrentStep("verify-otp");
  };

  const handleEmailVerified = async () => {
    // Now create the account after email verification
    const formData = {
      email: userEmail,
      password: userPassword,
      name: userEmail.split("@")[0], // Use email prefix as name
    };
    await submit("/api/auth/signup", formData);
  };

  const handleBackToSignup = () => {
    setCurrentStep("signup");
    setUserEmail("");
    setUserPassword("");
  };

  const handleGoogleSignUp = async () => {
    setServerError(null); // Reset error state
    setSuccessMessage(null); // Reset success message

    try {
      // Check if user has saved form data (from any session)
      const savedFormData = sessionStorage.getItem("guestProjectForm");
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
        setSuccessMessage(
          "Signup successful! Please use this account to login to the system."
        );

        console.log("🎉 Google signup successful, showing success message...");

        // Wait for message to show before redirecting
        setTimeout(() => {
          console.log("🔄 Redirecting after Google success message delay...");
          // Check if user has saved form data (from any session)
          const savedFormData = sessionStorage.getItem("guestProjectForm");
          if (savedFormData) {
            console.log(
              "🔄 Redirecting to /role-selection with saved form data"
            );
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
    <main className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
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
            <Link href="/auth/signin" className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors">
              Sign in
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content - Two Column Layout */}
      <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 pt-20 pb-12">
        <div className="max-w-7xl w-full mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            
            {/* Left Column - Branding & Benefits */}
            <div className="hidden lg:block space-y-8 animate-fade-in-bottom">
              <div>
                <h1 className="text-5xl font-extrabold text-gray-900 mb-4 leading-tight">
                  Start your journey with
                  <span className="block text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
                    Clevrs
                  </span>
                </h1>
                <p className="text-xl text-gray-600 leading-relaxed">
                  Join thousands of freelancers and clients building the future of work together.
                </p>
              </div>

              {/* Benefits */}
              <div className="space-y-6">
                <div className="flex items-start gap-4 group">
                  <div className="flex-shrink-0 w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Free to Join</h3>
                    <p className="text-gray-600 text-sm">Create your account in seconds. No credit card required.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 group">
                  <div className="flex-shrink-0 w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-6 h-6 text-pink-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Join Global Community</h3>
                    <p className="text-gray-600 text-sm">Connect with professionals from around the world</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 group">
                  <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Verified & Safe</h3>
                    <p className="text-gray-600 text-sm">All accounts are verified for your safety and trust</p>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-6 pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900 mb-1">50K+</div>
                  <div className="text-sm text-gray-600">Active Users</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900 mb-1">100K+</div>
                  <div className="text-sm text-gray-600">Projects</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900 mb-1">4.9★</div>
                  <div className="text-sm text-gray-600">Rating</div>
                </div>
              </div>

              {/* Trust Badges */}
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                <p className="text-sm text-gray-600 mb-4">Trusted by leading companies worldwide</p>
                <div className="flex items-center gap-6 opacity-60">
                  <div className="text-2xl font-bold text-gray-800">PAYPAL</div>
                  <div className="text-2xl font-bold text-gray-800">STRIPE</div>
                  <div className="text-2xl font-bold text-gray-800">WISE</div>
                </div>
              </div>
            </div>

            {/* Right Column - Sign Up Form */}
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
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">
                    {currentStep === "signup"
                      ? "Create your account"
                      : currentStep === "send-verification"
                        ? "Verify your email"
                        : "Enter verification code"}
                  </h2>
                  <p className="text-gray-600">
                    {currentStep === "signup"
                      ? "Get started for free. No credit card needed."
                      : currentStep === "send-verification"
                        ? "We'll send a verification code to your email"
                        : "Enter the 6-digit code we sent to your email"}
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
                    <svg
                      className="h-5 w-5 text-green-400"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
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
                        <svg
                          className="h-3 w-3"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                            clipRule="evenodd"
                          />
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

          {/* Conditional rendering based on current step */}
          {currentStep === "signup" && (
            <>
              {/* Email + Password */}
              <form
                onSubmit={handleSubmit(handleEmailSignUp)}
                className="space-y-5"
              >
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email address
                  </label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    {...register("email")}
                    className={`h-12 ${errors.email ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:border-purple-500 focus:ring-purple-500"} transition-all duration-300`}
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
                    placeholder="Create a strong password (min. 6 characters)"
                    {...register("password")}
                    className={`h-12 ${errors.password ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:border-purple-500 focus:ring-purple-500"} transition-all duration-300`}
                  />
                  {errors.password && (
                    <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={!isValid || isLoading}
                  className="w-full h-12 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Creating account...
                    </div>
                  ) : (
                    "Create account"
                  )}
                </Button>
              </form>

              {/* Divider */}
              <div className="flex items-center my-6">
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
                <span className="mx-4 text-sm text-gray-500 font-medium">OR</span>
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
              </div>

              {/* Google Sign Up */}
              <Button
                onClick={handleGoogleSignUp}
                disabled={isLoading}
                variant="outline"
                className="w-full h-12 border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-all duration-300 transform hover:scale-105"
              >
                <span className="mr-3">
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
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
                </span>
                <span className="font-semibold text-gray-700">Continue with Google</span>
              </Button>

              {/* Sign In Link */}
              <div className="mt-8 text-center">
                <p className="text-gray-600">
                  Already have an account?{" "}
                  <Link href="/auth/signin" className="font-semibold text-purple-600 hover:text-purple-700 transition-colors">
                    Sign in
                  </Link>
                </p>
              </div>

              {/* Terms & Privacy */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-xs text-center text-gray-500">
                  By creating an account, you agree to our{" "}
                  <a href="#" className="underline hover:text-gray-700">Terms of Service</a>
                  {" "}and{" "}
                  <a href="#" className="underline hover:text-gray-700">Privacy Policy</a>
                </p>
              </div>
            </>
          )}

          {currentStep === "send-verification" && (
            <SendVerificationEmail
              email={userEmail}
              onCodeSent={handleVerificationCodeSent}
              onBack={handleBackToSignup}
            />
          )}

          {currentStep === "verify-otp" && (
            <VerifyOTP
              email={userEmail}
              onVerified={handleEmailVerified}
              onBack={() => setCurrentStep("send-verification")}
            />
          )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
