import { prisma } from "@/core/database/db";
import { logger } from "@/lib/logger";
// @ts-nocheck
import type { Package, Subscription, SubscriptionUsage } from "@prisma/client";

export interface BillingQuotas {
  projectsPerMonth: number;
  contactClicksPerProject: number;
  projectsUsed: number;
  contactClicksUsed: Record<string, number>; // projectId -> clicks
}

export interface QuotaCheckResult {
  allowed: boolean;
  reason?: string;
  remaining?: {
    projects: number;
    contactClicks: number;
  };
}

/**
 * Billing service for quota management and subscription handling
 */
class BillingService {
  
  /**
   * Get active subscription for user with package details
   */
  async getActiveSubscription(clientId: string): Promise<(Subscription & { package: Package }) | null> {
    const subscription = await prisma.subscription.findFirst({
      where: {
        clientId,
        status: "active",
        currentPeriodEnd: {
          gte: new Date()
        }
      },
      include: {
        package: true
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    return subscription;
  }

  /**
   * Get current period usage for a subscription
   */
  async getCurrentPeriodUsage(subscriptionId: string, periodStart: Date, periodEnd: Date): Promise<SubscriptionUsage | null> {
    return prisma.subscriptionUsage.findFirst({
      where: {
        subscriptionId,
        periodStart: {
          lte: periodStart
        },
        periodEnd: {
          gte: periodEnd
        }
      }
    });
  }

  /**
   * Get or create current period usage
   */
  async getOrCreateCurrentUsage(subscriptionId: string): Promise<SubscriptionUsage> {
    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId }
    });

    if (!subscription) {
      throw new Error(`Subscription not found: ${subscriptionId}`);
    }

    // Find existing usage for current period
    let usage = await prisma.subscriptionUsage.findFirst({
      where: {
        subscriptionId,
        periodStart: {
          lte: subscription.currentPeriodStart
        },
        periodEnd: {
          gte: subscription.currentPeriodEnd
        }
      }
    });

    if (!usage) {
      // Create new usage record for current period
      usage = await prisma.subscriptionUsage.create({
        data: {
          subscriptionId,
          periodStart: subscription.currentPeriodStart,
          periodEnd: subscription.currentPeriodEnd,
          projectsPostedCount: 0,
          contactClicksByProject: {}
        }
      });

      logger.billing.usage(subscriptionId, "Created new usage period", {
        periodStart: subscription.currentPeriodStart,
        periodEnd: subscription.currentPeriodEnd
      });
    }

    return usage;
  }

  /**
   * Check if user can post a new project
   */
  async canPostProject(clientId: string): Promise<QuotaCheckResult> {
    const subscription = await this.getActiveSubscription(clientId);
    
    if (!subscription) {
      return {
        allowed: false,
        reason: "No active subscription found"
      };
    }

    const usage = await this.getOrCreateCurrentUsage(subscription.id);

    // Promotions removed: always use paid monthly project limit
    const projectLimit = subscription.package.projectsPerMonth;

    const remaining = projectLimit - usage.projectsPostedCount;

    const allowed = remaining > 0;
    
    logger.billing.quota(
      clientId, 
      "post-project", 
      allowed ? "allowed" : "denied",
      {
        subscriptionId: subscription.id,
        packageName: subscription.package.name,
        limit: projectLimit,
        used: usage.projectsPostedCount,
        remaining
      }
    );

    return {
      allowed,
      reason: allowed ? undefined : "Monthly project limit reached",
      remaining: {
        projects: Math.max(0, remaining),
        contactClicks: subscription.package.contactClicksPerProject
      }
    };
  }

  /**
   * Check if user can reveal contact for a project
   */
  async canRevealContact(clientId: string, projectId: string): Promise<QuotaCheckResult> {
    const subscription = await this.getActiveSubscription(clientId);
    
    if (!subscription) {
      return {
        allowed: false,
        reason: "No active subscription found"
      };
    }

    const usage = await this.getOrCreateCurrentUsage(subscription.id);
    const contactClicks = usage.contactClicksByProject as Record<string, number>;
    const currentClicks = contactClicks[projectId] || 0;
    const remaining = subscription.package.contactClicksPerProject - currentClicks;

    const allowed = remaining > 0;

    logger.billing.quota(
      clientId,
      "reveal-contact", 
      allowed ? "allowed" : "denied",
      {
        subscriptionId: subscription.id,
        projectId,
        packageName: subscription.package.name,
        limit: subscription.package.contactClicksPerProject,
        used: currentClicks,
        remaining
      }
    );

    return {
      allowed,
      reason: allowed ? undefined : "Contact reveal limit reached for this project",
      remaining: {
        projects: subscription.package.projectsPerMonth,
        contactClicks: Math.max(0, remaining)
      }
    };
  }

  /**
   * Increment project post count
   */
  async incrementProjectUsage(clientId: string): Promise<void> {
    const subscription = await this.getActiveSubscription(clientId);
    
    if (!subscription) {
      throw new Error("No active subscription found");
    }

    const usage = await this.getOrCreateCurrentUsage(subscription.id);

    await prisma.subscriptionUsage.update({
      where: { id: usage.id },
      data: {
        projectsPostedCount: {
          increment: 1
        }
      }
    });

    logger.billing.usage(subscription.id, "Incremented project usage", {
      previousCount: usage.projectsPostedCount,
      newCount: usage.projectsPostedCount + 1,
      clientId
    });

    // Promotions removed: no trial state transitions
  }

  /**
   * Increment contact reveal count for a project
   */
  async incrementContactRevealUsage(clientId: string, projectId: string): Promise<void> {
    const subscription = await this.getActiveSubscription(clientId);
    
    if (!subscription) {
      throw new Error("No active subscription found");
    }

    const usage = await this.getOrCreateCurrentUsage(subscription.id);
    const contactClicks = usage.contactClicksByProject as Record<string, number>;
    const currentClicks = (contactClicks[projectId] || 0) + 1;

    await prisma.subscriptionUsage.update({
      where: { id: usage.id },
      data: {
        contactClicksByProject: {
          ...contactClicks,
          [projectId]: currentClicks
        }
      }
    });

    logger.billing.usage(subscription.id, "Incremented contact reveal usage", {
      projectId,
      previousClicks: contactClicks[projectId] || 0,
      newClicks: currentClicks,
      clientId
    });
  }

  /**
   * Reset usage for new billing period (called from webhook)
   */
  async resetUsageForNewPeriod(subscriptionId: string, periodStart: Date, periodEnd: Date): Promise<void> {
    // Create new usage record for the new period
    await prisma.subscriptionUsage.create({
      data: {
        subscriptionId,
        periodStart,
        periodEnd,
        projectsPostedCount: 0,
        contactClicksByProject: {}
      }
    });

    logger.billing.usage(subscriptionId, "Reset usage for new billing period", {
      periodStart,
      periodEnd
    });
  }

  /**
   * Get billing quotas and usage for client
   */
  async getBillingQuotas(clientId: string): Promise<BillingQuotas | null> {
    const subscription = await this.getActiveSubscription(clientId);
    
    if (!subscription) {
      return null;
    }

    const usage = await this.getOrCreateCurrentUsage(subscription.id);
    const contactClicks = usage.contactClicksByProject as Record<string, number>;

    return {
      projectsPerMonth: subscription.package.projectsPerMonth,
      contactClicksPerProject: subscription.package.contactClicksPerProject,
      projectsUsed: usage.projectsPostedCount,
      contactClicksUsed: contactClicks
    };
  }

  /**
   * Get all active packages for subscription selection
   */
  async getActivePackages(): Promise<Package[]> {
    return prisma.package.findMany({
      where: {
        active: true,
        provider: "paypal"
      },
      orderBy: {
        priceUSD: "asc"
      }
    });
  }
}

export const billingService = new BillingService();
