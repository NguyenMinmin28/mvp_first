import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/features/auth/auth";
import { prisma as db } from "@/core/database/db";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find client profile
    const clientProfile = await db.clientProfile.findUnique({
      where: {
        userId: session.user.id,
      },
    });

    if (!clientProfile) {
      return NextResponse.json({
        success: false,
        error: "Client profile not found"
      }, { status: 404 });
    }

    // Kiểm tra xem user đã có subscription chưa
    const existingSubscription = await db.subscription.findFirst({
      where: {
        clientId: clientProfile.id,
        status: {
          in: ['active']
        }
      }
    });

    if (existingSubscription) {
      return NextResponse.json({
        success: true,
        message: "User already has an active subscription",
        subscription: existingSubscription
      });
    }

    // Tìm Basic Plan package
    const basicPackage = await db.package.findFirst({
      where: {
        name: "Free Plan",
        priceUSD: 0
      }
    });

    if (!basicPackage) {
      return NextResponse.json({
        success: false,
        error: "Basic Plan not found in database"
      }, { status: 404 });
    }

    // Tạo subscription cho Basic Plan
    const subscription = await db.subscription.create({
      data: {
        clientId: clientProfile.id,
        packageId: basicPackage.id,
        status: 'active',
        provider: 'paypal',
        providerSubscriptionId: `basic-${session.user.id}-${Date.now()}`,
        startAt: new Date(),
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        cancelAtPeriodEnd: false,
        trialStart: null,
        trialEnd: null
      },
      include: {
        package: true
      }
    });

    return NextResponse.json({
      success: true,
      message: "Basic Plan assigned successfully",
      subscription
    });

  } catch (error) {
    console.error("Error assigning basic plan:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to assign basic plan"
    }, { status: 500 });
  }
}
