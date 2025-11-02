"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/ui/components/dialog";
import { Button } from "@/ui/components/button";
import { LogIn, UserPlus, Sparkles, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface AuthRequiredModalProps {
  isOpen: boolean;
  onClose: () => void;
  action?: string; // e.g., "contact developers", "follow developers"
}

export function AuthRequiredModal({ isOpen, onClose, action = "continue" }: AuthRequiredModalProps) {
  const router = useRouter();

  const handleLogin = () => {
    const callbackUrl = typeof window !== "undefined" ? window.location.pathname + window.location.search : "/";
    router.push(`/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  };

  const handleSignup = () => {
    const callbackUrl = typeof window !== "undefined" ? window.location.pathname + window.location.search : "/";
    router.push(`/auth/signup?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  };

  const upgradeFeatures = [
    "Unlimited connects to contact developers",
    "Unlimited projects posting",
    "Priority support",
    "Advanced analytics dashboard",
    "Response time guarantee",
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white">
              <LogIn className="h-6 w-6" />
            </div>
            <DialogTitle className="text-2xl">Sign in to {action}</DialogTitle>
          </div>
          <DialogDescription className="text-base">
            Create a free account or sign in to connect with talented developers and access all features.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-6 space-y-6">
          {/* Auth Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Button
              onClick={handleLogin}
              className="h-12 text-base font-semibold"
              variant="default"
            >
              <LogIn className="w-5 h-5 mr-2" />
              Sign In
            </Button>
            <Button
              onClick={handleSignup}
              className="h-12 text-base font-semibold"
              variant="outline"
            >
              <UserPlus className="w-5 h-5 mr-2" />
              Create Account
            </Button>
          </div>

          {/* Upgrade Info Section */}
          <div className="border-t pt-6">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-yellow-500" />
              <h3 className="text-lg font-semibold text-gray-900">
                Unlock Premium Features
              </h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Upgrade to Plus plan and get access to powerful features:
            </p>
            
            <div className="space-y-2 mb-4">
              {upgradeFeatures.map((feature, index) => (
                <div key={index} className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700">{feature}</span>
                </div>
              ))}
            </div>

            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 mb-4">
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-3xl font-bold text-gray-900">$19.95</span>
                <span className="text-gray-600">/month</span>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                Most popular plan for growing businesses
              </p>
              <Link href="/pricing">
                <Button
                  variant="outline"
                  className="w-full border-purple-300 text-purple-700 hover:bg-purple-100"
                  onClick={onClose}
                >
                  View Pricing Plans
                </Button>
              </Link>
            </div>
          </div>

          {/* Free Plan Info */}
          <div className="border-t pt-4">
            <p className="text-xs text-gray-500 text-center">
              Free plan includes 25 connects to get started. No credit card required.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
