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
        { error: "Only clients can cancel subscriptions" },
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

    // Update subscription status to canceled
    await db.subscription.update({
      where: { id: subscriptionId },
      data: { status: "canceled" },
    });

    return NextResponse.json({
      message: "Subscription cancelled successfully",
      success: true,
    });
  } catch (error) {
    console.error("Error cancelling subscription:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
