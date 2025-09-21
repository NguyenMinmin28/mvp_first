import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/features/auth/auth";
import { prisma } from "@/core/database/db";

export async function GET(
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
        { error: "Only clients can view project invites" },
        { status: 403 }
      );
    }

    // Get project and verify client ownership
    const project = await prisma.project.findFirst({
      where: {
        id: params.id,
        client: {
          userId: session.user.id
        }
      }
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found or access denied" },
        { status: 404 }
      );
    }

    // Get all manual invites for this project
    const invites = await prisma.assignmentCandidate.findMany({
      where: {
        projectId: params.id,
        source: "MANUAL_INVITE"
      },
      include: {
        developer: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true
              }
            }
          }
        }
      },
      orderBy: {
        assignedAt: "desc"
      }
    });

    return NextResponse.json({
      success: true,
      data: invites.map(invite => ({
        id: invite.id,
        developer: {
          id: invite.developer.id,
          name: invite.developer.user.name,
          email: invite.developer.user.email,
          image: invite.developer.user.image,
          level: invite.level
        },
        message: invite.clientMessage,
        status: invite.responseStatus,
        assignedAt: invite.assignedAt,
        respondedAt: invite.respondedAt
      }))
    });

  } catch (error) {
    console.error("Error fetching project invites:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
