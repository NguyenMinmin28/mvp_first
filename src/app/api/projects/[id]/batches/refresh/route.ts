import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/features/auth/auth";
import { RotationService } from "@/core/services/rotation.service";
import { prisma } from "@/core/database/db";
import { z } from "zod";

const refreshBatchSchema = z.object({
  fresherCount: z.number().min(0).max(10).optional(),
  midCount: z.number().min(0).max(10).optional(),
  expertCount: z.number().min(0).max(10).optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log("🚨 REFRESH BATCH API CALLED - SERVER SIDE LOG!");
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const projectId = params.id;
    const body = await request.json();
    const customSelection = refreshBatchSchema.parse(body);

    console.log("🔄 Refreshing batch for project:", projectId, "with selection:", customSelection);

    // Check if project locked by status or accepted candidates
    const currentBatch = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        currentBatch: {
          include: {
            candidates: {
              select: {
                acceptanceDeadline: true,
                responseStatus: true,
              }
            }
          }
        }
      }
    });

    console.log("🔄 Current batch info:", {
      projectId,
      currentBatchId: currentBatch?.currentBatchId,
      projectStatus: currentBatch?.status,
      candidatesCount: currentBatch?.currentBatch?.candidates?.length,
      responseStatusCounts: currentBatch?.currentBatch?.candidates?.reduce((acc, c) => {
        acc[c.responseStatus] = (acc[c.responseStatus] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    });

    // Block if project status is locked (but allow refresh if only candidates are accepted)
    if (currentBatch && ["in_progress", "completed"].includes(currentBatch.status as any)) {
      console.log("🔄 Project is locked, cannot refresh");
      return NextResponse.json(
        { error: "Cannot refresh batch: project is locked" },
        { status: 400 }
      );
    }

    // Allow refresh even if project has accepted candidates - we'll preserve them
    console.log("🔄 Calling RotationService.refreshBatch...");
    const result = await RotationService.refreshBatch(projectId, customSelection);
    console.log("🔄 RotationService.refreshBatch completed:", {
      batchId: result.batchId,
      candidatesCount: result.candidates.length,
      selection: result.selection
    });

    console.log("✅ Batch refreshed successfully:", {
      batchId: result.batchId,
      candidateCount: result.candidates.length,
      selection: result.selection,
    });

    return NextResponse.json({
      success: true,
      data: {
        batchId: result.batchId,
        candidates: result.candidates.map(candidate => ({
          developerId: candidate.developerId,
          level: candidate.level,
          skillIds: candidate.skillIds,
          usualResponseTimeMs: candidate.usualResponseTimeMs,
          acceptanceDeadline: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes from now
        })),
        selection: result.selection,
        refreshedAt: new Date(),
      },
    });

  } catch (error) {
    console.error("❌ Error refreshing batch:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.issues },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
