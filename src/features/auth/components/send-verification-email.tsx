"use client";

import { useState } from "react";
import { Button } from "@/ui/components/button";
import { Input } from "@/ui/components/input";
import { ErrorDisplay, FieldError } from "@/ui/components/error-display";
import { Mail, ArrowLeft, RefreshCw } from "lucide-react";

interface SendVerificationEmailProps {
  email: string;
  onCodeSent: () => void;
  onBack: () => void;
}

export default function SendVerificationEmail({
  email,
  onCodeSent,
  onBack,
}: SendVerificationEmailProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSendCode = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/email-verification/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          onCodeSent();
        }, 1500);
      } else {
        setError(data.error || "Failed to send verification code");
      }
    } catch (error) {
      console.error("Error sending verification code:", error);
      setError("Failed to send verification code");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    await handleSendCode();
  };

  if (success) {
    return (
      <div className="text-center">
        <div className="mb-4">
          <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <Mail className="w-6 h-6 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Verification code sent!
          </h3>
          <p className="text-sm text-gray-600">
            We've sent a 6-digit code to <strong>{email}</strong>
          </p>
        </div>
        <div className="animate-pulse">
          <div className="text-sm text-gray-500">
            Redirecting to verification...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
          <Mail className="w-6 h-6 text-blue-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Verify your email
        </h3>
        <p className="text-sm text-gray-600">
          We'll send a verification code to <strong>{email}</strong>
        </p>
      </div>

      {error && (
        <div className="mb-4">
          <ErrorDisplay error={error} onDismiss={() => setError(null)} />
        </div>
      )}

      <div className="space-y-4">
        <Button
          onClick={handleSendCode}
          disabled={isLoading}
          className="w-full bg-black h-12 text-white hover:bg-black/90"
        >
          {isLoading ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Mail className="w-4 h-4 mr-2" />
              Send verification code
            </>
          )}
        </Button>

        <Button onClick={onBack} variant="outline" className="w-full h-12">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to sign up
        </Button>
      </div>
    </div>
  );
}
