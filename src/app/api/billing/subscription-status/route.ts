import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import authOptions from "../../../../../config/auth.config";
import { prisma } from "@/core/database/db";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Get user's active subscription
    const subscription = await prisma.subscription.findFirst({
      where: {
        clientId: session.user.id,
        status: {
          in: ["active", "past_due"]
        }
      },
      include: {
        package: true,
        payments: {
          where: {
            status: "captured"
          },
          orderBy: {
            capturedAt: "desc"
          },
          take: 5 // Last 5 successful payments
        }
      }
    });

    if (!subscription) {
      return NextResponse.json({
        hasActiveSubscription: false,
        subscription: null
      });
    }

    // Calculate days until next billing
    const now = new Date();
    const nextBilling = new Date(subscription.currentPeriodEnd);
    const daysUntilBilling = Math.ceil((nextBilling.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    // Get payment failure count (default to 0 since metadata field doesn't exist in schema)
    const failureCount = 0;

    return NextResponse.json({
      hasActiveSubscription: true,
      subscription: {
        id: subscription.id,
        status: subscription.status,
        packageName: subscription.package.name,
        packagePrice: subscription.package.priceUSD,
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
        daysUntilBilling,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
        provider: subscription.provider,
        paymentFailureCount: failureCount,
        lastPayment: subscription.payments[0] || null,
        recentPayments: subscription.payments
      }
    });

  } catch (error) {
    console.error("Error fetching subscription status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
