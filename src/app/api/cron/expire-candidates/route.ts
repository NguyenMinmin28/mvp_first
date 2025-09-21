export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { ExpiryService } from "@/core/services/expiry.service";
import { prisma } from "@/core/database/db";
import { logger } from "@/lib/logger";

export async function POST(request: NextRequest) {
  try {
    // Optional: Add authentication for cron jobs
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("🔄 Cron job triggered: expire-candidates");

    const correlationId = logger.generateCorrelationId();
    
    // Create cron run record
    const cronRecord = await (prisma as any).cronRun.create({
      data: {
        job: "expire-candidates",
        status: "started",
        success: null,
        details: { correlationId }
      }
    });

    try {
      const result = await ExpiryService.expirePendingCandidates();
      
      // Update cron run record with success
      await (prisma as any).cronRun.update({
        where: { id: cronRecord.id },
        data: {
          status: "succeeded",
          success: true,
          finishedAt: new Date(),
          details: { correlationId, ...result }
        }
      });

      console.log("✅ Smart cron job completed:", result);

      return NextResponse.json({
        success: true,
        data: result,
        message: `Expired ${result.expiredCount} candidates and refreshed ${result.refreshedBatches} batches`
      });
    } catch (error) {
      // Update cron run record with failure
      await (prisma as any).cronRun.update({
        where: { id: cronRecord.id },
        data: {
          status: "failed",
          success: false,
          finishedAt: new Date(),
          details: { 
            correlationId, 
            error: error instanceof Error ? error.message : String(error) 
          }
        }
      });
      
      throw error;
    }

  } catch (error) {
    console.error("❌ Error in cron job:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Also support GET for manual testing
export async function GET(request: NextRequest) {
  return POST(request);
}
