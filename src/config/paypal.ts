import { env } from "@/core/config/env.mjs";

/**
 * PayPal configuration based on environment
 */
export const paypalConfig = {
  mode: env.PAYPAL_MODE,
  clientId: env.PAYPAL_CLIENT_ID,
  clientSecret: env.PAYPAL_CLIENT_SECRET, 
  webhookId: env.PAYPAL_WEBHOOK_ID,
  
  // Base URLs
  baseUrl: env.PAYPAL_MODE === "live" 
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com",
    
  jssdkUrl: env.PAYPAL_MODE === "live"
    ? "https://www.paypal.com/sdk/js"
    : "https://www.paypal.com/sdk/js",

  // Supported webhook events
  supportedEvents: [
    "BILLING.SUBSCRIPTION.CREATED",
    "BILLING.SUBSCRIPTION.ACTIVATED", 
    "BILLING.SUBSCRIPTION.UPDATED",
    "BILLING.SUBSCRIPTION.CANCELLED",
    "BILLING.SUBSCRIPTION.SUSPENDED",
    "BILLING.SUBSCRIPTION.EXPIRED",
    "PAYMENT.SALE.COMPLETED",
    "PAYMENT.CAPTURE.COMPLETED",
    "PAYMENT.SALE.DENIED",
    "PAYMENT.CAPTURE.DENIED"
  ] as const,

  // API timeouts
  timeouts: {
    oauth: 10000,      // 10s for token requests
    api: 30000,        // 30s for API calls  
    webhook: 5000      // 5s for webhook processing
  },

  // Retry configuration
  retry: {
    maxAttempts: 3,
    backoffMs: 1000,
    maxBackoffMs: 5000
  }
} as const;

export type PayPalWebhookEventType = typeof paypalConfig.supportedEvents[number];
