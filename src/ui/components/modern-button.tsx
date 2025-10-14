"use client";

import React from "react";
import { cn } from "@/core/utils/utils";
import { Loader2 } from "lucide-react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "success" | "warning" | "error" | "outline" | "ghost";
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  rounded?: "sm" | "md" | "lg" | "full";
}

const buttonVariants = {
  primary: "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg hover:from-blue-700 hover:to-blue-800 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200",
  secondary: "bg-gradient-to-r from-gray-600 to-gray-700 text-white shadow-lg hover:from-gray-700 hover:to-gray-800 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200",
  success: "bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg hover:from-green-700 hover:to-green-800 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200",
  warning: "bg-gradient-to-r from-yellow-500 to-yellow-600 text-white shadow-lg hover:from-yellow-600 hover:to-yellow-700 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200",
  error: "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg hover:from-red-700 hover:to-red-800 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200",
  outline: "bg-transparent border-2 border-blue-600 text-blue-600 hover:bg-blue-50 hover:border-blue-700 transition-all duration-200",
  ghost: "bg-transparent text-gray-700 hover:bg-gray-100 transition-all duration-200"
};

const buttonSizes = {
  xs: "h-7 px-2 text-xs",
  sm: "h-8 px-3 text-sm",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-base",
  xl: "h-14 px-8 text-lg"
};

const buttonRounded = {
  sm: "rounded-sm",
  md: "rounded-md",
  lg: "rounded-lg",
  full: "rounded-full"
};

export const ModernButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({
    className,
    variant = "primary",
    size = "md",
    loading = false,
    leftIcon,
    rightIcon,
    fullWidth = false,
    rounded = "lg",
    children,
    disabled,
    ...props
  }, ref) => {
    return (
      <button
        className={cn(
          // Base styles
          "inline-flex items-center justify-center gap-2 font-semibold",
          "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500",
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none",
          "active:scale-95",
          
          // Variants
          buttonVariants[variant],
          
          // Sizes
          buttonSizes[size],
          
          // Rounded
          buttonRounded[rounded],
          
          // Full width
          fullWidth && "w-full",
          
          // Custom className
          className
        )}
        disabled={disabled || loading}
        ref={ref}
        {...props}
      >
        {loading && (
          <Loader2 className="h-4 w-4 animate-spin" />
        )}
        
        {!loading && leftIcon && (
          <span className="flex-shrink-0">{leftIcon}</span>
        )}
        
        {children && (
          <span className={cn(loading && "opacity-0")}>
            {children}
          </span>
        )}
        
        {!loading && rightIcon && (
          <span className="flex-shrink-0">{rightIcon}</span>
        )}
      </button>
    );
  }
);

ModernButton.displayName = "ModernButton";

// Specialized button components
export const WhatsAppButton = React.forwardRef<HTMLButtonElement, Omit<ButtonProps, 'variant'>>(
  ({ children = "WhatsApp", ...props }, ref) => (
    <ModernButton
      ref={ref}
      variant="success"
      leftIcon={
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
        </svg>
      }
      {...props}
    >
      {children}
    </ModernButton>
  )
);

WhatsAppButton.displayName = "WhatsAppButton";

export const StatusButton = React.forwardRef<HTMLButtonElement, Omit<ButtonProps, 'variant'> & { status: 'available' | 'busy' }>(
  ({ status, children, ...props }, ref) => (
    <ModernButton
      ref={ref}
      variant={status === 'available' ? 'success' : 'secondary'}
      {...props}
    >
      {children || (status === 'available' ? 'Available' : 'Not Available')}
    </ModernButton>
  )
);

StatusButton.displayName = "StatusButton";

export const FollowButton = React.forwardRef<HTMLButtonElement, Omit<ButtonProps, 'variant'> & { isFollowing?: boolean }>(
  ({ isFollowing = false, children, ...props }, ref) => (
    <ModernButton
      ref={ref}
      variant="outline"
      {...props}
    >
      {children || (isFollowing ? 'Unfollow' : 'Follow')}
    </ModernButton>
  )
);

FollowButton.displayName = "FollowButton";
