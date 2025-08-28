import { billingService } from "@/modules/billing/billing.service";
import { logger } from "@/lib/logger";
import { prisma } from "@/core/database/db";
import type { PayPalWebhookEvent } from "./paypal.types";
import { PAYPAL_STATUS_MAP } from "./paypal.types";

/**
 * Maps PayPal webhook events to domain updates
 */
export class PayPalMapper {

  /**
   * Handle subscription activation
   */
  static async handleSubscriptionActivated(event: PayPalWebhookEvent): Promise<void> {
    const subscription = event.resource;
    const correlationId = event.id;

    logger.paypal.subscription(
      subscription.id,
      "Processing activation",
      { correlationId, planId: subscription.plan_id }
    );

    // Find the subscription in our database
    const dbSubscription = await prisma.subscription.findFirst({
      where: {
        provider: "paypal",
        providerSubscriptionId: subscription.id
      },
      include: {
        package: true
      }
    });

    if (!dbSubscription) {
      logger.warn(`Subscription not found in database: ${subscription.id}`, { correlationId });
      return;
    }

    // Update subscription status and period info
    await prisma.subscription.update({
      where: { id: dbSubscription.id },
      data: {
        status: "active",
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        cancelAtPeriodEnd: false
      }
    });

    // Reset usage for new period
    await billingService.resetUsageForNewPeriod(
      dbSubscription.id,
      new Date(),
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    );

    logger.paypal.subscription(
      subscription.id,
      "Activated successfully",
      { correlationId, subscriptionId: dbSubscription.id }
    );
  }

  /**
   * Handle subscription cancellation
   */
  static async handleSubscriptionCancelled(event: PayPalWebhookEvent): Promise<void> {
    const subscription = event.resource;
    const correlationId = event.id;

    logger.paypal.subscription(
      subscription.id,
      "Processing cancellation",
      { correlationId }
    );

    const dbSubscription = await prisma.subscription.findFirst({
      where: {
        provider: "paypal",
        providerSubscriptionId: subscription.id
      }
    });

    if (!dbSubscription) {
      logger.warn(`Subscription not found for cancellation: ${subscription.id}`, { correlationId });
      return;
    }

    // Update subscription to cancel at period end
    await prisma.subscription.update({
      where: { id: dbSubscription.id },
      data: {
        cancelAtPeriodEnd: true,
        canceledAt: new Date(),
        cancelReason: "user_cancelled"
      }
    });

    logger.paypal.subscription(
      subscription.id,
      "Marked for cancellation at period end",
      { correlationId, subscriptionId: dbSubscription.id }
    );
  }

  /**
   * Handle subscription suspension (payment failed)
   */
  static async handleSubscriptionSuspended(event: PayPalWebhookEvent): Promise<void> {
    const subscription = event.resource;
    const correlationId = event.id;

    logger.paypal.subscription(
      subscription.id,
      "Processing suspension",
      { correlationId }
    );

    const dbSubscription = await prisma.subscription.findFirst({
      where: {
        provider: "paypal",
        providerSubscriptionId: subscription.id
      }
    });

    if (!dbSubscription) {
      logger.warn(`Subscription not found for suspension: ${subscription.id}`, { correlationId });
      return;
    }

    // Update subscription status to past_due
    await prisma.subscription.update({
      where: { id: dbSubscription.id },
      data: {
        status: "past_due"
      }
    });

    logger.paypal.subscription(
      subscription.id,
      "Suspended due to payment failure",
      { correlationId, subscriptionId: dbSubscription.id }
    );
  }

  /**
   * Handle successful payment
   */
  static async handlePaymentCompleted(event: PayPalWebhookEvent): Promise<void> {
    const payment = event.resource;
    const correlationId = event.id;

    logger.paypal.payment(
      payment.id,
      "Processing payment completion",
      { correlationId, amount: payment.amount?.value || payment.amount?.total }
    );

    // Find subscription
    const subscriptionId = payment.billing_agreement_id || payment.subscription_id;
    if (!subscriptionId) {
      logger.warn(`No subscription ID found in payment: ${payment.id}`, { correlationId });
      return;
    }

    const dbSubscription = await prisma.subscription.findFirst({
      where: {
        provider: "paypal",
        providerSubscriptionId: subscriptionId
      }
    });

    if (!dbSubscription) {
      logger.warn(`Subscription not found for payment: ${payment.id}`, { correlationId });
      return;
    }

    // Check if payment already exists
    const existingPayment = await prisma.payment.findFirst({
      where: {
        provider: "paypal",
        providerPaymentId: payment.id
      }
    });

    if (existingPayment) {
      logger.warn(`Payment already recorded: ${payment.id}`, { correlationId });
      return;
    }

    // Create payment record
    await prisma.payment.create({
      data: {
        subscriptionId: dbSubscription.id,
        clientId: dbSubscription.clientId,
        provider: "paypal",
        providerPaymentId: payment.id,
        amount: parseFloat(payment.amount?.value || payment.amount?.total || "0"),
        currency: payment.amount?.currency_code || payment.amount?.currency || "USD",
        status: "captured",
        capturedAt: new Date(),
        metadata: payment
      }
    });

    // If subscription was suspended, reactivate it
    if (dbSubscription.status === "past_due") {
      await prisma.subscription.update({
        where: { id: dbSubscription.id },
        data: {
          status: "active"
        }
      });

      logger.paypal.subscription(
        subscriptionId,
        "Reactivated after successful payment",
        { correlationId, paymentId: payment.id }
      );
    }

    logger.paypal.payment(
      payment.id,
      "Payment recorded successfully",
      { 
        correlationId, 
        subscriptionId: dbSubscription.id,
        amount: payment.amount?.value || payment.amount?.total 
      }
    );
  }

  /**
   * Handle payment failure
   */
  static async handlePaymentFailed(event: PayPalWebhookEvent): Promise<void> {
    const payment = event.resource;
    const correlationId = event.id;

    logger.paypal.payment(
      payment.id,
      "Processing payment failure",
      { correlationId }
    );

    // Find subscription and mark as past_due
    const subscriptionId = payment.billing_agreement_id || payment.subscription_id;
    if (!subscriptionId) {
      logger.warn(`No subscription ID found in failed payment: ${payment.id}`, { correlationId });
      return;
    }

    const dbSubscription = await prisma.subscription.findFirst({
      where: {
        provider: "paypal",
        providerSubscriptionId: subscriptionId
      }
    });

    if (!dbSubscription) {
      logger.warn(`Subscription not found for failed payment: ${payment.id}`, { correlationId });
      return;
    }

    // Update subscription status
    await prisma.subscription.update({
      where: { id: dbSubscription.id },
      data: {
        status: "past_due"
      }
    });

    // Record failed payment
    await prisma.payment.create({
      data: {
        subscriptionId: dbSubscription.id,
        clientId: dbSubscription.clientId,
        provider: "paypal",
        providerPaymentId: payment.id,
        amount: parseFloat(payment.amount?.value || payment.amount?.total || "0"),
        currency: payment.amount?.currency_code || payment.amount?.currency || "USD",
        status: "failed",
        failedAt: new Date(),
        metadata: payment
      }
    });

    logger.paypal.payment(
      payment.id,
      "Payment failure recorded",
      { correlationId, subscriptionId: dbSubscription.id }
    );
  }
}
