"use client";

import { ReactNode } from "react";
import { cn } from "@/core/utils/utils";

interface ReadOnlyFieldProps {
  value?: ReactNode | null;
  placeholder?: string;
  className?: string;
  multiline?: boolean;
}

const isEmptyValue = (value: ReactNode | null | undefined) => {
  if (value === null || value === undefined) return true;
  if (typeof value === "string") return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  return false;
};

export function ReadOnlyField({
  value,
  placeholder = "N/A",
  className,
  multiline = false,
}: ReadOnlyFieldProps) {
  let displayValue: ReactNode = value;

  if (Array.isArray(value)) {
    displayValue = value.length === 0 ? placeholder : value.join(", ");
  }

  if (isEmptyValue(value)) {
    displayValue = placeholder;
  }

  return (
    <div
      className={cn(
        "w-full rounded-md border border-gray-200 bg-gray-50 px-3 text-sm text-gray-900",
        multiline ? "py-3" : "h-12 flex items-center",
        className
      )}
    >
      {multiline ? (
        <div className="whitespace-pre-wrap leading-relaxed text-sm text-gray-900">
          {displayValue}
        </div>
      ) : (
        <span className="text-sm text-gray-900">{displayValue}</span>
      )}
    </div>
  );
}


