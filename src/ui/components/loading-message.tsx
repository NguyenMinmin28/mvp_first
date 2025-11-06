"use client";

import { LoadingSpinner } from "./loading-spinner";
import { cn } from "@/core/utils/utils";

interface LoadingMessageProps {
  title?: string;
  message?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  showSpinner?: boolean;
}

export function LoadingMessage({
  title = "Finding Developers",
  message = "AI matchmaking in progress — bringing you the smartest connections.",
  size = "md",
  className,
  showSpinner = true,
}: LoadingMessageProps) {
  const sizeClasses = {
    sm: "py-6",
    md: "py-8", 
    lg: "py-12",
  };

  const spinnerSizes = {
    sm: "sm" as const,
    md: "md" as const,
    lg: "lg" as const,
  };

  return (
    <div className={cn("flex flex-col items-center justify-center space-y-4", sizeClasses[size], className)}>
      {showSpinner && <LoadingSpinner size={spinnerSizes[size]} />}
      <div className="text-center max-w-md">
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {title}
        </h3>
        <p className="text-gray-600 text-sm">
          {message}
        </p>
      </div>
    </div>
  );
}

interface LoadingOverlayProps extends LoadingMessageProps {
  isVisible: boolean;
}

export function LoadingOverlay({
  isVisible,
  title = "Finding Developers",
  message = "AI matchmaking in progress — bringing you the smartest connections.",
  size = "md",
  className,
}: LoadingOverlayProps) {
  if (!isVisible) return null;

  return (
    <div className="absolute inset-0 z-10 bg-white/70 backdrop-blur-sm flex items-center justify-center">
      <div className="flex flex-col items-center gap-4 p-6 rounded-lg bg-white shadow-lg border max-w-sm text-center">
        <LoadingSpinner size="lg" />
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {title}
          </h3>
          <p className="text-sm text-gray-600">
            {message}
          </p>
        </div>
      </div>
    </div>
  );
}
