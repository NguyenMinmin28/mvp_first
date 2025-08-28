import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/features/auth/auth";
import { ReconciliationJob } from "@/modules/billing/reconciliation.job";
import { logger } from "@/lib/logger";

/**
 * Manual reconciliation endpoint (admin only)
 * Also provides health check functionality
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Admin only
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const correlationId = logger.generateCorrelationId();
    
    logger.info("Manual reconciliation started", {
      correlationId,
      adminId: session.user.id
    });

    const result = await ReconciliationJob.reconcileAllSubscriptions();
    
    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error: any) {
    logger.error("Manual reconciliation failed", error);
    return NextResponse.json(
      { error: "Reconciliation failed", details: error.message },
      { status: 500 }
    );
  }
}

/**
 * Health check for reconciliation system
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Admin only
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const health = await ReconciliationJob.healthCheck();
    
    return NextResponse.json({
      success: true,
      health
    });

  } catch (error: any) {
    return NextResponse.json(
      { error: "Health check failed", details: error.message },
      { status: 500 }
    );
  }
}
