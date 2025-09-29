"use client";

import { useState, useEffect } from "react";
import { Button } from "@/ui/components/button";
import { Input } from "@/ui/components/input";
import { ErrorDisplay, FieldError } from "@/ui/components/error-display";
import { CheckCircle, ArrowLeft, RefreshCw } from "lucide-react";

interface VerifyOTPProps {
  email: string;
  onVerified: () => void;
  onBack: () => void;
}

export default function VerifyOTP({
  email,
  onVerified,
  onBack,
}: VerifyOTPProps) {
  const [code, setCode] = useState(process.env.NODE_ENV !== "production" ? "000000" : "");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(
    null
  );

  // Auto-focus on code input
  useEffect(() => {
    const input = document.getElementById("verification-code");
    if (input) {
      input.focus();
    }
  }, []);

  const handleVerifyCode = async () => {
    if (!code || code.length !== 6) {
      setError("Please enter a valid 6-digit code");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/email-verification/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          onVerified();
        }, 1500);
      } else {
        setError(data.error || "Invalid verification code");
        setRemainingAttempts(data.remainingAttempts);
      }
    } catch (error) {
      console.error("Error verifying code:", error);
      setError("Failed to verify code");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
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
        setCode("");
        setError(null);
        setRemainingAttempts(null);
      } else {
        setError(data.error || "Failed to resend verification code");
      }
    } catch (error) {
      console.error("Error resending code:", error);
      setError("Failed to resend verification code");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 6);
    setCode(value);
    setError(null);
  };

  if (success) {
    return (
      <div className="text-center">
        <div className="mb-4">
          <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-6 h-6 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Email verified!
          </h3>
          <p className="text-sm text-gray-600">
            Your email has been successfully verified
          </p>
        </div>
        <div className="animate-pulse">
          <div className="text-sm text-gray-500">Completing sign up...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
          <CheckCircle className="w-6 h-6 text-blue-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Enter verification code
        </h3>
        <p className="text-sm text-gray-600">
          We sent a 6-digit code to <strong>{email}</strong>
        </p>
      </div>

      {error && (
        <div className="mb-4">
          <ErrorDisplay error={error} onDismiss={() => setError(null)} />
        </div>
      )}

      <div className="space-y-4">
        <div>
          <Input
            id="verification-code"
            type="text"
            placeholder="000000"
            value={code}
            onChange={handleCodeChange}
            className={`text-center text-lg tracking-widest ${error ? "border-red-500" : ""}`}
            maxLength={6}
          />
          <FieldError error={error} />
        </div>

        <Button
          onClick={handleVerifyCode}
          disabled={isLoading || code.length !== 6}
          className="w-full bg-black text-white hover:bg-black/90"
        >
          {isLoading ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Verifying...
            </>
          ) : (
            "Verify email"
          )}
        </Button>

        <div className="flex space-x-2">
          <Button
            onClick={handleResendCode}
            disabled={isLoading}
            variant="outline"
            className="flex-1"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Resend code
          </Button>

          <Button onClick={onBack} variant="outline" className="flex-1">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>

        {remainingAttempts !== null && (
          <div className="text-center">
            <p className="text-sm text-orange-600">
              {remainingAttempts} attempts remaining
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
