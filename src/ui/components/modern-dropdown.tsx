"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/core/utils/utils";

export interface ModernDropdownProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  align?: "left" | "right" | "center";
  side?: "top" | "bottom";
  className?: string;
  triggerClassName?: string;
  contentClassName?: string;
  disabled?: boolean;
}

export const ModernDropdown = ({
  trigger,
  children,
  align = "right",
  side = "bottom",
  className,
  triggerClassName,
  contentClassName,
  disabled = false,
}: ModernDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const alignClasses = {
    left: "left-0",
    right: "right-0",
    center: "left-1/2 transform -translate-x-1/2",
  };

  const sideClasses = {
    top: "bottom-full mb-2",
    bottom: "top-full mt-2",
  };

  return (
    <div ref={dropdownRef} className={cn("relative", className)}>
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
          triggerClassName
        )}
      >
        {trigger}
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown Content */}
          <div
            className={cn(
              "absolute z-20 min-w-[200px]",
              alignClasses[align],
              sideClasses[side],
              "bg-white rounded-xl shadow-xl border border-gray-200",
              "animate-in fade-in-0 zoom-in-95 duration-200",
              contentClassName
            )}
          >
            <div className="py-2">{children}</div>
          </div>
        </>
      )}
    </div>
  );
};

export interface DropdownItemProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: React.ReactNode;
  variant?: "default" | "danger" | "warning";
  children: React.ReactNode;
}

export const DropdownItem = ({
  icon,
  variant = "default",
  children,
  className,
  ...props
}: DropdownItemProps) => {
  const variantClasses = {
    default: "text-gray-700 hover:bg-gray-100",
    danger: "text-red-600 hover:bg-red-50",
    warning: "text-yellow-600 hover:bg-yellow-50",
  };

  return (
    <button
      className={cn(
        "w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium",
        "transition-colors duration-150",
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {icon && <span className="flex-shrink-0 text-gray-400">{icon}</span>}
      <span className="flex-1 text-left">{children}</span>
    </button>
  );
};

export interface DropdownDividerProps {
  className?: string;
}

export const DropdownDivider = ({ className }: DropdownDividerProps) => (
  <div className={cn("h-px bg-gray-200 my-1", className)} />
);

export interface DropdownHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export const DropdownHeader = ({
  children,
  className,
}: DropdownHeaderProps) => (
  <div
    className={cn(
      "px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider",
      className
    )}
  >
    {children}
  </div>
);

// Specialized Dropdown Components
export interface StatusDropdownProps {
  currentStatus: string;
  onStatusChange: (status: string) => void;
  className?: string;
}

export const StatusDropdown = ({
  currentStatus,
  onStatusChange,
  className,
}: StatusDropdownProps) => {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case "available":
        return {
          label: "Available",
          color: "bg-green-600 hover:bg-green-700",
          icon: "🟢",
        };
      case "busy":
        return {
          label: "Not Available",
          color: "bg-gray-600 hover:bg-gray-700",
          icon: "🔴",
        };
      default:
        return {
          label: status,
          color: "bg-gray-600 hover:bg-gray-700",
          icon: "⚪",
        };
    }
  };

  const currentConfig = getStatusConfig(currentStatus);

  return (
    <ModernDropdown
      trigger={
        <div
          className={cn(
            "h-8 px-3 rounded-full flex items-center gap-2 text-white font-medium text-sm",
            "transition-all duration-200 hover:shadow-md",
            currentConfig.color
          )}
        >
          <span>{currentConfig.icon}</span>
          <span>{currentConfig.label}</span>
          <ChevronDown className="w-4 h-4" />
        </div>
      }
      className={className}
    >
      <DropdownItem
        onClick={() => onStatusChange("available")}
        icon="🟢"
        variant={currentStatus === "available" ? "default" : "default"}
      >
        Available
      </DropdownItem>
      <DropdownItem
        onClick={() => onStatusChange("busy")}
        icon="🔴"
        variant={currentStatus === "busy" ? "default" : "default"}
      >
        Not Available
      </DropdownItem>
    </ModernDropdown>
  );
};

export interface ActionDropdownProps {
  onEditProfile: () => void;
  onSettings?: () => void;
  onLogout?: () => void;
  className?: string;
}

export const ActionDropdown = ({
  onEditProfile,
  onSettings,
  onLogout,
  className,
}: ActionDropdownProps) => {
  return (
    <ModernDropdown
      trigger={
        <div className="h-8 px-3 rounded-full bg-black text-white flex items-center gap-2 font-medium text-sm hover:bg-gray-800 transition-all duration-200 hover:shadow-md">
          <span>Action</span>
          <ChevronDown className="w-4 h-4" />
        </div>
      }
      className={className}
    >
      <DropdownItem
        onClick={onEditProfile}
        icon={
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
            />
          </svg>
        }
      >
        Edit Profile
      </DropdownItem>

      {onSettings && (
        <>
          <DropdownDivider />
          <DropdownItem
            onClick={onSettings}
            icon={
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            }
          >
            Settings
          </DropdownItem>
        </>
      )}

      {onLogout && (
        <>
          <DropdownDivider />
          <DropdownItem
            onClick={onLogout}
            icon={
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
            }
            variant="danger"
          >
            Logout
          </DropdownItem>
        </>
      )}
    </ModernDropdown>
  );
};
