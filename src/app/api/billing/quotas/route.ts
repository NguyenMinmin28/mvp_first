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
    
    // Get subscription details (including inactive ones)
    const subscription = await prisma.subscription.findFirst({
      where: {
        clientId: clientProfile.id
      },
      include: {
        package: true
      },
      orderBy: {
        createdAt: "desc"
      }
    });
    
    if (!quotas && !subscription) {
      return NextResponse.json({
        hasActiveSubscription: false,
        message: "No subscription found"
      });
    }

    // Check if subscription is active
    const isActive = subscription?.status === "active" && 
                     subscription?.currentPeriodEnd && 
                     new Date(subscription.currentPeriodEnd) >= new Date();
    
    const isHighestTier = subscription?.package.name === "Premium" || (subscription?.package.projectsPerMonth ?? 0) >= 15;
    
    // Check if projects are unlimited (Free Plan has projectsPerMonth >= 999)
    const isUnlimitedProjects = (subscription?.package.projectsPerMonth ?? 0) >= 999;

    // If no active subscription, return status info
    if (!isActive || !quotas) {
      return NextResponse.json({
        hasActiveSubscription: false,
        subscriptionStatus: subscription?.status || null,
        packageName: subscription?.package.name || null,
        isUnlimitedProjects: false,
        message: subscription?.status === "past_due" 
          ? "Your payment is pending. Please update your payment method or upgrade manually."
          : subscription?.status === "canceled"
          ? "Your subscription has been canceled. Upgrade to continue using the platform."
          : "No active subscription found"
      });
    }

    // Calculate remaining quotas
    const remaining = {
      projects: isUnlimitedProjects ? 999 : Math.max(0, quotas.projectsPerMonth - quotas.projectsUsed),
      contactClicks: Object.entries(quotas.contactClicksUsed).reduce((acc: any, [projectId, used]: any) => {
        acc[projectId] = Math.max(0, quotas.contactClicksPerProject - used);
        return acc;
      }, {} as Record<string, number>),
      connects: Math.max(0, quotas.connectsPerMonth - (quotas.connectsUsed ?? 0))
    };

    return NextResponse.json({
      hasActiveSubscription: true,
      isHighestTier,
      isUnlimitedProjects,
      packageName: subscription.package.name,
      subscriptionStatus: subscription.status,
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
