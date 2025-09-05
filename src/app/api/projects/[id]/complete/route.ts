import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/features/auth/auth";
import { prisma } from "@/core/database/db";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
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

    const projectId = params.id;

    // Verify the project belongs to the client and has accepted candidates
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        client: {
          userId: session.user.id
        },
        status: "in_progress" // Only allow completing projects that are in progress
      },
      include: {
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
        { error: "Project not found or not in progress" },
        { status: 404 }
      );
    }

    if (!project.currentBatch?.candidates?.length) {
      return NextResponse.json(
        { error: "No accepted candidates found for this project" },
        { status: 400 }
      );
    }

    // Don't update project status yet - wait for first review
    // Just return the project info and accepted developers

    // Return project info with accepted developers for review
    const acceptedDevelopers = project.currentBatch.candidates.map(candidate => ({
      id: candidate.developer.id,
      name: candidate.developer.user.name,
      image: candidate.developer.user.image
    }));

    return NextResponse.json({
      success: true,
      project: {
        id: project.id,
        title: project.title,
        status: project.status
      },
      acceptedDevelopers: acceptedDevelopers
    });

  } catch (error) {
    console.error("Error completing project:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}