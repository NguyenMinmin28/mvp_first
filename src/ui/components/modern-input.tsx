"use client";

import React, { useState } from "react";
import { cn } from "@/core/utils/utils";
import { Eye, EyeOff, Search, X } from "lucide-react";

export interface ModernInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  helper?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "filled" | "outlined";
  clearable?: boolean;
  onClear?: () => void;
}

const inputSizes = {
  sm: "h-8 px-3 text-sm",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-4 text-base"
};

const inputVariants = {
  default: "bg-white border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200",
  filled: "bg-gray-50 border border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200",
  outlined: "bg-transparent border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
};

export const ModernInput = React.forwardRef<HTMLInputElement, ModernInputProps>(
  ({
    className,
    label,
    error,
    helper,
    leftIcon,
    rightIcon,
    size = "md",
    variant = "default",
    clearable = false,
    onClear,
    value,
    onChange,
    type = "text",
    ...props
  }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    
    const isPassword = type === "password";
    const inputType = isPassword && showPassword ? "text" : type;
    const hasValue = value && String(value).length > 0;

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {label}
          </label>
        )}
        
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              {leftIcon}
            </div>
          )}
          
          <input
            ref={ref}
            type={inputType}
            value={value}
            onChange={onChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className={cn(
              // Base styles
              "w-full rounded-lg transition-all duration-200",
              "placeholder:text-gray-400",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              
              // Sizes
              inputSizes[size],
              
              // Variants
              inputVariants[variant],
              
              // Left icon padding
              leftIcon && "pl-10",
              
              // Right icon padding
              (rightIcon || clearable || isPassword) && "pr-10",
              
              // Error state
              error && "border-red-500 focus:border-red-500 focus:ring-red-200",
              
              // Focus state
              isFocused && !error && "shadow-sm",
              
              className
            )}
            {...props}
          />
          
          {/* Right side icons */}
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
            {isPassword && (
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            )}
            
            {clearable && hasValue && (
              <button
                type="button"
                onClick={onClear}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            
            {rightIcon && !isPassword && !clearable && (
              <div className="text-gray-400">
                {rightIcon}
              </div>
            )}
          </div>
        </div>
        
        {/* Helper text or error */}
        {(error || helper) && (
          <div className="mt-2">
            {error ? (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {error}
              </p>
            ) : (
              <p className="text-sm text-gray-500">
                {helper}
              </p>
            )}
          </div>
        )}
      </div>
    );
  }
);

ModernInput.displayName = "ModernInput";

// Specialized input components
export const SearchInput = React.forwardRef<HTMLInputElement, Omit<ModernInputProps, 'leftIcon' | 'type'>>(
  ({ placeholder = "Search...", ...props }, ref) => (
    <ModernInput
      ref={ref}
      type="search"
      leftIcon={<Search className="w-4 h-4" />}
      placeholder={placeholder}
      {...props}
    />
  )
);

SearchInput.displayName = "SearchInput";

export const PasswordInput = React.forwardRef<HTMLInputElement, Omit<ModernInputProps, 'type'>>(
  (props, ref) => (
    <ModernInput
      ref={ref}
      type="password"
      {...props}
    />
  )
);

PasswordInput.displayName = "PasswordInput";

export const EmailInput = React.forwardRef<HTMLInputElement, Omit<ModernInputProps, 'type'>>(
  (props, ref) => (
    <ModernInput
      ref={ref}
      type="email"
      {...props}
    />
  )
);

EmailInput.displayName = "EmailInput";
