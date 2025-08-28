import { paypalConfig } from "@/config/paypal";
import { logger } from "@/lib/logger";
import type { 
  PayPalAccessTokenResponse, 
  PayPalSubscription, 
  PayPalWebhookEvent,
  PayPalWebhookVerificationRequest,
  PayPalWebhookVerificationResponse
} from "./paypal.types";

/**
 * Enhanced PayPal Service with proper error handling, logging and verification
 */
class PayPalService {
  private accessToken: string | null = null;
  private tokenExpiresAt: number = 0;

  /**
   * Get PayPal OAuth access token with retry logic
   */
  private async getAccessToken(): Promise<string> {
    // Return cached token if still valid
    if (this.accessToken && Date.now() < this.tokenExpiresAt) {
      return this.accessToken;
    }

    const correlationId = logger.generateCorrelationId();
    logger.debug("PayPal: Requesting new access token", { correlationId });

    const auth = Buffer.from(`${paypalConfig.clientId}:${paypalConfig.clientSecret}`).toString('base64');
    
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= paypalConfig.retry.maxAttempts; attempt++) {
      try {
        const response = await fetch(`${paypalConfig.baseUrl}/v1/oauth2/token`, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Accept': 'application/json',
            'Accept-Language': 'en_US',
            'Content-Type': 'application/x-www-form-urlencoded',
            'PayPal-Request-Id': correlationId,
          },
          body: 'grant_type=client_credentials',
          signal: AbortSignal.timeout(paypalConfig.timeouts.oauth)
        });

        if (!response.ok) {
          const error = await response.text();
          throw new Error(`PayPal OAuth failed [${response.status}]: ${error}`);
        }

        const data: PayPalAccessTokenResponse = await response.json();
        
        // Cache token with 5 minute buffer
        this.accessToken = data.access_token;
        this.tokenExpiresAt = Date.now() + (data.expires_in - 300) * 1000;
        
        logger.info("PayPal: Access token obtained successfully", { 
          correlationId,
          expiresIn: data.expires_in 
        });
        
        return this.accessToken;

      } catch (error: any) {
        lastError = error;
        logger.warn(`PayPal: OAuth attempt ${attempt} failed`, { 
          correlationId, 
          error: error.message,
          attempt 
        });

        if (attempt < paypalConfig.retry.maxAttempts) {
          const delay = Math.min(
            paypalConfig.retry.backoffMs * Math.pow(2, attempt - 1),
            paypalConfig.retry.maxBackoffMs
          );
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    logger.paypal.error("Failed to obtain access token after retries", lastError!, { correlationId });
    throw lastError;
  }

  /**
   * Make authenticated request to PayPal API with retry and timeout
   */
  private async makeRequest<T>(
    endpoint: string, 
    options: RequestInit = {},
    correlationId?: string
  ): Promise<T> {
    const reqId = correlationId || logger.generateCorrelationId();
    const token = await this.getAccessToken();
    
    logger.debug(`PayPal API: ${options.method || 'GET'} ${endpoint}`, { correlationId: reqId });

    const response = await fetch(`${paypalConfig.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'PayPal-Request-Id': reqId,
        ...options.headers,
      },
      signal: AbortSignal.timeout(paypalConfig.timeouts.api)
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.paypal.error(
        `API request failed: ${options.method || 'GET'} ${endpoint}`, 
        new Error(errorText),
        { correlationId: reqId, status: response.status }
      );
      throw new Error(`PayPal API failed [${response.status}]: ${errorText}`);
    }

    const data = await response.json();
    logger.debug(`PayPal API: ${endpoint} completed successfully`, { correlationId: reqId });
    
    return data;
  }

  /**
   * Get subscription details from PayPal
   */
  async getSubscription(subscriptionId: string, correlationId?: string): Promise<PayPalSubscription> {
    return this.makeRequest<PayPalSubscription>(
      `/v1/billing/subscriptions/${subscriptionId}`,
      { method: 'GET' },
      correlationId
    );
  }

  /**
   * Verify webhook signature using PayPal's verification API
   */
  async verifyWebhookSignature(
    webhookId: string,
    headers: Record<string, string>,
    body: string
  ): Promise<boolean> {
    try {
      // Extract required headers
      const transmissionId = headers['paypal-transmission-id'];
      const certId = headers['paypal-cert-id'];
      const transmissionSig = headers['paypal-transmission-sig'];
      const transmissionTime = headers['paypal-transmission-time'];
      const authAlgo = headers['paypal-auth-algo'] || 'SHA256withRSA';

      // Validate required headers exist
      if (!transmissionId || !certId || !transmissionSig || !transmissionTime) {
        logger.warn('PayPal webhook: Missing required signature headers', {
          hasTransmissionId: !!transmissionId,
          hasCertId: !!certId,
          hasTransmissionSig: !!transmissionSig,
          hasTransmissionTime: !!transmissionTime
        });
        return false;
      }

      // Parse webhook event for verification
      let webhookEvent: PayPalWebhookEvent;
      try {
        webhookEvent = JSON.parse(body);
      } catch {
        logger.warn('PayPal webhook: Invalid JSON body for verification');
        return false;
      }

      const verificationRequest: PayPalWebhookVerificationRequest = {
        auth_algo: authAlgo,
        cert_id: certId,
        transmission_id: transmissionId,
        transmission_sig: transmissionSig,
        transmission_time: transmissionTime,
        webhook_id: webhookId,
        webhook_event: webhookEvent
      };

      const response = await this.makeRequest<PayPalWebhookVerificationResponse>(
        '/v1/notifications/verify-webhook-signature',
        {
          method: 'POST',
          body: JSON.stringify(verificationRequest)
        },
        webhookEvent.id
      );

      const isValid = response.verification_status === 'SUCCESS';
      
      logger.paypal.webhook(
        webhookEvent.id,
        webhookEvent.event_type,
        `Signature verification ${isValid ? 'passed' : 'failed'}`,
        { verificationStatus: response.verification_status }
      );

      return isValid;

    } catch (error: any) {
      logger.paypal.error('Webhook signature verification failed', error);
      return false;
    }
  }

  /**
   * Parse PayPal webhook event with validation
   */
  parseWebhookEvent(body: string): PayPalWebhookEvent {
    try {
      const event = JSON.parse(body);
      
      // Basic validation
      if (!event.id || !event.event_type || !event.resource) {
        throw new Error('Invalid webhook event structure');
      }

      // Check if we support this event type
      if (!paypalConfig.supportedEvents.includes(event.event_type)) {
        logger.warn(`PayPal webhook: Unsupported event type: ${event.event_type}`, {
          eventId: event.id
        });
      }

      return event as PayPalWebhookEvent;
    } catch (error) {
      logger.paypal.error('Failed to parse webhook event', error as Error);
      throw new Error('Invalid webhook payload');
    }
  }

  /**
   * Health check for PayPal service
   */
  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy', details: any }> {
    try {
      await this.getAccessToken();
      return { 
        status: 'healthy', 
        details: { 
          mode: paypalConfig.mode,
          tokenCached: !!this.accessToken,
          tokenExpiresAt: this.tokenExpiresAt
        } 
      };
    } catch (error: any) {
      return { 
        status: 'unhealthy', 
        details: { error: error.message } 
      };
    }
  }

  /**
   * Get environment configuration (safe for logging)
   */
  getEnvironment() {
    return {
      mode: paypalConfig.mode,
      baseUrl: paypalConfig.baseUrl,
      supportedEvents: paypalConfig.supportedEvents.length,
      timeouts: paypalConfig.timeouts
    };
  }
}

export const paypalService = new PayPalService();
