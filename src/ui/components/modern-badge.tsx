"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface ModernBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "warning" | "error" | "info" | "neutral";
  size?: "xs" | "sm" | "md" | "lg";
  rounded?: "sm" | "md" | "lg" | "full";
  dot?: boolean;
  icon?: React.ReactNode;
  removable?: boolean;
  onRemove?: () => void;
}

const badgeVariants = {
  default: "bg-blue-100 text-blue-800 border-blue-200",
  success: "bg-green-100 text-green-800 border-green-200",
  warning: "bg-yellow-100 text-yellow-800 border-yellow-200",
  error: "bg-red-100 text-red-800 border-red-200",
  info: "bg-cyan-100 text-cyan-800 border-cyan-200",
  neutral: "bg-gray-100 text-gray-800 border-gray-200"
};

const badgeSizes = {
  xs: "px-1.5 py-0.5 text-xs",
  sm: "px-2 py-1 text-xs",
  md: "px-2.5 py-1.5 text-sm",
  lg: "px-3 py-2 text-sm"
};

const badgeRounded = {
  sm: "rounded-sm",
  md: "rounded-md",
  lg: "rounded-lg",
  full: "rounded-full"
};

export const ModernBadge = React.forwardRef<HTMLSpanElement, ModernBadgeProps>(
  ({
    className,
    variant = "default",
    size = "sm",
    rounded = "full",
    dot = false,
    icon,
    removable = false,
    onRemove,
    children,
    ...props
  }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          // Base styles
          "inline-flex items-center gap-1 font-medium border",
          "transition-colors duration-200",
          
          // Variants
          badgeVariants[variant],
          
          // Sizes
          badgeSizes[size],
          
          // Rounded
          badgeRounded[rounded],
          
          className
        )}
        {...props}
      >
        {dot && (
          <div className={cn(
            "w-1.5 h-1.5 rounded-full",
            variant === "default" && "bg-blue-600",
            variant === "success" && "bg-green-600",
            variant === "warning" && "bg-yellow-600",
            variant === "error" && "bg-red-600",
            variant === "info" && "bg-cyan-600",
            variant === "neutral" && "bg-gray-600"
          )} />
        )}
        
        {icon && (
          <span className="flex-shrink-0">
            {icon}
          </span>
        )}
        
        {children && (
          <span className="truncate">
            {children}
          </span>
        )}
        
        {removable && (
          <button
            onClick={onRemove}
            className="ml-1 flex-shrink-0 hover:bg-black/10 rounded-full p-0.5 transition-colors"
            aria-label="Remove"
          >
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        )}
      </span>
    );
  }
);

ModernBadge.displayName = "ModernBadge";

// Specialized badge components
export const StatusBadge = React.forwardRef<HTMLSpanElement, Omit<ModernBadgeProps, 'variant'> & { status: 'available' | 'busy' | 'pending' | 'approved' | 'rejected' }>(
  ({ status, children, ...props }, ref) => {
    const statusConfig = {
      available: { variant: "success" as const, children: "Available" },
      busy: { variant: "neutral" as const, children: "Not Available" },
      pending: { variant: "warning" as const, children: "Pending" },
      approved: { variant: "success" as const, children: "Approved" },
      rejected: { variant: "error" as const, children: "Rejected" }
    };

    const config = statusConfig[status];

    return (
      <ModernBadge
        ref={ref}
        variant={config.variant}
        dot
        {...props}
      >
        {children || config.children}
      </ModernBadge>
    );
  }
);

StatusBadge.displayName = "StatusBadge";

export const SkillBadge = React.forwardRef<HTMLSpanElement, Omit<ModernBadgeProps, 'variant'> & { skill: string }>(
  ({ skill, removable = true, onRemove, ...props }, ref) => (
    <ModernBadge
      ref={ref}
      variant="info"
      removable={removable}
      onRemove={onRemove}
      {...props}
    >
      {skill}
    </ModernBadge>
  )
);

SkillBadge.displayName = "SkillBadge";

export const NotificationBadge = React.forwardRef<HTMLSpanElement, Omit<ModernBadgeProps, 'variant'> & { count: number; max?: number }>(
  ({ count, max = 99, ...props }, ref) => (
    <ModernBadge
      ref={ref}
      variant="error"
      size="xs"
      rounded="full"
      {...props}
    >
      {count > max ? `${max}+` : count}
    </ModernBadge>
  )
);

NotificationBadge.displayName = "NotificationBadge";
