import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/features/auth/auth";
import { prisma } from "@/core/database/db";

export async function POST(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const userId = params.userId;

    const client = await prisma.clientProfile.findUnique({ where: { userId } });
    if (!client) {
      // If the user has no client profile, treat as already cleared
      return NextResponse.json({ success: true, deleted: { subscriptionUsages: 0, payments: 0, subscriptions: 0 } });
    }

    // Fetch subscriptions to cascade delete usages
    const subs = await prisma.subscription.findMany({
      where: { clientId: client.id },
      select: { id: true },
    });
    const subIds = subs.map(s => s.id);

    // Delete usage tied to subscriptions
    const usageDel = subIds.length
      ? await prisma.subscriptionUsage.deleteMany({ where: { subscriptionId: { in: subIds } } })
      : { count: 0 };

    // Delete payments for the client
    const paymentsDel = await prisma.payment.deleteMany({ where: { clientId: client.id } });

    // Delete subscriptions
    const subsDel = await prisma.subscription.deleteMany({ where: { clientId: client.id } });

    // Reset current subscription pointer on client
    await prisma.clientProfile.update({
      where: { id: client.id },
      data: { currentSubscriptionId: null },
    });

    return NextResponse.json({
      success: true,
      deleted: {
        subscriptionUsages: usageDel.count,
        payments: paymentsDel.count,
        subscriptions: subsDel.count,
      },
    });
  } catch (error) {
    console.error("Error clearing subscriptions for user:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}


