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

    if (session.user.role !== "CLIENT") {
      return NextResponse.json(
        { error: "Only clients can view manual invitations" },
        { status: 403 }
      );
    }

    // Get client profile
    const clientProfile = await prisma.clientProfile.findUnique({
      where: { userId: session.user.id }
    });

    if (!clientProfile) {
      return NextResponse.json(
        { error: "Client profile not found" },
        { status: 404 }
      );
    }

    // Get all manual invitations for client's projects
    const manualInvitations = await (prisma as any).assignmentCandidate.findMany({
      where: {
        project: {
          clientId: clientProfile.id
        },
        source: "MANUAL_INVITE"
      },
      include: {
        project: {
          select: {
            id: true,
            title: true
          }
        },
        developer: {
          include: {
            user: {
              select: {
                name: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: {
        assignedAt: "desc"
      }
    });

    // Group by project
    const invitationsByProject = manualInvitations.reduce((acc: any, invitation: any) => {
      const projectId = invitation.project.id;
      if (!acc[projectId]) {
        acc[projectId] = {
          projectId,
          projectTitle: invitation.project.title,
          invitations: []
        };
      }
      acc[projectId].invitations.push({
        id: invitation.id,
        responseStatus: invitation.responseStatus,
        assignedAt: invitation.assignedAt,
        clientMessage: invitation.clientMessage,
        title: invitation.metadata?.title,
        budget: invitation.metadata?.budget,
        description: invitation.metadata?.description,
        developer: {
          name: invitation.developer?.user?.name || 'Developer',
          email: invitation.developer?.user?.email || 'No email'
        }
      });
      return acc;
    }, {});

    return NextResponse.json({
      success: true,
      data: Object.values(invitationsByProject)
    });

  } catch (error) {
    console.error("Error fetching manual invitations:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
