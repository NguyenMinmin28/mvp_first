import { cn } from "@/core/utils/utils";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function LoadingSpinner({
  size = "md",
  className,
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-6 w-6",
  };

  return (
    <div
      className={cn(
        "animate-spin rounded-full border-2 border-current border-t-transparent",
        sizeClasses[size],
        className
      )}
    />
  );
}

interface LoadingButtonProps {
  children: React.ReactNode;
  loading?: boolean;
  loadingText?: string;
  className?: string;
  [key: string]: any;
}

export function LoadingButton({
  children,
  loading = false,
  loadingText,
  className,
  ...props
}: LoadingButtonProps) {
  return (
    <button
      className={cn("flex items-center justify-center", className)}
      disabled={loading}
      {...props}
    >
      {loading && (
        <>
          <LoadingSpinner size="sm" className="mr-2" />
          {loadingText || "Loading..."}
        </>
      )}
      {!loading && children}
    </button>
  );
}
