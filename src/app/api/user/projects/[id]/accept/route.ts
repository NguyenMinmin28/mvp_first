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

    // Find the assignment candidate for this project and user
    const assignment = await prisma.assignmentCandidate.findFirst({
      where: {
        projectId: params.id,
        developer: {
          userId: session.user.id
        },
        responseStatus: "pending"
      },
      include: {
        project: true,
        developer: true
      }
    });

    if (!assignment) {
      return NextResponse.json(
        { error: "Assignment not found or already processed" },
        { status: 404 }
      );
    }

    // Check if the assignment has expired
    const now = new Date();
    const deadline = new Date(assignment.acceptanceDeadline);
    
    if (now > deadline) {
      return NextResponse.json(
        { error: "Assignment has expired" },
        { status: 400 }
      );
    }

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
        respondedAt: now,
        isFirstAccepted: !existingAccepted // Mark as first accepted if no other accepted assignments
      }
    });

    // If this is the first acceptance, update project status
    if (!existingAccepted) {
      await prisma.project.update({
        where: { id: params.id },
        data: {
          status: "accepted",
          updatedAt: now
        }
      });
    }

    return NextResponse.json({
      message: "Assignment accepted successfully",
      assignment: {
        id: assignment.id,
        responseStatus: "accepted",
        respondedAt: now,
        isFirstAccepted: !existingAccepted
      }
    });
  } catch (error) {
    console.error("Error accepting assignment:", error);
    return NextResponse.json(
      { error: "Failed to accept assignment" },
      { status: 500 }
    );
  }
}
