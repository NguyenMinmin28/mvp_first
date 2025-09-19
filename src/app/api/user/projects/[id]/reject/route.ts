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
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if user is admin or developer with assignment
    if (session.user.role !== "ADMIN") {
      // For developers, check if they have a pending assignment for this project
      const assignment = await prisma.assignmentCandidate.findFirst({
        where: {
          projectId: params.id,
          developer: {
            userId: session.user.id
          },
          responseStatus: "pending"
        },
        orderBy: {
          assignedAt: "desc" // Get the most recent assignment
        }
      });

      if (!assignment) {
        return NextResponse.json(
          { error: "No pending assignment found for this project" },
          { status: 403 }
        );
      }
    }

    const project = await prisma.project.findUnique({
      where: { id: params.id }
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    // Handle rejection based on user role
    if (session.user.role === "ADMIN") {
      // Admin rejection - update project status
      const updatedProject = await prisma.project.update({
        where: { id: params.id },
        data: { 
          status: "canceled",
          updatedAt: new Date()
        }
      });
    } else {
      // Developer assignment rejection
      const assignment = await prisma.assignmentCandidate.findFirst({
        where: {
          projectId: params.id,
          developer: {
            userId: session.user.id
          },
          responseStatus: "pending"
        }
      });

      if (assignment) {
        // Update assignment status to rejected
        await prisma.assignmentCandidate.update({
          where: { id: assignment.id },
          data: {
            responseStatus: "rejected",
            respondedAt: new Date()
          }
        });
      }
    }

    return NextResponse.json({
      message: "Project rejected successfully"
    });
  } catch (error) {
    console.error("Error rejecting project:", error);
    return NextResponse.json(
      { error: "Failed to reject project" },
      { status: 500 }
    );
  }
}
