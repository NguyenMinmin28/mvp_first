import { AlertCircle, X } from "lucide-react";
import { cn } from "@/core/utils/utils";

interface ErrorDisplayProps {
  error?: string | null;
  onDismiss?: () => void;
  className?: string;
  variant?: "default" | "destructive" | "warning";
}

export function ErrorDisplay({
  error,
  onDismiss,
  className,
  variant = "destructive",
}: ErrorDisplayProps) {
  if (!error) return null;

  const variantStyles = {
    default:
      "bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300",
    destructive:
      "bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300",
    warning:
      "bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-300",
  };

  const iconColors = {
    default: "text-blue-600 dark:text-blue-400",
    destructive: "text-red-600 dark:text-red-400",
    warning: "text-yellow-600 dark:text-yellow-400",
  };

  return (
    <div
      className={cn(
        "flex items-start gap-3 p-4 border rounded-lg",
        variantStyles[variant],
        className
      )}
      role="alert"
    >
      <AlertCircle
        className={cn("h-5 w-5 mt-0.5 flex-shrink-0", iconColors[variant])}
      />

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{error}</p>
      </div>

      {onDismiss && (
        <button
          onClick={onDismiss}
          className="flex-shrink-0 p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          aria-label="Dismiss error"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

interface FieldErrorProps {
  error?: string | null;
  className?: string;
}

export function FieldError({ error, className }: FieldErrorProps) {
  if (!error) return null;

  return (
    <p className={cn("text-sm text-red-500 dark:text-red-400", className)}>
      {error}
    </p>
  );
}
