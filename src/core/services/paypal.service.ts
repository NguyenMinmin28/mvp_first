import { env } from "@/core/config/env.mjs";

// PayPal API base URLs
const PAYPAL_BASE_URL = env.PAYPAL_MODE === "live" 
  ? "https://api-m.paypal.com" 
  : "https://api-m.sandbox.paypal.com";

interface PayPalAccessTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
}

interface PayPalSubscription {
  id: string;
  status: string;
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

interface PayPalWebhookEvent {
  id: string;
  event_type: string;
  event_version: string;
  create_time: string;
  resource_type: string;
  resource_version: string;
  summary: string;
  resource: {
    id: string;
    [key: string]: any;
  };
  links: Array<{
    href: string;
    rel: string;
    method: string;
  }>;
}

class PayPalService {
  private accessToken: string | null = null;
  private tokenExpiresAt: number = 0;

  /**
   * Get PayPal OAuth access token
   */
  private async getAccessToken(): Promise<string> {
    // Return cached token if still valid
    if (this.accessToken && Date.now() < this.tokenExpiresAt) {
      return this.accessToken;
    }

    const auth = Buffer.from(`${env.PAYPAL_CLIENT_ID}:${env.PAYPAL_CLIENT_SECRET}`).toString('base64');
    
    const response = await fetch(`${PAYPAL_BASE_URL}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json',
        'Accept-Language': 'en_US',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials'
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`PayPal OAuth failed: ${error}`);
    }

    const data: PayPalAccessTokenResponse = await response.json();
    
    // Cache token with 5 minute buffer
    this.accessToken = data.access_token;
    this.tokenExpiresAt = Date.now() + (data.expires_in - 300) * 1000;
    
    return this.accessToken;
  }

  /**
   * Make authenticated request to PayPal API
   */
  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = await this.getAccessToken();
    
    const response = await fetch(`${PAYPAL_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'PayPal-Request-Id': `req-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      console.error(`PayPal API Error [${response.status}]:`, error);
      throw new Error(`PayPal API failed: ${response.status} ${error}`);
    }

    return response.json();
  }

  /**
   * Get subscription details from PayPal
   */
  async getSubscription(subscriptionId: string): Promise<PayPalSubscription> {
    return this.makeRequest<PayPalSubscription>(`/v1/billing/subscriptions/${subscriptionId}`);
  }

  /**
   * Verify webhook signature (simplified version)
   * In production, implement full webhook signature verification
   */
  async verifyWebhookSignature(
    webhookId: string,
    headers: Record<string, string>,
    body: string
  ): Promise<boolean> {
    try {
      // For now, just validate that required headers exist
      // In production, implement full signature verification using PayPal's verification API
      const requiredHeaders = [
        'paypal-transmission-id',
        'paypal-cert-id',
        'paypal-transmission-sig',
        'paypal-transmission-time'
      ];

      for (const header of requiredHeaders) {
        if (!headers[header.toLowerCase()]) {
          console.warn(`Missing webhook header: ${header}`);
          return false;
        }
      }

      // TODO: Implement full webhook verification
      // https://developer.paypal.com/docs/api/webhooks/v1/#verify-webhook-signature
      
      return true;
    } catch (error) {
      console.error('Webhook verification error:', error);
      return false;
    }
  }

  /**
   * Parse PayPal webhook event
   */
  parseWebhookEvent(body: string): PayPalWebhookEvent {
    try {
      return JSON.parse(body);
    } catch (error) {
      throw new Error('Invalid webhook payload');
    }
  }

  /**
   * Get the PayPal environment info
   */
  getEnvironment() {
    return {
      mode: env.PAYPAL_MODE,
      clientId: env.PAYPAL_CLIENT_ID,
      baseUrl: PAYPAL_BASE_URL,
    };
  }
}

export const paypalService = new PayPalService();
export type { PayPalSubscription, PayPalWebhookEvent };
