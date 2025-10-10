"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface LoadingSpinnerProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  color?: "primary" | "white" | "gray";
  className?: string;
}

const spinnerSizes = {
  xs: "w-3 h-3",
  sm: "w-4 h-4",
  md: "w-6 h-6",
  lg: "w-8 h-8",
  xl: "w-12 h-12"
};

const spinnerColors = {
  primary: "text-blue-600",
  white: "text-white",
  gray: "text-gray-600"
};

export const LoadingSpinner = ({ size = "md", color = "primary", className }: LoadingSpinnerProps) => {
  return (
    <div
      className={cn(
        "animate-spin",
        spinnerSizes[size],
        spinnerColors[color],
        className
      )}
    >
      <svg
        className="w-full h-full"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    </div>
  );
};

export interface LoadingDotsProps {
  size?: "sm" | "md" | "lg";
  color?: "primary" | "white" | "gray";
  className?: string;
}

const dotsSizes = {
  sm: "w-1 h-1",
  md: "w-2 h-2",
  lg: "w-3 h-3"
};

export const LoadingDots = ({ size = "md", color = "primary", className }: LoadingDotsProps) => {
  const dotColor = color === "primary" ? "bg-blue-600" : color === "white" ? "bg-white" : "bg-gray-600";
  
  return (
    <div className={cn("flex space-x-1", className)}>
      <div
        className={cn(
          "rounded-full animate-bounce",
          dotsSizes[size],
          dotColor
        )}
        style={{ animationDelay: "0ms" }}
      />
      <div
        className={cn(
          "rounded-full animate-bounce",
          dotsSizes[size],
          dotColor
        )}
        style={{ animationDelay: "150ms" }}
      />
      <div
        className={cn(
          "rounded-full animate-bounce",
          dotsSizes[size],
          dotColor
        )}
        style={{ animationDelay: "300ms" }}
      />
    </div>
  );
};

export interface LoadingPulseProps {
  className?: string;
}

export const LoadingPulse = ({ className }: LoadingPulseProps) => {
  return (
    <div className={cn("animate-pulse", className)}>
      <div className="space-y-4">
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        </div>
      </div>
    </div>
  );
};

export interface LoadingSkeletonProps {
  lines?: number;
  className?: string;
}

export const LoadingSkeleton = ({ lines = 3, className }: LoadingSkeletonProps) => {
  return (
    <div className={cn("animate-pulse space-y-3", className)}>
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          className={cn(
            "h-4 bg-gray-200 rounded",
            index === lines - 1 && "w-3/4"
          )}
        />
      ))}
    </div>
  );
};

export interface LoadingOverlayProps {
  isLoading: boolean;
  children: React.ReactNode;
  spinner?: boolean;
  message?: string;
  className?: string;
}

export const LoadingOverlay = ({
  isLoading,
  children,
  spinner = true,
  message,
  className
}: LoadingOverlayProps) => {
  if (!isLoading) return <>{children}</>;

  return (
    <div className={cn("relative", className)}>
      {children}
      <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-10">
        <div className="text-center">
          {spinner && <LoadingSpinner size="lg" className="mx-auto mb-4" />}
          {message && (
            <p className="text-gray-600 font-medium">
              {message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  loadingText?: string;
  children: React.ReactNode;
}

export const LoadingButton = ({
  loading = false,
  loadingText = "Loading...",
  children,
  disabled,
  className,
  ...props
}: LoadingButtonProps) => {
  return (
    <button
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors",
        "bg-blue-600 text-white hover:bg-blue-700",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        className
      )}
      {...props}
    >
      {loading && <LoadingSpinner size="sm" color="white" />}
      {loading ? loadingText : children}
    </button>
  );
};

// Page loading component
export interface PageLoadingProps {
  message?: string;
  className?: string;
}

export const PageLoading = ({ message = "Loading...", className }: PageLoadingProps) => {
  return (
    <div className={cn("min-h-screen flex items-center justify-center bg-gray-50", className)}>
      <div className="text-center">
        <LoadingSpinner size="xl" className="mx-auto mb-6" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          {message}
        </h2>
        <p className="text-gray-600">
          Please wait while we load your content...
        </p>
      </div>
    </div>
  );
};
