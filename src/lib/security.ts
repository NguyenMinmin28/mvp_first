import { NextRequest, NextResponse } from "next/server";

/**
 * Content Security Policy for PayPal integration
 */
export const CSP_HEADER = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.paypal.com https://*.paypal.com https://www.paypalobjects.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data: https:",
  "frame-src 'self' https://*.paypal.com https://*.paypalobjects.com",
  "connect-src 'self' https://api-m.paypal.com https://api-m.sandbox.paypal.com https://www.paypal.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self' https://*.paypal.com"
].join("; ");

/**
 * Rate limiting store (in-memory for simple implementation)
 * In production, use Redis or similar
 */
class RateLimiter {
  private requests = new Map<string, { count: number; resetTime: number }>();
  private readonly cleanup = 60000; // Cleanup every minute

  constructor() {
    // Cleanup expired entries periodically
    setInterval(() => {
      const now = Date.now();
      this.requests.forEach((value, key) => {
        if (now > value.resetTime) {
          this.requests.delete(key);
        }
      });
    }, this.cleanup);
  }

  /**
   * Check if request is within rate limit
   */
  isAllowed(
    identifier: string, 
    maxRequests: number, 
    windowMs: number
  ): { allowed: boolean; remaining: number; resetTime: number } {
    const now = Date.now();
    const resetTime = now + windowMs;
    
    const current = this.requests.get(identifier);
    
    if (!current || now > current.resetTime) {
      // New window or expired
      this.requests.set(identifier, { count: 1, resetTime });
      return { 
        allowed: true, 
        remaining: maxRequests - 1, 
        resetTime 
      };
    }

    if (current.count >= maxRequests) {
      return { 
        allowed: false, 
        remaining: 0, 
        resetTime: current.resetTime 
      };
    }

    // Increment count
    current.count++;
    this.requests.set(identifier, current);
    
    return { 
      allowed: true, 
      remaining: maxRequests - current.count, 
      resetTime: current.resetTime 
    };
  }
}

const rateLimiter = new RateLimiter();

/**
 * Rate limiting middleware
 */
export function rateLimit(
  maxRequests: number = 100,
  windowMs: number = 15 * 60 * 1000, // 15 minutes
  skipSuccessfulRequests: boolean = false
) {
  return (request: NextRequest): NextResponse | null => {
    // Get client identifier
    const ip = request.headers.get("x-forwarded-for") || 
              request.headers.get("x-real-ip") || 
              "unknown";
    
    const identifier = `rate_limit:${ip}`;
    
    const result = rateLimiter.isAllowed(identifier, maxRequests, windowMs);
    
    if (!result.allowed) {
      return NextResponse.json(
        { 
          error: "Too many requests", 
          retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000)
        },
        { 
          status: 429,
          headers: {
            "Retry-After": String(Math.ceil((result.resetTime - Date.now()) / 1000)),
            "X-RateLimit-Limit": String(maxRequests),
            "X-RateLimit-Remaining": String(result.remaining),
            "X-RateLimit-Reset": String(Math.ceil(result.resetTime / 1000))
          }
        }
      );
    }

    return null; // Continue
  };
}

/**
 * Security headers middleware
 */
export function securityHeaders(response: NextResponse): NextResponse {
  response.headers.set("Content-Security-Policy", CSP_HEADER);
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  
  // Remove potentially revealing headers
  response.headers.delete("X-Powered-By");
  response.headers.delete("Server");
  
  return response;
}

/**
 * Webhook-specific rate limiting (more restrictive)
 */
export const webhookRateLimit = rateLimit(
  50,  // 50 requests
  5 * 60 * 1000, // per 5 minutes
  true // skip successful requests
);

/**
 * Billing API rate limiting
 */
export const billingRateLimit = rateLimit(
  30,  // 30 requests  
  60 * 1000, // per minute
  false
);

/**
 * General API rate limiting
 */
export const apiRateLimit = rateLimit(
  100, // 100 requests
  15 * 60 * 1000, // per 15 minutes
  false
);
