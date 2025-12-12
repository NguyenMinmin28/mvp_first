import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/features/auth/auth";
import { prisma } from "@/core/database/db";

export async function POST(
  _request: NextRequest,
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

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let clientProfile = await prisma.clientProfile.findUnique({ where: { userId } });
    if (!clientProfile) {
      clientProfile = await prisma.clientProfile.create({ data: { userId } });
    }

    const now = new Date();

    const existingActive = await prisma.subscription.findFirst({
      where: {
        clientId: clientProfile.id,
        status: "active",
        currentPeriodEnd: { gte: now }
      },
      include: { package: true }
    });

    if (existingActive) {
      return NextResponse.json({
        success: true,
        message: existingActive.package?.name
          ? `User already has active plan: ${existingActive.package.name}`
          : "User already has an active plan",
        subscription: existingActive
      });
    }

    const freePlan = await prisma.package.findFirst({
      where: {
        name: "Free Plan",
        priceUSD: 0,
        active: true
      }
    });

    if (!freePlan) {
      return NextResponse.json({ error: "Free Plan package not found" }, { status: 404 });
    }

    const subscription = await prisma.subscription.create({
      data: {
        clientId: clientProfile.id,
        packageId: freePlan.id,
        status: "active",
        provider: freePlan.provider || "paypal",
        providerSubscriptionId: `admin-seed-free-${userId}-${Date.now()}`,
        startAt: now,
        currentPeriodStart: now,
        currentPeriodEnd: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
        cancelAtPeriodEnd: false,
        trialStart: null,
        trialEnd: null
      },
      include: { package: true }
    });

    await prisma.clientProfile.update({
      where: { id: clientProfile.id },
      data: { currentSubscriptionId: subscription.id }
    });

    return NextResponse.json({
      success: true,
      message: "Free Plan seeded successfully",
      subscription
    });
  } catch (error) {
    console.error("Error seeding Free Plan:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
