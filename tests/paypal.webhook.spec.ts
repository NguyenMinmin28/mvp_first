/**
 * PayPal webhook integration tests
 * Tests the critical scenarios from the DoD checklist
 */

import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { prisma } from '../src/core/database/db';
import { handlePayPalWebhook } from '../src/modules/paypal/paypal.controller';
import { NextRequest } from 'next/server';

// Mock PayPal webhook events
const mockSubscriptionActivatedEvent = {
  id: "WH-2WR32451HC0233532-67976317FL4543714",
  event_type: "BILLING.SUBSCRIPTION.ACTIVATED",
  event_version: "1.0",
  create_time: "2023-01-01T10:00:00Z",
  resource_type: "subscription",
  resource_version: "2.0",
  summary: "Subscription activated",
  resource: {
    id: "I-BW452GLLEP1G",
    status: "ACTIVE",
    plan_id: "P-5ML4271244454362WXNWU5NQ",
    billing_info: {
      outstanding_balance: { currency_code: "USD", value: "0.00" },
      cycle_executions: [],
      next_billing_time: "2023-02-01T10:00:00Z"
    }
  },
  links: []
};

const mockDuplicateEvent = { ...mockSubscriptionActivatedEvent };

const mockSubscriptionCancelledEvent = {
  ...mockSubscriptionActivatedEvent,
  id: "WH-CANCELLED-123",
  event_type: "BILLING.SUBSCRIPTION.CANCELLED",
  summary: "Subscription cancelled",
  resource: {
    ...mockSubscriptionActivatedEvent.resource,
    status: "CANCELLED"
  }
};

describe('PayPal Webhook Handler', () => {
  let testSubscription: any;

  beforeEach(async () => {
    // Clean up test data
    await prisma.webhookEvent.deleteMany({ 
      where: { providerEventId: { startsWith: "WH-" } } 
    });
    
    // Create test subscription
    testSubscription = await prisma.subscription.create({
      data: {
        clientId: "test-client-id",
        packageId: "test-package-id", 
        provider: "paypal",
        providerSubscriptionId: "I-BW452GLLEP1G",
        status: "past_due",
        startAt: new Date(),
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      }
    });
  });

  afterEach(async () => {
    // Cleanup
    await prisma.webhookEvent.deleteMany({
      where: { providerEventId: { startsWith: "WH-" } }
    });
    await prisma.subscription.deleteMany({
      where: { id: testSubscription?.id }
    });
  });

  describe('Happy Path', () => {
    test('should activate subscription on ACTIVATED webhook', async () => {
      const request = createMockRequest(mockSubscriptionActivatedEvent);
      
      const response = await handlePayPalWebhook(request);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.message).toBe("Webhook processed successfully");

      // Verify subscription was activated
      const updatedSubscription = await prisma.subscription.findUnique({
        where: { id: testSubscription.id }
      });
      
      expect(updatedSubscription?.status).toBe("active");

      // Verify webhook event was recorded
      const webhookEvent = await prisma.webhookEvent.findFirst({
        where: { providerEventId: mockSubscriptionActivatedEvent.id }
      });
      
      expect(webhookEvent).toBeTruthy();
      expect(webhookEvent?.processed).toBe(true);
    });
  });

  describe('Idempotency', () => {
    test('should handle duplicate webhooks gracefully', async () => {
      // First webhook
      const request1 = createMockRequest(mockSubscriptionActivatedEvent);
      const response1 = await handlePayPalWebhook(request1);
      expect(response1.status).toBe(200);

      // Duplicate webhook with same ID
      const request2 = createMockRequest(mockDuplicateEvent);
      const response2 = await handlePayPalWebhook(request2);
      const result2 = await response2.json();

      expect(response2.status).toBe(200);
      expect(result2.message).toBe("Event already processed");

      // Verify only one webhook record exists
      const webhookEvents = await prisma.webhookEvent.findMany({
        where: { providerEventId: mockSubscriptionActivatedEvent.id }
      });
      
      expect(webhookEvents).toHaveLength(1);
    });
  });

  describe('State Transitions', () => {
    test('should handle cancellation correctly', async () => {
      // First activate
      const activateRequest = createMockRequest(mockSubscriptionActivatedEvent);
      await handlePayPalWebhook(activateRequest);

      // Then cancel
      const cancelRequest = createMockRequest(mockSubscriptionCancelledEvent);
      const response = await handlePayPalWebhook(cancelRequest);
      
      expect(response.status).toBe(200);

      // Verify subscription was marked for cancellation
      const updatedSubscription = await prisma.subscription.findUnique({
        where: { id: testSubscription.id }
      });
      
      expect(updatedSubscription?.cancelAtPeriodEnd).toBe(true);
      expect(updatedSubscription?.canceledAt).toBeTruthy();
    });
  });

  describe('Error Handling', () => {
    test('should reject invalid webhook signature', async () => {
      const request = createMockRequest(mockSubscriptionActivatedEvent, {
        'paypal-transmission-sig': 'invalid-signature'
      });

      const response = await handlePayPalWebhook(request);
      expect(response.status).toBe(401);
      
      const result = await response.json();
      expect(result.error).toBe("Invalid webhook signature");
    });

    test('should handle malformed webhook payload', async () => {
      const request = new NextRequest('http://localhost:3000/api/paypal/webhook', {
        method: 'POST',
        body: 'invalid-json',
        headers: createValidHeaders()
      });

      const response = await handlePayPalWebhook(request);
      expect(response.status).toBe(400);
    });

    test('should record errors and allow retry', async () => {
      // Mock an event that will cause processing error
      const invalidEvent = {
        ...mockSubscriptionActivatedEvent,
        resource: { id: "non-existent-subscription" }
      };
      
      const request = createMockRequest(invalidEvent);
      const response = await handlePayPalWebhook(request);
      
      expect(response.status).toBe(500);

      // Verify error was recorded
      const webhookEvent = await prisma.webhookEvent.findFirst({
        where: { providerEventId: invalidEvent.id }
      });
      
      expect(webhookEvent?.processed).toBe(false);
      expect(webhookEvent?.errorMessage).toBeTruthy();
      expect(webhookEvent?.retryCount).toBe(1);
    });
  });

  describe('Usage Quota Integration', () => {
    test('should reset usage when subscription activates', async () => {
      // This would require integration with billing service
      // Implementation depends on your specific usage tracking logic
      const request = createMockRequest(mockSubscriptionActivatedEvent);
      
      const response = await handlePayPalWebhook(request);
      expect(response.status).toBe(200);

      // Verify usage was reset (test implementation needed)
      // const usage = await billingService.getCurrentPeriodUsage(testSubscription.id);
      // expect(usage.projectsPostedCount).toBe(0);
    });
  });
});

// Helper functions
function createMockRequest(event: any, customHeaders: Record<string, string> = {}) {
  const headers = {
    ...createValidHeaders(),
    ...customHeaders
  };

  return new NextRequest('http://localhost:3000/api/paypal/webhook', {
    method: 'POST',
    body: JSON.stringify(event),
    headers
  });
}

function createValidHeaders(): Record<string, string> {
  return {
    'content-type': 'application/json',
    'paypal-transmission-id': 'test-transmission-id',
    'paypal-cert-id': 'test-cert-id', 
    'paypal-transmission-sig': 'valid-signature',
    'paypal-transmission-time': new Date().toISOString(),
    'paypal-auth-algo': 'SHA256withRSA'
  };
}

// Mock PayPal service verification
jest.mock('../src/modules/paypal/paypal.service', () => ({
  paypalService: {
    verifyWebhookSignature: jest.fn().mockImplementation(
      (webhookId: string, headers: any, body: string) => {
        // Simple mock - consider signature valid unless explicitly invalid
        return Promise.resolve(headers['paypal-transmission-sig'] !== 'invalid-signature');
      }
    ),
    parseWebhookEvent: jest.fn().mockImplementation((body: string) => {
      return JSON.parse(body);
    })
  }
}));
