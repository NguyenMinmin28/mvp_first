"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { Button } from "@/ui/components/button";
import { Input } from "@/ui/components/input";
import { Loader2, MessageCircle, Smartphone } from "lucide-react";

interface WhatsAppSignInProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export function WhatsAppSignIn({ onSuccess, onError }: WhatsAppSignInProps) {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<"phone" | "verification">("phone");
  const [showDemoCode, setShowDemoCode] = useState(false);

  const handleSendCode = async () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      onError?.("Please enter a valid phone number");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/wa", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ phoneNumber }),
      });

      const data = await response.json();

      if (response.ok) {
        setStep("verification");

        // Show demo code in development mode or demo mode
        if (
          (data.development && data.demoCode) ||
          (data.demo && data.demoCode)
        ) {
          setShowDemoCode(true);
          setVerificationCode(data.demoCode);
        } else {
          setShowDemoCode(false);
          setVerificationCode("");
        }
      } else {
        onError?.(data.error || "Failed to send verification code");
      }
    } catch (error) {
      onError?.("Failed to send verification code. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      onError?.("Please enter a valid 6-digit verification code");
      return;
    }

    setIsLoading(true);

    try {
      const result = await signIn("whatsapp", {
        phoneNumber,
        verificationCode,
        redirect: false,
      });

      if (result?.error) {
        onError?.(result.error);
      } else {
        onSuccess?.();
      }
    } catch (error) {
      onError?.("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToPhone = () => {
    setStep("phone");
    setVerificationCode("");
    setShowDemoCode(false);
  };

  if (step === "verification") {
    return (
      <div className="space-y-4">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <Smartphone className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold">Verify Your Phone</h3>
          <p className="text-sm text-muted-foreground">
            We&apos;ve sent a verification code to {phoneNumber}
          </p>
        </div>

        {showDemoCode && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800 text-center">
              <strong>Demo Mode:</strong> Use verification code:{" "}
              <code className="bg-blue-100 px-2 py-1 rounded">
                123456
              </code>
            </p>
          </div>
        )}

        <div className="space-y-3">
          <Input
            type="text"
            placeholder="Enter 6-digit code"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value)}
            maxLength={6}
            className="text-center text-lg tracking-widest"
          />

          <Button
            onClick={handleVerifyCode}
            disabled={isLoading || verificationCode.length !== 6}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Verifying...
              </>
            ) : (
              "Verify & Sign In"
            )}
          </Button>

          <Button
            variant="outline"
            onClick={handleBackToPhone}
            className="w-full"
          >
            Back to Phone Number
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-center">
        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <MessageCircle className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          WhatsApp Sign In
        </h2>
        <p className="text-gray-600 mb-6">
          Enter your WhatsApp number to receive a verification code
        </p>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm text-blue-800 text-center">
            We'll send a 6-digit code to your WhatsApp number
          </p>
          <code className="bg-blue-100 px-2 py-1 rounded">
            +84 901 234 567
          </code>
        </div>
      </div>

      <div className="space-y-3">
        <Input
          type="tel"
          placeholder="+1 (234) 567-8900"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          className="text-center"
        />

        <Button
          onClick={handleSendCode}
          disabled={isLoading || phoneNumber.length < 10}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Sending Code...
            </>
          ) : (
            "Send Verification Code"
          )}
        </Button>
      </div>

      <div className="text-xs text-muted-foreground text-center">
        By continuing, you agree to our Terms of Service and Privacy Policy
      </div>
    </div>
  );
}
