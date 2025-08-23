export interface ServerError {
  error: string;
  details?: any;
  status?: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  details?: any;
  message?: string;
}

export class ApiError extends Error {
  public status: number;
  public details?: any;

  constructor(message: string, status: number = 500, details?: any) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

export function handleApiError(error: unknown): ServerError {
  console.error("API Error:", error);

  if (error instanceof ApiError) {
    return {
      error: error.message,
      details: error.details,
      status: error.status,
    };
  }

  if (error instanceof Error) {
    return {
      error: error.message,
      status: 500,
    };
  }

  if (typeof error === "string") {
    return {
      error,
      status: 500,
    };
  }

  return {
    error: "An unexpected error occurred",
    status: 500,
  };
}

export function isApiError(error: unknown): error is ServerError {
  return typeof error === "object" && error !== null && "error" in error;
}

export function formatErrorMessage(error: ServerError): string {
  if (error.details && Array.isArray(error.details)) {
    // Handle Zod validation errors
    const fieldErrors = error.details
      .map((detail: any) => detail.message)
      .filter(Boolean);

    if (fieldErrors.length > 0) {
      return fieldErrors.join(", ");
    }
  }

  return error.error || "An error occurred";
}
