import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/features/auth/auth";
import { RotationService } from "@/core/services/rotation.service";
import { prisma } from "@/core/database/db";
import { z } from "zod";

const generateBatchSchema = z.object({
  fresherCount: z.number().min(0).max(10).optional(),
  midCount: z.number().min(0).max(10).optional(),
  expertCount: z.number().min(0).max(10).optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const projectId = params.id;
    const body = await request.json();
    const customSelection = generateBatchSchema.parse(body);

    console.log("🔄 Generating batch for project:", projectId, "with selection:", customSelection);

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

    // Block if project status is locked
    if (currentBatch && ["accepted", "in_progress", "completed"].includes(currentBatch.status as any)) {
      return NextResponse.json(
        { error: "Cannot generate new batch: project is locked" },
        { status: 400 }
      );
    }

    if (currentBatch?.currentBatch?.candidates) {
      const hasAcceptedCandidates = currentBatch.currentBatch.candidates.some(candidate => 
        candidate.responseStatus === "accepted"
      );
      
      if (hasAcceptedCandidates) {
        return NextResponse.json(
          { error: "Cannot generate new batch: project already has accepted candidates" },
          { status: 400 }
        );
      }
    }

    const result = await RotationService.generateBatch(projectId, customSelection);

    console.log("✅ Batch generated successfully:", {
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
        generatedAt: new Date(),
      },
    });

  } catch (error) {
    console.error("❌ Error generating batch:", error);

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
