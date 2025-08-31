export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { ReconciliationJob } from "@/modules/billing/reconciliation.job";
import { logger } from "@/lib/logger";
import { prisma } from "@/core/database/db";

// Cron job endpoint for subscription reconciliation
// Should be called every 5 minutes by external cron service for better real-time sync
// Example cron expression: "0 */5 * * * *" (every 5 minutes)
export async function POST(request: NextRequest) {
  try {
    // Verify cron secret to prevent unauthorized access
    const incomingSecret = request.headers.get("authorization")?.replace("Bearer ", "");
    const expectedSecret = process.env.CRON_SECRET || (process.env.NODE_ENV !== "production" ? "test-secret" : undefined);
    
    if (!incomingSecret || !expectedSecret || incomingSecret !== expectedSecret) {
      logger.warn("Unauthorized cron job access attempt", {
        ip: request.headers.get("x-forwarded-for") || "unknown",
        userAgent: request.headers.get("user-agent") || "unknown"
      });
      
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const correlationId = logger.generateCorrelationId();
    
    logger.info("Scheduled reconciliation job started", { correlationId });
    const cronRecord = await (prisma as any).cronRun.create({
      data: {
        job: "reconcile-subscriptions",
        status: "started",
        success: null,
        details: { correlationId }
      }
    });

    const result = await ReconciliationJob.reconcileAllSubscriptions();
    
    logger.info("Scheduled reconciliation job completed", {
      correlationId,
      ...result
    });

    await (prisma as any).cronRun.update({
      where: { id: cronRecord.id },
      data: {
        status: "succeeded",
        success: true,
        finishedAt: new Date(),
        details: { correlationId, ...result }
      }
    });

    return NextResponse.json({
      success: true,
      message: "Reconciliation completed",
      data: result
    });

  } catch (error: any) {
    logger.error("Scheduled reconciliation job failed", error);
    try {
      await (prisma as any).cronRun.create({
        data: {
          job: "reconcile-subscriptions",
          status: "failed",
          success: false,
          details: { error: error?.message || String(error) }
        }
      });
    } catch {}
    
    return NextResponse.json(
      { 
        success: false, 
        error: "Reconciliation failed", 
        details: error.message 
      },
      { status: 500 }
    );
  }
}

/**
 * Health check endpoint
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const testMode = searchParams.get("test") === "true";
    
    if (testMode) {
      // Test mode - run reconciliation manually AND persist a CronRun record
      const correlationId = logger.generateCorrelationId();
      const cronRecord = await (prisma as any).cronRun.create({
        data: {
          job: "reconcile-subscriptions",
          status: "started",
          success: null,
          details: { correlationId, source: "test-mode" }
        }
      });

      try {
        const result = await ReconciliationJob.reconcileAllSubscriptions();
        await (prisma as any).cronRun.update({
          where: { id: cronRecord.id },
          data: {
            status: "succeeded",
            success: true,
            finishedAt: new Date(),
            details: { correlationId, source: "test-mode", ...result }
          }
        });

        return NextResponse.json({
          success: true,
          message: "Test reconciliation completed",
          data: result,
          timestamp: new Date().toISOString()
        });
      } catch (error: any) {
        await (prisma as any).cronRun.update({
          where: { id: cronRecord.id },
          data: {
            status: "failed",
            success: false,
            finishedAt: new Date(),
            details: { correlationId, source: "test-mode", error: error?.message || String(error) }
          }
        });
        return NextResponse.json(
          { success: false, error: "Test reconciliation failed", details: error?.message || String(error) },
          { status: 500 }
        );
      }
    }
    
    // Regular health check
    const health = await ReconciliationJob.healthCheck();
    
    return NextResponse.json({
      success: true,
      health,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    return NextResponse.json(
      { 
        success: false, 
        error: "Health check failed", 
        details: error.message 
      },
      { status: 500 }
    );
  }
}
