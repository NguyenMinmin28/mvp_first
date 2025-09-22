export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/features/auth/auth";
import { billingService } from "@/modules/billing/billing.service";
import { prisma } from "@/core/database/db";

/**
 * Get billing quotas and usage for current user
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get client profile
    const clientProfile = await prisma.clientProfile.findFirst({
      where: { userId: session.user.id }
    });

    if (!clientProfile) {
      return NextResponse.json({
        error: "Client profile not found"
      }, { status: 400 });
    }

    // Get quotas and usage
    const quotas = await billingService.getBillingQuotas(clientProfile.id);
    
    if (!quotas) {
      return NextResponse.json({
        hasActiveSubscription: false,
        message: "No active subscription found"
      });
    }

    // Get subscription details to check if it's the highest tier
    const subscription = await billingService.getActiveSubscription(clientProfile.id);
    const isHighestTier = subscription?.package.name === "Premium" || (subscription?.package.projectsPerMonth ?? 0) >= 15;

    // Calculate remaining quotas
    const remaining = {
      projects: Math.max(0, quotas.projectsPerMonth - quotas.projectsUsed),
      contactClicks: Object.entries(quotas.contactClicksUsed).reduce((acc: any, [projectId, used]: any) => {
        acc[projectId] = Math.max(0, quotas.contactClicksPerProject - used);
        return acc;
      }, {} as Record<string, number>),
      connects: Math.max(0, quotas.connectsPerMonth - (quotas.connectsUsed ?? 0))
    };

    return NextResponse.json({
      hasActiveSubscription: true,
      isHighestTier,
      packageName: subscription?.package.name,
      quotas: {
        projectsPerMonth: quotas.projectsPerMonth,
        contactClicksPerProject: quotas.contactClicksPerProject,
        connectsPerMonth: quotas.connectsPerMonth
      },
      usage: {
        projectsUsed: quotas.projectsUsed,
        contactClicksUsed: quotas.contactClicksUsed,
        connectsUsed: quotas.connectsUsed
      },
      remaining
    });

  } catch (error: any) {
    console.error("Error getting billing quotas:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
