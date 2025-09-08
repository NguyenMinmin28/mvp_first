import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/features/auth/auth";
import { notify } from "@/core/services/notify.service";
import { prisma } from "@/core/database/db";

export async function POST(request: NextRequest) {
  try {
    console.log(`🧪 Test notification API called`);
    
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      console.log(`🧪 No session found`);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log(`🧪 Test notification for user ${session.user.id}`);

    // Test Prisma connection first
    try {
      console.log(`🧪 Testing Prisma connection...`);
      // Simple test query
      const testQuery = await (prisma as any).user.findFirst({
        where: { id: session.user.id },
        select: { id: true }
      });
      console.log(`🧪 Prisma test query result:`, testQuery ? 'SUCCESS' : 'FAILED');
    } catch (prismaError) {
      console.error(`🧪 Prisma connection failed:`, prismaError);
      return NextResponse.json({ 
        error: "Database connection failed",
        details: prismaError instanceof Error ? prismaError.message : "Unknown Prisma error"
      }, { status: 500 });
    }

    // Create a test notification
    console.log(`🧪 Creating test notification...`);
    const notificationId = await notify({
      type: "quota.project_limit_reached",
      actorUserId: session.user.id,
      payload: {
        message: "Test notification - Project limit reached",
        description: "This is a test notification to verify the system works.",
        currentPlan: "Basic Plan",
        projectLimit: 1,
        upgradeUrl: "/pricing"
      },
      recipients: [session.user.id]
    });

    console.log(`🧪 Test notification created with ID: ${notificationId}`);

    return NextResponse.json({ 
      success: true, 
      notificationId,
      message: "Test notification created successfully" 
    });
  } catch (error) {
    console.error("🧪 Test notification failed:", error);
    return NextResponse.json({ 
      error: "Failed to create test notification",
      details: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
