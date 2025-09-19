import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/features/auth/auth";
import { prisma } from "@/core/database/db";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json(
        { error: "Project ID is required" },
        { status: 400 }
      );
    }

    // Get project with current batch
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        client: {
          userId: session.user.id
        }
      },
      include: {
        currentBatch: {
          include: {
            candidates: {
              include: {
                developer: {
                  include: {
                    user: {
                      select: {
                        id: true,
                        name: true,
                        email: true,
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    // Count statuses
    const statusCounts = project.currentBatch?.candidates.reduce((acc, candidate) => {
      acc[candidate.responseStatus] = (acc[candidate.responseStatus] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    // Get detailed candidate info
    const candidates = project.currentBatch?.candidates.map(candidate => ({
      id: candidate.id,
      developerId: candidate.developerId,
      developerName: candidate.developer.user.name,
      responseStatus: candidate.responseStatus,
      assignedAt: candidate.assignedAt,
      acceptanceDeadline: candidate.acceptanceDeadline,
      respondedAt: candidate.respondedAt,
    })) || [];

    return NextResponse.json({
      projectId: project.id,
      projectTitle: project.title,
      currentBatchId: project.currentBatchId,
      totalCandidates: project.currentBatch?.candidates.length || 0,
      statusCounts,
      candidates,
    });

  } catch (error) {
    console.error("Error checking accepted status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
