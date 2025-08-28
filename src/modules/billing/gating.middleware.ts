import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/features/auth/auth";
import { billingService } from "./billing.service";
import { logger } from "@/lib/logger";

/**
 * Gating middleware for protecting quota-limited endpoints
 */

export async function requireActiveSubscription(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // For development or admin users, skip gating
  if (process.env.NODE_ENV === "development" || session.user.role === "ADMIN") {
    return null; // Continue
  }

  // Get client profile  
  const { prisma } = await import("@/core/database/db");
  const clientProfile = await prisma.clientProfile.findFirst({
    where: { userId: session.user.id }
  });

  if (!clientProfile) {
    return NextResponse.json({ 
      error: "Client profile not found" 
    }, { status: 400 });
  }

  // Check for active subscription
  const subscription = await billingService.getActiveSubscription(clientProfile.id);
  
  if (!subscription) {
    return NextResponse.json({
      error: "Active subscription required",
      code: "SUBSCRIPTION_REQUIRED"
    }, { status: 402 });
  }

  // Add client info to request for downstream use
  (request as any).clientProfile = clientProfile;
  (request as any).subscription = subscription;
  
  return null; // Continue
}

export async function requireProjectPostQuota(request: NextRequest) {
  // First check subscription
  const subscriptionCheck = await requireActiveSubscription(request);
  if (subscriptionCheck) return subscriptionCheck;

  const clientProfile = (request as any).clientProfile;
  
  // Check project posting quota
  const quotaCheck = await billingService.canPostProject(clientProfile.id);
  
  if (!quotaCheck.allowed) {
    logger.billing.quota(
      clientProfile.userId,
      "post-project-blocked",
      quotaCheck.reason || "Quota exceeded"
    );

    return NextResponse.json({
      error: quotaCheck.reason || "Project posting quota exceeded",
      code: "PROJECT_QUOTA_EXCEEDED",
      remaining: quotaCheck.remaining
    }, { status: 402 });
  }

  return null; // Continue
}

export async function requireContactRevealQuota(request: NextRequest, projectId: string) {
  // First check subscription
  const subscriptionCheck = await requireActiveSubscription(request);
  if (subscriptionCheck) return subscriptionCheck;

  const clientProfile = (request as any).clientProfile;
  
  // Check contact reveal quota for this project
  const quotaCheck = await billingService.canRevealContact(clientProfile.id, projectId);
  
  if (!quotaCheck.allowed) {
    logger.billing.quota(
      clientProfile.userId,
      "reveal-contact-blocked", 
      quotaCheck.reason || "Quota exceeded",
      { projectId }
    );

    return NextResponse.json({
      error: quotaCheck.reason || "Contact reveal quota exceeded",
      code: "CONTACT_QUOTA_EXCEEDED",
      remaining: quotaCheck.remaining
    }, { status: 402 });
  }

  return null; // Continue
}

/**
 * Helper to apply gating to route handlers
 */
export function withGating<T extends any[]>(
  gateFn: (...args: T) => Promise<NextResponse | null>,
  handler: (request: NextRequest, ...args: any[]) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    const gateResult = await gateFn(...args);
    if (gateResult) {
      return gateResult; // Gate failed, return error response
    }
    
    return handler(request, ...args);
  };
}

/**
 * Apply usage increment after successful operation
 */
export async function incrementUsageAfterSuccess<T>(
  operation: () => Promise<T>,
  incrementFn: () => Promise<void>,
  errorMessage: string
): Promise<T> {
  try {
    const result = await operation();
    
    // Only increment if operation was successful
    await incrementFn();
    
    return result;
  } catch (error) {
    logger.error(`${errorMessage}: ${error instanceof Error ? error.message : error}`);
    throw error;
  }
}
