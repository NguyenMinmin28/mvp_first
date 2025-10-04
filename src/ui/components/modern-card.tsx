"use client";

import React from "react";
import { cn } from "@/core/utils/utils";

export interface ModernCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "elevated" | "outlined" | "glass";
  hover?: boolean;
  interactive?: boolean;
  loading?: boolean;
  gradient?: boolean;
}

const cardVariants = {
  default: "bg-white border border-gray-200",
  elevated: "bg-white shadow-lg border border-gray-100",
  outlined: "bg-transparent border-2 border-gray-300",
  glass: "bg-white/80 backdrop-blur-sm border border-white/20"
};

export const ModernCard = React.forwardRef<HTMLDivElement, ModernCardProps>(
  ({
    className,
    variant = "default",
    hover = true,
    interactive = false,
    loading = false,
    gradient = false,
    children,
    ...props
  }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          // Base styles
          "rounded-xl overflow-hidden",
          
          // Variants
          cardVariants[variant],
          
          // Interactive styles
          interactive && "cursor-pointer",
          
          // Hover effects
          hover && !loading && cn(
            "transition-all duration-300 ease-out",
            interactive && "hover:shadow-xl hover:-translate-y-1",
            !interactive && "hover:shadow-md hover:-translate-y-0.5"
          ),
          
          // Gradient overlay
          gradient && "bg-gradient-to-br from-white to-gray-50",
          
          // Loading state
          loading && "animate-pulse",
          
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

ModernCard.displayName = "ModernCard";

export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, title, subtitle, action, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex items-start justify-between p-6 pb-4",
          className
        )}
        {...props}
      >
        <div className="flex-1">
          {title && (
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              {title}
            </h3>
          )}
          {subtitle && (
            <p className="text-sm text-gray-600">
              {subtitle}
            </p>
          )}
          {children}
        </div>
        {action && (
          <div className="ml-4 flex-shrink-0">
            {action}
          </div>
        )}
      </div>
    );
  }
);

CardHeader.displayName = "CardHeader";

export interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  padding?: "none" | "sm" | "md" | "lg";
}

export const CardContent = React.forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, padding = "md", children, ...props }, ref) => {
    const paddingClasses = {
      none: "",
      sm: "p-3",
      md: "p-6",
      lg: "p-8"
    };

    return (
      <div
        ref={ref}
        className={cn(
          paddingClasses[padding],
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

CardContent.displayName = "CardContent";

export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  align?: "left" | "center" | "right" | "between";
}

export const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, align = "right", children, ...props }, ref) => {
    const alignClasses = {
      left: "justify-start",
      center: "justify-center",
      right: "justify-end",
      between: "justify-between"
    };

    return (
      <div
        ref={ref}
        className={cn(
          "flex items-center gap-3 p-6 pt-4",
          alignClasses[align],
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

CardFooter.displayName = "CardFooter";

// Specialized card components
export interface StatsCardProps extends ModernCardProps {
  title: string;
  value: string | number;
  change?: {
    value: string;
    type: "positive" | "negative" | "neutral";
  };
  icon?: React.ReactNode;
  color?: "blue" | "green" | "yellow" | "red" | "purple";
}

export const StatsCard = React.forwardRef<HTMLDivElement, StatsCardProps>(
  ({
    title,
    value,
    change,
    icon,
    color = "blue",
    className,
    ...props
  }, ref) => {
    const colorClasses = {
      blue: "bg-blue-50 border-blue-200 text-blue-900",
      green: "bg-green-50 border-green-200 text-green-900",
      yellow: "bg-yellow-50 border-yellow-200 text-yellow-900",
      red: "bg-red-50 border-red-200 text-red-900",
      purple: "bg-purple-50 border-purple-200 text-purple-900"
    };

    const changeClasses = {
      positive: "text-green-600",
      negative: "text-red-600",
      neutral: "text-gray-600"
    };

    return (
      <ModernCard
        ref={ref}
        variant="elevated"
        className={cn(colorClasses[color], className)}
        {...props}
      >
        <CardContent padding="lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium opacity-75 mb-1">
                {title}
              </p>
              <p className="text-2xl font-bold">
                {value}
              </p>
              {change && (
                <p className={cn("text-xs font-medium mt-1", changeClasses[change.type])}>
                  {change.value}
                </p>
              )}
            </div>
            {icon && (
              <div className="text-2xl opacity-75">
                {icon}
              </div>
            )}
          </div>
        </CardContent>
      </ModernCard>
    );
  }
);

StatsCard.displayName = "StatsCard";
