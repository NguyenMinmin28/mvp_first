import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/features/auth/auth";
import { prisma } from "@/core/database/db";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id;

    // Step 1: Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    if (session.user.role !== "CLIENT") {
      return NextResponse.json(
        { error: "Only clients can mark projects as completed" },
        { status: 403 }
      );
    }

    // Step 2: Check if project exists and belongs to client
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        client: {
          userId: session.user.id
        }
      },
      select: {
        id: true,
        title: true,
        status: true,
        currentBatch: {
          include: {
            candidates: {
              where: {
                responseStatus: "accepted"
              },
              include: {
                developer: {
                  include: {
                    user: {
                      select: {
                        id: true,
                        name: true,
                        image: true
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
        { error: "Project not found or you don't have permission" },
        { status: 404 }
      );
    }

    // Step 3: Check if project can be completed (not already completed or canceled)
    if (project.status === "completed") {
      return NextResponse.json(
        { error: "Project is already completed" },
        { status: 400 }
      );
    }

    if (project.status === "canceled") {
      return NextResponse.json(
        { error: "Cannot complete a canceled project" },
        { status: 400 }
      );
    }

    // Step 4: Get accepted developers for review
    const acceptedDevelopers = project.currentBatch?.candidates?.map(candidate => ({
      id: candidate.developer.id,
      name: candidate.developer.user.name,
      image: candidate.developer.user.image
    })) || [];


    // Step 5: Update project status to completed
    const updatedProject = await prisma.project.update({
      where: {
        id: projectId
      },
      data: {
        status: "completed"
      },
      select: {
        id: true,
        title: true,
        status: true
      }
    });

    return NextResponse.json({
      success: true,
      project: updatedProject,
      acceptedDevelopers: acceptedDevelopers,
      message: "Project completed successfully!"
    });

  } catch (error) {
    console.error("Error completing project:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}