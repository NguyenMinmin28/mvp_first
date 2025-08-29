import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/features/auth/auth";
import { prisma as db } from "@/core/database/db";
import { UpdateUsageRequest } from "@/core/types/subscription.types";

// GET /api/user/subscriptions/[id]/usage
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "CLIENT") {
      return NextResponse.json(
        { error: "Only clients can access usage data" },
        { status: 403 }
      );
    }

    const subscriptionId = params.id;

    // Verify the subscription belongs to the user
    const subscription = await db.subscription.findFirst({
      where: {
        id: subscriptionId,
        client: {
          userId: session.user.id,
        },
      },
      include: {
        package: true,
        subscriptionUsages: true,
      },
    });

    if (!subscription) {
      return NextResponse.json(
        { error: "Subscription not found" },
        { status: 404 }
      );
    }

    // Get current period usage
    const now = new Date();
    const currentPeriodStart = new Date(subscription.currentPeriodStart);
    const currentPeriodEnd = new Date(subscription.currentPeriodEnd);
    
    let usage = await db.subscriptionUsage.findFirst({
      where: {
        subscriptionId,
        periodStart: currentPeriodStart,
        periodEnd: currentPeriodEnd,
      },
    });
    
    if (!usage) {
      // Create usage record for current period
      usage = await db.subscriptionUsage.create({
        data: {
          subscriptionId,
          periodStart: currentPeriodStart,
          periodEnd: currentPeriodEnd,
          projectsPostedCount: 0,
          contactClicksByProject: {} as Prisma.InputJsonValue,
        },
      });
    }

    // Calculate days until period end
    const daysUntilEnd = Math.ceil((currentPeriodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    return NextResponse.json({
      usage,
      daysUntilEnd: Math.max(0, daysUntilEnd),
    });
  } catch (error) {
    console.error("Error fetching usage:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/user/subscriptions/[id]/usage
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "CLIENT") {
      return NextResponse.json(
        { error: "Only clients can update usage" },
        { status: 403 }
      );
    }

    const subscriptionId = params.id;
    const body: UpdateUsageRequest = await request.json();

    // Verify the subscription belongs to the user
    const subscription = await db.subscription.findFirst({
      where: {
        id: subscriptionId,
        client: {
          userId: session.user.id,
        },
      },
      include: {
        package: true,
        subscriptionUsages: true,
      },
    });

    if (!subscription) {
      return NextResponse.json(
        { error: "Subscription not found" },
        { status: 404 }
      );
    }

    if (subscription.status !== "active") {
      return NextResponse.json(
        { error: "Can only update usage for active subscriptions" },
        { status: 400 }
      );
    }

    // Get or create usage record for the specified period
    let usage = await db.subscriptionUsage.findFirst({
      where: {
        subscriptionId,
        periodStart: body.periodStart,
        periodEnd: body.periodEnd,
      },
    });

    if (!usage) {
      // Create new usage record for the period
      usage = await db.subscriptionUsage.create({
        data: {
          subscriptionId,
          periodStart: body.periodStart,
          periodEnd: body.periodEnd,
          projectsPostedCount: body.projectsPostedCount || 0,
          contactClicksByProject: body.contactClicksByProject || {},
        },
      });
    } else {
      // Update existing usage record
      const updatedUsage = await db.subscriptionUsage.update({
        where: { id: usage.id },
        data: {
          projectsPostedCount: body.projectsPostedCount !== undefined ? body.projectsPostedCount : usage.projectsPostedCount,
          contactClicksByProject: (body.contactClicksByProject as Prisma.InputJsonValue | undefined) ?? (usage.contactClicksByProject as unknown as Prisma.InputJsonValue),
        },
      });
      usage = updatedUsage;
    }

    return NextResponse.json({
      usage,
      success: true,
      message: "Usage updated successfully",
    });
  } catch (error) {
    console.error("Error updating usage:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
