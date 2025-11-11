import { prisma } from "@/core/database/db";
import { paypalService } from "@/modules/paypal/paypal.service";
import { logger } from "@/lib/logger";
import { PAYPAL_STATUS_MAP } from "@/modules/paypal/paypal.types";
import type { PayPalSubscription } from "@/modules/paypal/paypal.types";

/**
 * Reconciliation job to sync subscription states between PayPal and our database
 * Should be run periodically (every 5 minutes for better real-time sync)
 */
export class ReconciliationJob {

  /**
   * Reconcile all active subscriptions
   */
  static async reconcileAllSubscriptions(): Promise<{
    processed: number;
    updated: number;
    errors: number;
  }> {
    const correlationId = logger.generateCorrelationId();
    
    logger.info("Starting subscription reconciliation", { correlationId });

    let processed = 0;
    let updated = 0;
    let errors = 0;

    try {
      // Get all non-cancelled subscriptions from last 30 days
      // Skip internal subscriptions (basic-*, internal-*) that don't have real PayPal subscription IDs
      const subscriptions = await prisma.subscription.findMany({
        where: {
          provider: "paypal",
          status: {
            in: ["active", "past_due"]
          },
          updatedAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
          },
          // Only reconcile subscriptions with real PayPal subscription IDs
          // PayPal subscription IDs typically start with "I-" or "SUB_I-"
          // Skip internal subscriptions that start with "basic-" or "internal-"
          providerSubscriptionId: {
            not: {
              startsWith: "basic-"
            }
          }
        },
        include: {
          package: true
        }
      });

      logger.info(`Found ${subscriptions.length} subscriptions to reconcile`, { correlationId });

      // Process in batches to avoid overwhelming PayPal API
      const batchSize = 10;
      for (let i = 0; i < subscriptions.length; i += batchSize) {
        const batch = subscriptions.slice(i, i + batchSize);
        
        await Promise.allSettled(
          batch.map(async (subscription: any) => {
            try {
              processed++;
              const wasUpdated = await this.reconcileSubscription(subscription.providerSubscriptionId, correlationId);
              if (wasUpdated) updated++;
            } catch (error) {
              errors++;
              logger.error(
                `Failed to reconcile subscription ${subscription.providerSubscriptionId}`,
                error as Error,
                { correlationId, subscriptionId: subscription.id }
              );
            }
          })
        );

        // Rate limiting - wait between batches
        if (i + batchSize < subscriptions.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

    } catch (error) {
      const errorDetails = {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        correlationId
      };
      
      logger.error("Reconciliation job failed", error as Error, { correlationId });
      
      // Create detailed error record
      try {
        await (prisma as any).cronRun.create({
          data: {
            job: "reconcile-subscriptions",
            status: "failed",
            success: false,
            details: errorDetails
          }
        });
      } catch (dbError) {
        logger.error("Failed to create error record", dbError as Error, { correlationId });
      }
      
      throw error;
    }

    const result = { processed, updated, errors };
    
    logger.info("Subscription reconciliation completed", { 
      correlationId,
      ...result
    });

    return result;
  }

  /**
   * Reconcile a single subscription
   */
  static async reconcileSubscription(
    providerSubscriptionId: string, 
    correlationId?: string
  ): Promise<boolean> {
    const reqId = correlationId || logger.generateCorrelationId();
    
    // Skip internal subscriptions that don't have real PayPal subscription IDs
    if (providerSubscriptionId.startsWith("basic-") || providerSubscriptionId.startsWith("internal-")) {
      logger.debug(`Skipping reconciliation for internal subscription: ${providerSubscriptionId}`, { correlationId: reqId });
      return false;
    }
    
    try {
      // Get current state from PayPal
      const paypalSubscription = await paypalService.getSubscription(providerSubscriptionId, reqId);
      
      // Get current state from our database
      const dbSubscription = await prisma.subscription.findFirst({
        where: {
          provider: "paypal",
          providerSubscriptionId
        }
      });

      if (!dbSubscription) {
        logger.warn(`Subscription not found in database: ${providerSubscriptionId}`, { correlationId: reqId });
        return false;
      }

      // Check if states are different
      const paypalStatus = PAYPAL_STATUS_MAP[paypalSubscription.status as keyof typeof PAYPAL_STATUS_MAP] || "canceled";
      const needsUpdate = this.needsUpdate(dbSubscription, paypalSubscription, paypalStatus);

      if (!needsUpdate) {
        logger.debug(`Subscription ${providerSubscriptionId} is in sync`, { correlationId: reqId });
        return false;
      }

      // Update database to match PayPal
      const updates = this.calculateUpdates(dbSubscription, paypalSubscription, paypalStatus);
      
      await prisma.subscription.update({
        where: { id: dbSubscription.id },
        data: updates
      });

      logger.info(`Reconciled subscription ${providerSubscriptionId}`, {
        correlationId: reqId,
        subscriptionId: dbSubscription.id,
        changes: updates
      });

      return true;

    } catch (error: any) {
      logger.error(
        `Failed to reconcile subscription ${providerSubscriptionId}`,
        error,
        { correlationId: reqId }
      );
      throw error;
    }
  }

  /**
   * Check if subscription needs update
   */
  private static needsUpdate(
    dbSubscription: any,
    paypalSubscription: PayPalSubscription,
    paypalStatus: string
  ): boolean {
    // Status mismatch
    if (dbSubscription.status !== paypalStatus) {
      return true;
    }

    // Billing info mismatch  
    const nextBillingTime = paypalSubscription.billing_info.next_billing_time;
    if (nextBillingTime) {
      const paypalNextBilling = new Date(nextBillingTime);
      const dbNextBilling = new Date(dbSubscription.currentPeriodEnd);
      
      // Allow 1 hour tolerance for billing time differences
      const timeDiff = Math.abs(paypalNextBilling.getTime() - dbNextBilling.getTime());
      if (timeDiff > 60 * 60 * 1000) {
        return true;
      }
    }

    return false;
  }

  /**
   * Calculate what updates need to be made
   */
  private static calculateUpdates(
    dbSubscription: any,
    paypalSubscription: PayPalSubscription,
    paypalStatus: string
  ) {
    const updates: any = {};

    // Update status
    if (dbSubscription.status !== paypalStatus) {
      updates.status = paypalStatus;
    }

    // Update billing period
    const nextBillingTime = paypalSubscription.billing_info.next_billing_time;
    if (nextBillingTime) {
      const paypalNextBilling = new Date(nextBillingTime);
      const dbNextBilling = new Date(dbSubscription.currentPeriodEnd);
      
      const timeDiff = Math.abs(paypalNextBilling.getTime() - dbNextBilling.getTime());
      if (timeDiff > 60 * 60 * 1000) {
        updates.currentPeriodEnd = paypalNextBilling;
        
        // Calculate period start (assuming monthly billing)
        const periodStart = new Date(paypalNextBilling);
        periodStart.setMonth(periodStart.getMonth() - 1);
        updates.currentPeriodStart = periodStart;
      }
    }

    // Mark as updated
    updates.updatedAt = new Date();

    return updates;
  }

  /**
   * Health check for reconciliation system
   */
  static async healthCheck(): Promise<{
    status: "healthy" | "degraded" | "unhealthy";
    details: any;
  }> {
    try {
      // Check for recent reconciliation activity
      const recentWebhooks = await prisma.webhookEvent.count({
        where: {
          provider: "paypal",
          receivedAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
          }
        }
      });

      // Check for failed webhooks
      const failedWebhooks = await prisma.webhookEvent.count({
        where: {
          provider: "paypal",
          processed: false,
          retryCount: {
            gte: 3
          },
          receivedAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
          }
        }
      });

      // Check PayPal service health
      const paypalHealth = await paypalService.healthCheck();

      const status = paypalHealth.status === "healthy" && failedWebhooks === 0 
        ? "healthy"
        : failedWebhooks > 0 
          ? "degraded" 
          : "unhealthy";

      return {
        status,
        details: {
          recentWebhooks,
          failedWebhooks,
          paypalService: paypalHealth,
          lastChecked: new Date()
        }
      };

    } catch (error) {
      return {
        status: "unhealthy",
        details: {
          error: error instanceof Error ? error.message : String(error),
          lastChecked: new Date()
        }
      };
    }
  }
}
