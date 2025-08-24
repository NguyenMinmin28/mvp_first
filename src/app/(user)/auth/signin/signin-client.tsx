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
import { ModeToggle } from "@/features/shared/components/mode-toggle";
import { ErrorDisplay, FieldError } from "@/ui/components/error-display";
import { Mail, Eye, EyeOff, LogIn } from "lucide-react";
import { toast } from "sonner";

const signInSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Please enter your password"),
});

type SignInFormData = z.infer<typeof signInSchema>;

export default function SignInClient() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const router = useRouter();
  const searchParams = useSearchParams();

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

      if (result?.error) {
        setServerError("Invalid email or password");
        return;
      }

      toast.success("Sign in successful!");
      router.push("/");
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
        callbackUrl: "/",
      });

      if (result?.error) {
        if (result.error === "AccessDenied") {
          setServerError(
            "This Google account has not been registered. Please register first."
          );
        } else {
          setServerError("Google sign in failed. Please try again.");
        }
        setIsLoading(false);
        return;
      }

      if (result?.ok) {
        setServerError(null); // Clear any existing errors
        router.push("/");
      }
    } catch (error) {
      console.error("Google sign in error:", error);
      setServerError("An error occurred during Google sign in");
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
            Welcome back
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Sign in to your account
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
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  You need to register an account before signing in
                </p>
                <Link
                  href="/auth/signup"
                  className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400"
                >
                  Go to Sign Up →
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Google Sign In Button */}
        <Button
          onClick={handleGoogleSignIn}
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
            <span className="w-full border-t border-gray-300 dark:border-gray-600" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 px-2 text-gray-500 dark:text-gray-400">
              Or continue with email
            </span>
          </div>
        </div>

        {/* Email Sign In Form */}
        <Card className="border-0 shadow-none bg-transparent">
          <CardContent className="p-0">
            <form
              onSubmit={handleSubmit(handleEmailSignIn)}
              className="space-y-3"
            >
              {/* Email */}
              <div className="space-y-1">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email
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
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
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

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={!isValid || isLoading}
                className="w-full mt-4"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Signing in...
                  </>
                ) : (
                  <>
                    <LogIn className="mr-2 h-4 w-4" />
                    Sign in
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Sign Up Link */}
        <div className="text-center mt-6">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Don&apos;t have an account?{" "}
            <Link
              href="/auth/signup"
              className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400"
            >
              Sign up now
            </Link>
          </p>
        </div>

        {/* Mode Toggle */}
        <div className="absolute top-4 right-4">
          <ModeToggle />
        </div>
      </div>
    </main>
  );
}
