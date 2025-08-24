"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
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
import { Mail, Eye, EyeOff, LogIn, Shield } from "lucide-react";
import { toast } from "sonner";

const adminLoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Please enter your password"),
});

type AdminLoginFormData = z.infer<typeof adminLoginSchema>;

export default function AdminLoginClient() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<AdminLoginFormData>({
    resolver: zodResolver(adminLoginSchema),
    mode: "onChange",
  });

  const handleAdminLogin = async (data: AdminLoginFormData) => {
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

      // Kiểm tra xem user có phải là admin không
      // Điều này sẽ được xử lý trong middleware hoặc API route
      toast.success("Admin login successful!");
      router.push("/admin");
    } catch (error) {
      console.error("Admin login error:", error);
      setServerError("An error occurred during admin login");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
            Admin Access
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Sign in to admin panel
          </p>
        </div>

        {/* Server Error Display */}
        {serverError && (
          <div className="mb-4">
            <ErrorDisplay
              error={serverError}
              onDismiss={() => setServerError(null)}
            />
          </div>
        )}

        {/* Admin Login Form */}
        <Card className="border-0 shadow-none bg-transparent">
          <CardContent className="p-0">
            <form
              onSubmit={handleSubmit(handleAdminLogin)}
              className="space-y-3"
            >
              {/* Email */}
              <div className="space-y-1">
                <Label htmlFor="email" className="text-sm font-medium">
                  Admin Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@example.com"
                  {...register("email")}
                  className={errors.email ? "border-red-500" : ""}
                />
                <FieldError error={errors.email?.message} />
              </div>

              {/* Password */}
              <div className="space-y-1">
                <Label htmlFor="password" className="text-sm font-medium">
                  Admin Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter admin password"
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
                className="w-full mt-4 bg-red-600 hover:bg-red-700"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Signing in...
                  </>
                ) : (
                  <>
                    <LogIn className="mr-2 h-4 w-4" />
                    Admin Sign In
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Admin Notice */}
        <div className="text-center mt-6">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-sm text-red-800 dark:text-red-200">
              <strong>Admin Access Only:</strong> This login is restricted to authorized administrators only.
            </p>
          </div>
        </div>

        {/* Mode Toggle */}
        <div className="absolute top-4 right-4">
          <ModeToggle />
        </div>
      </div>
    </main>
  );
}
