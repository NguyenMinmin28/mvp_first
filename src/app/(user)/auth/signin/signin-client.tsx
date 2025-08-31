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
import { useAuthRedirect } from "@/core/hooks/use-auth-redirect";
import { useSession } from "next-auth/react";

const signInSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Please enter your password"),
});

type SignInFormData = z.infer<typeof signInSchema>;

export default function SignInClient() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();

  // Use auth redirect hook
  useAuthRedirect();

  // Xử lý error query parameter từ URL
  useEffect(() => {
    const error = searchParams.get("error");
    if (error) {
      if (error === "AccessDenied") {
        setServerError(
          "This Google account has not been registered. Please register first."
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
      
      // Fallback redirect logic for admin users
      if (result?.ok) {
        // Wait a bit for session to update
        setTimeout(() => {
          const currentSession = session;
          if (currentSession?.user?.role === "ADMIN") {
            console.log("🔍 Fallback redirect for admin user");
            router.replace("/admin");
          }
        }, 1000);
      }
      // Redirect will be handled by useAuthRedirect hook
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
      const result = await signIn("google", {
        redirect: false,
      });

      const googleError = (result as any)?.error as string | undefined;
      if (googleError) {
        if (googleError === "AccessDenied") {
          setServerError(
            "This Google account has not been registered. Please register first."
          );
        } else {
          setServerError("Google sign in failed. Please try again.");
        }
        setIsLoading(false);
        return;
      }
      
      // Fallback redirect logic for admin users
      if (result?.ok) {
        // Wait a bit for session to update
        setTimeout(() => {
          const currentSession = session;
          if (currentSession?.user?.role === "ADMIN") {
            console.log("🔍 Fallback redirect for admin user (Google)");
            router.replace("/admin");
          }
        }, 1000);
      }
      // Redirect will be handled by useAuthRedirect hook
    } catch (error) {
      console.error("Google sign in error:", error);
      setServerError("An error occurred during Google sign in");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-white">
      {/* Top black bar with LOGO */}
      <div className="w-full h-14 bg-black flex items-center">
        <div className="max-w-4xl mx-auto w-full px-4">
          <span className="text-white font-semibold tracking-wide">LOGO</span>
        </div>
      </div>

      {/* Centered form */}
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex justify-center py-16">
          <div className="w-full max-w-md">
            {/* Header */}
            <div className="mb-6">
              <h1 className="text-3xl font-semibold text-gray-900">Sign in</h1>
            </div>

            {/* Server Error Display */}
            {serverError && (
              <div className="mb-4">
                <ErrorDisplay error={serverError} onDismiss={() => setServerError(null)} />
              </div>
            )}

            {/* Inputs */}
            <div className="space-y-3">
              <Input
                id="email"
                type="email"
                placeholder="Enter email"
                {...register("email")}
                className={`${errors.email ? "border-red-500" : ""} appearance-none !bg-white focus:!bg-white text-black placeholder-gray-400 border-0 focus-visible:ring-2 focus:ring-2 focus-visible:ring-black focus-visible:ring-offset-0 transition-shadow focus:shadow-md caret-black`}
                style={{ WebkitBoxShadow: "0 0 0 1000px white inset", boxShadow: "0 0 0 1000px white inset", WebkitTextFillColor: "#000" }}
              />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter password"
                {...register("password")}
                className={`${errors.password ? "border-red-500" : ""} appearance-none !bg-white focus:!bg-white text-black placeholder-gray-400 border-0 focus-visible:ring-2 focus:ring-2 focus-visible:ring-black focus-visible:ring-offset-0 transition-shadow focus:shadow-md caret-black`}
                style={{ WebkitBoxShadow: "0 0 0 1000px white inset", boxShadow: "0 0 0 1000px white inset", WebkitTextFillColor: "#000" }}
              />
            </div>

            {/* Continue button */}
            <Button
              type="button"
              onClick={handleSubmit(handleEmailSignIn)}
              disabled={!isValid || isLoading}
              className="w-full mt-4 bg-black text-white hover:bg-black/90 disabled:opacity-100"
            >
              {isLoading ? "Loading..." : "Continue"}
            </Button>

            {/* Divider */}
            <div className="flex items-center my-6">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="mx-4 text-xs text-gray-900">or</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            {/* Google button */}
            <Button
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              variant="outline"
              className="w-full bg-gray-100 hover:bg-gray-100 text-gray-800 border-0"
            >
              {mounted ? (
                <Icons.google className="w-4 h-4 mr-2" />
              ) : (
                <div className="w-4 h-4 mr-2 bg-current rounded" />
              )}
              Continue with Google
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
