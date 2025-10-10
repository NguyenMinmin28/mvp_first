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
        <div className="flex flex-col max-w-md mx-auto justify-center py-16">
          <div className="w-full max-w-sm mx-auto">
            {/* Header */}
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-1">
                {currentStep === "signup"
                  ? "Create account"
                  : currentStep === "send-verification"
                    ? "Verify your email"
                    : "Enter verification code"}
              </h1>
              <p className="text-sm text-gray-600">
                {currentStep === "signup"
                  ? "Join the freelancer community today"
                  : currentStep === "send-verification"
                    ? "We'll send a verification code to your email"
                    : "Enter the 6-digit code we sent to your email"}
              </p>
            </div>
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
                className="space-y-4"
              >
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter email"
                  {...register("email")}
                  className={cn("h-12", errors.email ? "border-red-500" : "")}
                />
                <FieldError error={errors.email?.message} />

                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter password"
                  {...register("password")}
                  className={cn(
                    "h-12",
                    errors.password ? "border-red-500" : ""
                  )}
                />
                <FieldError error={errors.password?.message} />

                <Button
                  type="submit"
                  disabled={!isValid || isLoading}
                  className="w-full bg-black text-white hover:bg-black/90 h-12"
                >
                  {isLoading ? "Continue" : "Continue"}
                </Button>
              </form>

              {/* Divider */}
              <div className="flex items-center my-6">
                <span className="flex-1 h-px bg-gray-300" />
                <span className="px-4 text-gray-400">or</span>
                <span className="flex-1 h-px bg-gray-300" />
              </div>

              {/* Google */}
              <Button
                onClick={handleGoogleSignUp}
                disabled={isLoading}
                variant="outline"
                className="w-full h-12 bg-gray-100 hover:bg-gray-100 text-gray-900 border-0"
              >
                <span className="mr-2">
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
                Continue with Google
              </Button>

              {/* Bottom call-to-action */}
              <Link href="/auth/signin" className="block mt-10">
                <Button className="w-full bg-black text-white hover:bg-black/90">
                  Already have an account? Log in here
                </Button>
              </Link>
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
    </main>
  );
}
