/**
 * PayPal-specific type definitions
 */

export interface PayPalAccessTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
}

export interface PayPalSubscription {
  id: string;
  status: "APPROVAL_PENDING" | "APPROVED" | "ACTIVE" | "SUSPENDED" | "CANCELLED" | "EXPIRED";
  plan_id: string;
  subscriber: {
    email_address: string;
    name?: {
      given_name: string;
      surname: string;
    };
  };
  billing_info: {
    outstanding_balance: {
      currency_code: string;
      value: string;
    };
    cycle_executions: Array<{
      tenure_type: string;
      sequence: number;
      cycles_completed: number;
      cycles_remaining?: number;
      current_pricing_scheme: {
        fixed_price: {
          currency_code: string;
          value: string;
        };
      };
    }>;
    last_payment?: {
      amount: {
        currency_code: string;
        value: string;
      };
      time: string;
    };
    next_billing_time?: string;
  };
  create_time: string;
  update_time: string;
  start_time: string;
}

export interface PayPalWebhookEvent {
  id: string;
  event_type: string;
  event_version: string;
  create_time: string;
  resource_type: string;
  resource_version: string;
  summary: string;
  resource: {
    id: string;
    status?: string;
    plan_id?: string;
    billing_agreement_id?: string;
    subscription_id?: string;
    amount?: {
      total?: string;
      value?: string;
      currency_code?: string;
      currency?: string;
    };
    [key: string]: any;
  };
  links: Array<{
    href: string;
    rel: string;
    method: string;
  }>;
}

export interface PayPalWebhookVerificationRequest {
  auth_algo: string;
  cert_id: string;
  transmission_id: string;
  transmission_sig: string;
  transmission_time: string;
  webhook_id: string;
  webhook_event: PayPalWebhookEvent;
}

export interface PayPalWebhookVerificationResponse {
  verification_status: "SUCCESS" | "FAILURE";
}

export interface PayPalErrorResponse {
  error: string;
  error_description: string;
  details?: Array<{
    field: string;
    value: string;
    location: string;
    issue: string;
    description: string;
  }>;
}

// Subscription status mapping to our internal enum
export const PAYPAL_STATUS_MAP = {
  "APPROVAL_PENDING": "past_due",
  "APPROVED": "active", 
  "ACTIVE": "active",
  "SUSPENDED": "past_due",
  "CANCELLED": "canceled",
  "EXPIRED": "canceled"
} as const;

export type PayPalSubscriptionStatus = keyof typeof PAYPAL_STATUS_MAP;
