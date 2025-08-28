import { NextRequest, NextResponse } from "next/server";
import { paypalService } from "./paypal.service";
import { PayPalMapper } from "./paypal.mapper";
import { paypalConfig } from "@/config/paypal";
import { logger } from "@/lib/logger";
import { prisma } from "@/core/database/db";
import type { PayPalWebhookEvent } from "./paypal.types";

/**
 * PayPal webhook controller with idempotency and proper error handling
 */
export async function handlePayPalWebhook(request: NextRequest): Promise<NextResponse> {
  let correlationId: string | undefined;
  let eventType: string | undefined;

  try {
    // Get raw body for signature verification
    const body = await request.text();
    const headers = Object.fromEntries(request.headers.entries());

    logger.debug("PayPal webhook received", {
      bodyLength: body.length,
      hasSignature: !!headers['paypal-transmission-sig']
    });

    // Verify webhook signature
    const isValid = await paypalService.verifyWebhookSignature(
      paypalConfig.webhookId,
      headers,
      body
    );

    if (!isValid) {
      logger.warn("PayPal webhook signature verification failed", {
        transmissionId: headers['paypal-transmission-id']
      });
      
      return NextResponse.json(
        { error: "Invalid webhook signature" },
        { status: 401 }
      );
    }

    // Parse webhook event
    let event: PayPalWebhookEvent;
    try {
      event = paypalService.parseWebhookEvent(body);
      correlationId = event.id;
      eventType = event.event_type;
    } catch (error) {
      logger.paypal.error("Invalid webhook payload", error as Error);
      return NextResponse.json(
        { error: "Invalid webhook payload" },
        { status: 400 }
      );
    }

    // Check idempotency - have we already processed this event?
    const existingWebhook = await prisma.webhookEvent.findFirst({
      where: {
        provider: "paypal",
        providerEventId: event.id
      }
    });

    if (existingWebhook) {
      logger.paypal.webhook(
        event.id,
        event.event_type,
        "Event already processed (idempotent)",
        { processedAt: existingWebhook.processedAt }
      );
      
      return NextResponse.json({ 
        message: "Event already processed" 
      });
    }

    // Store webhook event record
    const webhookRecord = await prisma.webhookEvent.create({
      data: {
        provider: "paypal",
        providerEventId: event.id,
        eventType: event.event_type,
        resourceType: event.resource_type,
        resourceId: event.resource.id,
        data: event as any,
        processed: false
      }
    });

    // Process the event
    try {
      await processWebhookEvent(event);

      // Mark as processed
      await prisma.webhookEvent.update({
        where: { id: webhookRecord.id },
        data: {
          processed: true,
          processedAt: new Date()
        }
      });

      logger.paypal.webhook(
        event.id,
        event.event_type,
        "Event processed successfully"
      );

      return NextResponse.json({ 
        message: "Webhook processed successfully" 
      });

    } catch (error: any) {
      // Update webhook record with error
      await prisma.webhookEvent.update({
        where: { id: webhookRecord.id },
        data: {
          errorMessage: error.message,
          retryCount: { increment: 1 }
        }
      });

      logger.paypal.error(
        "Webhook processing failed",
        error,
        { 
          correlationId,
          eventType,
          webhookRecordId: webhookRecord.id 
        }
      );

      return NextResponse.json(
        { error: "Webhook processing failed" },
        { status: 500 }
      );
    }

  } catch (error: any) {
    logger.paypal.error(
      "Webhook handler error",
      error,
      { correlationId, eventType }
    );
    
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Route event to appropriate handler
 */
async function processWebhookEvent(event: PayPalWebhookEvent): Promise<void> {
  switch (event.event_type) {
    case "BILLING.SUBSCRIPTION.ACTIVATED":
      await PayPalMapper.handleSubscriptionActivated(event);
      break;

    case "BILLING.SUBSCRIPTION.CANCELLED":
      await PayPalMapper.handleSubscriptionCancelled(event);
      break;

    case "BILLING.SUBSCRIPTION.SUSPENDED":
      await PayPalMapper.handleSubscriptionSuspended(event);
      break;

    case "BILLING.SUBSCRIPTION.EXPIRED":
      // Handle similar to cancellation
      await PayPalMapper.handleSubscriptionCancelled(event);
      break;

    case "PAYMENT.SALE.COMPLETED":
    case "PAYMENT.CAPTURE.COMPLETED":
      await PayPalMapper.handlePaymentCompleted(event);
      break;

    case "PAYMENT.SALE.DENIED":
    case "PAYMENT.CAPTURE.DENIED":
      await PayPalMapper.handlePaymentFailed(event);
      break;

    default:
      logger.warn(`Unhandled PayPal webhook event: ${event.event_type}`, {
        correlationId: event.id
      });
      // Don't throw error for unsupported events
      break;
  }
}
