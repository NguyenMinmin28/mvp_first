import { useState, useCallback } from "react";
import {
  ApiResponse,
  ServerError,
  formatErrorMessage,
} from "@/core/utils/error-handler";

interface UseApiOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: string) => void;
  onFinally?: () => void;
}

interface UseApiReturn<T> {
  data: T | null;
  error: string | null;
  isLoading: boolean;
  execute: (url: string, options?: RequestInit) => Promise<void>;
  reset: () => void;
}

export function useApi<T = any>(
  options: UseApiOptions<T> = {}
): UseApiReturn<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const execute = useCallback(
    async (url: string, requestOptions: RequestInit = {}) => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(url, {
          headers: {
            "Content-Type": "application/json",
            ...requestOptions.headers,
          },
          credentials: 'include',
          ...requestOptions,
        });

        const result: ApiResponse<T> = await response.json();

        if (!response.ok) {
          if (result.error) {
            const errorMessage = formatErrorMessage({
              error: result.error,
              details: result.details,
              status: response.status,
            });
            setError(errorMessage);
            options.onError?.(errorMessage);
            return;
          }
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        if (result.success && result.data) {
          setData(result.data);
          options.onSuccess?.(result.data);
        } else {
          throw new Error(result.error || "Request failed");
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "An unexpected error occurred";
        setError(errorMessage);
        options.onError?.(errorMessage);
      } finally {
        setIsLoading(false);
        options.onFinally?.();
      }
    },
    [options]
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    data,
    error,
    isLoading,
    execute,
    reset,
  };
}

// Specialized hook for form submissions
export function useFormSubmit<T = any>(options: UseApiOptions<T> = {}) {
  const api = useApi<T>(options);

  const submit = useCallback(
    async (url: string, formData: any) => {
      await api.execute(url, {
        method: "POST",
        body: JSON.stringify(formData),
      });
    },
    [api]
  );

  return {
    ...api,
    submit,
  };
}
