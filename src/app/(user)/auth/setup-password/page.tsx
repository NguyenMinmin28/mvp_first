"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/ui/components/button";
import { Input } from "@/ui/components/input";
import { Label } from "@/ui/components/label";
import { toast } from "sonner";
import { Eye, EyeOff, Lock, ArrowRight } from "lucide-react";
import { LoadingSpinner } from "@/ui/components/loading-spinner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/ui/components/card";

export default function SetupPasswordPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkPasswordStatus = async () => {
      if (status === "loading") return;

      if (!session?.user) {
        router.push("/auth/signin");
        return;
      }

      try {
        // Check if user already has a password
        const res = await fetch("/api/user/me", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          if (data.user?.hasPassword) {
            // User already has password, redirect to appropriate page
            toast.info("You already have a password set");
            const savedFormData = sessionStorage.getItem("guestProjectForm");
            if (savedFormData) {
              router.push("/role-selection");
            } else {
              router.push("/");
            }
            return;
          }
        }
      } catch (error) {
        console.error("Error checking password status:", error);
      } finally {
        setIsChecking(false);
      }
    };

    checkPasswordStatus();
  }, [session, status, router]);

  const handleSetupPassword = async () => {
    // Validate password
    if (!password) {
      toast.error("Please enter a password");
      return;
    }

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/user/add-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Password added successfully!");
        // Redirect based on saved form data or role selection
        setTimeout(() => {
          const savedFormData = sessionStorage.getItem("guestProjectForm");
          if (savedFormData) {
            localStorage.setItem("pendingRole", "CLIENT");
            router.push("/role-selection");
          } else {
            router.push("/role-selection");
          }
        }, 1000);
      } else {
        toast.error(data.error || "Failed to add password");
      }
    } catch (error) {
      console.error("Error setting up password:", error);
      toast.error("An error occurred while adding password");
    } finally {
      setIsLoading(false);
    }
  };

  if (status === "loading" || isChecking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Checking...</p>
        </div>
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
            <Lock className="h-6 w-6 text-blue-600" />
          </div>
          <CardTitle className="text-2xl">Set up password</CardTitle>
          <CardDescription>
            Welcome {session.user.email}! Please create a password to complete your registration.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">New Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter a password (min. 8 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && password && confirmPassword && password.length >= 8 && password === confirmPassword) {
                    e.preventDefault();
                    handleSetupPassword();
                  }
                }}
                className="pr-10"
                autoFocus
                tabIndex={1}
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
            <p className="text-xs text-gray-500">
              Password must be at least 8 characters long
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && password && confirmPassword && password.length >= 8 && password === confirmPassword) {
                    e.preventDefault();
                    handleSetupPassword();
                  }
                }}
                className="pr-10"
                tabIndex={2}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                tabIndex={-1}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              >
                {showConfirmPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          <Button
            onClick={handleSetupPassword}
            disabled={isLoading || !password || !confirmPassword}
            tabIndex={3}
            className="w-full"
            size="lg"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <LoadingSpinner size="sm" />
                Saving...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                Complete Sign Up
                <ArrowRight className="h-4 w-4" />
              </span>
            )}
          </Button>

          <p className="text-xs text-center text-gray-500">
            After setting up your password, you can sign in with your email and password
            or continue using Google.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

