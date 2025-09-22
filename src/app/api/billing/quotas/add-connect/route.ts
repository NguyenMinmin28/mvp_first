import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/features/auth/auth";
import { prisma } from "@/core/database/db";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Allow only in development or admin users
    if (process.env.NODE_ENV !== "development" && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get client profile
    const clientProfile = await prisma.clientProfile.findFirst({
      where: { userId: session.user.id }
    });
    if (!clientProfile) {
      return NextResponse.json({ error: "Client profile not found" }, { status: 400 });
    }

    // Get active subscription
    const subscription = await prisma.subscription.findFirst({
      where: {
        clientId: clientProfile.id,
        status: "active",
        currentPeriodEnd: { gte: new Date() }
      },
      include: { package: true },
      orderBy: { createdAt: "desc" }
    } as any);

    if (!subscription) {
      return NextResponse.json({ error: "No active subscription found" }, { status: 400 });
    }

    // If plan has 0 connects (e.g., Free), bump connectsPerMonth in dev for testing
    let pkg = await prisma.package.findUnique({ where: { id: subscription.packageId } } as any);
    const currentConnectsPerMonth = (pkg as any)?.connectsPerMonth ?? 0;
    if (currentConnectsPerMonth === 0) {
      await prisma.package.update({
        where: { id: subscription.packageId },
        data: { connectsPerMonth: 5 }
      } as any);
      pkg = await prisma.package.findUnique({ where: { id: subscription.packageId } } as any);
    }

    // Get current usage for period
    const usage = await prisma.subscriptionUsage.findFirst({
      where: {
        subscriptionId: subscription.id,
        periodStart: { lte: subscription.currentPeriodStart },
        periodEnd: { gte: subscription.currentPeriodEnd }
      }
    });

    if (!usage) {
      return NextResponse.json({ error: "Usage not found for current period" }, { status: 404 });
    }

    const connectsUsed = (usage as any).connectsUsed ?? 0;
    const newUsed = Math.max(0, connectsUsed - 1);

    await prisma.subscriptionUsage.update({
      where: { id: usage.id },
      data: { connectsUsed: newUsed } as any
    });

    const connectsPerMonth = ((pkg as any)?.connectsPerMonth ?? 0) as number;
    const remaining = Math.max(0, connectsPerMonth - newUsed);

    return NextResponse.json({
      success: true,
      data: {
        connectsPerMonth,
        connectsUsed: newUsed,
        remaining
      }
    });
  } catch (error) {
    console.error("Error adding test connect:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}


