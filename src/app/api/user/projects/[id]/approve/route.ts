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

    // Handle approval based on user role
    if (session.user.role === "ADMIN") {
      // Admin approval - update project status
      const updatedProject = await prisma.project.update({
        where: { id: params.id },
        data: { 
          status: "accepted",
          updatedAt: new Date()
        }
      });
    } else {
      // Developer assignment acceptance
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
        // Check if this is the first acceptance for this project
        const existingAccepted = await prisma.assignmentCandidate.findFirst({
          where: {
            projectId: params.id,
            responseStatus: "accepted"
          }
        });

        // Update assignment status to accepted
        await prisma.assignmentCandidate.update({
          where: { id: assignment.id },
          data: {
            responseStatus: "accepted",
            respondedAt: new Date(),
            isFirstAccepted: !existingAccepted
          }
        });

        // If this is the first acceptance, update project status
        if (!existingAccepted) {
          await prisma.project.update({
            where: { id: params.id },
            data: {
              status: "accepted",
              updatedAt: new Date()
            }
          });
        }
      }
    }

    return NextResponse.json({
      message: "Project approved successfully"
    });
  } catch (error) {
    console.error("Error approving project:", error);
    return NextResponse.json(
      { error: "Failed to approve project" },
      { status: 500 }
    );
  }
}
