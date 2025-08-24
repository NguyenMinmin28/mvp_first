import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/features/auth/auth";
import { prisma as db } from "@/core/database/db";

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
        { error: "Only clients can renew subscriptions" },
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
    });

    if (!subscription) {
      return NextResponse.json(
        { error: "Subscription not found" },
        { status: 404 }
      );
    }

    if (subscription.status !== "canceled") {
      return NextResponse.json(
        { error: "Only canceled subscriptions can be renewed" },
        { status: 400 }
      );
    }

    // Calculate new period dates
    const now = new Date();
    const newStartAt = now;
    const newCurrentPeriodStart = now;
    const newCurrentPeriodEnd = new Date(
      now.getTime() + 30 * 24 * 60 * 60 * 1000
    ); // 30 days

    // Update subscription status and dates
    await db.subscription.update({
      where: { id: subscriptionId },
      data: {
        status: "active",
        startAt: newStartAt,
        currentPeriodStart: newCurrentPeriodStart,
        currentPeriodEnd: newCurrentPeriodEnd,
      },
    });

    return NextResponse.json({
      message: "Subscription renewed successfully",
      success: true,
    });
  } catch (error) {
    console.error("Error renewing subscription:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
