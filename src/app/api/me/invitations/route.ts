import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { getToken } from "next-auth/jwt";
import { authOptions } from "@/features/auth/auth";
import { prisma } from "@/core/database/db";

export async function GET(request: NextRequest) {
  try {
    // Try to get session first, fallback to token if needed
    let session;
    try {
      session = await getServerSession(authOptions);
    } catch (error) {
      console.log("getServerSession failed, trying getToken:", error);
      // Fallback to getToken if getServerSession fails
      const token = await getToken({ 
        req: request, 
        secret: process.env.NEXTAUTH_SECRET 
      });
      
      if (token) {
        session = {
          user: {
            id: token.sub!,
            email: token.email,
            name: token.name,
            role: token.role,
            isProfileCompleted: token.isProfileCompleted
          }
        };
      }
    }
    
    console.log("🔍 Session check:", {
      hasSession: !!session,
      hasUser: !!session?.user,
      userId: session?.user?.id,
      userRole: session?.user?.role
    });

    if (!session?.user?.id) {
      console.log("❌ No session or user ID found");
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    if (session.user.role !== "DEVELOPER") {
      return NextResponse.json(
        { error: "Only developers can view invitations" },
        { status: 403 }
      );
    }

    // Get developer profile
    const developerProfile = await prisma.developerProfile.findUnique({
      where: { userId: session.user.id }
    });

    if (!developerProfile) {
      return NextResponse.json(
        { error: "Developer profile not found" },
        { status: 404 }
      );
    }

    // Get all invitations for this developer (both auto and manual)
    console.log("Fetching invitations for developer:", developerProfile.id);
    
    const invitations = await prisma.assignmentCandidate.findMany({
      where: {
        developerId: developerProfile.id,
        // For direct messages: never auto-expire; show all non-canceled
        OR: [
          {
            source: 'MANUAL_INVITE' as any,
            responseStatus: { in: ["pending", "accepted", "rejected"] as any },
          },
          {
            source: { not: 'MANUAL_INVITE' as any },
            responseStatus: { in: ["pending", "accepted", "expired"] },
          }
        ],
      },
      include: {
        project: {
          include: {
            client: {
              include: {
                user: {
                  select: { id: true, name: true, email: true, image: true }
                }
              }
            }
          }
        },
        client: {
          include: {
            user: {
              select: { id: true, name: true, email: true, image: true }
            }
          }
        }
      },
      orderBy: {
        assignedAt: "desc"
      }
    });
    
    console.log("Found invitations:", invitations.length);
    
    // TEMPORARILY DISABLED: Update response status for invitations where project is already accepted by someone else
    // This is disabled for testing purposes to allow pending manual invitations to show up
    const updatedInvitations = invitations;
    
    // Original auto-expire logic (commented out for testing):
    // const updatedInvitations = await Promise.all(invitations.map(async (invitation: any) => {
    //   // Check if project is already accepted by another developer
    //   if (invitation.project.status === "accepted" && invitation.project.contactRevealedDeveloperId !== invitation.developerId) {
    //     // Only update if still pending
    //     if (invitation.responseStatus === "pending") {
    //       await prisma.assignmentCandidate.update({
    //         where: { id: invitation.id },
    //         data: { 
    //           responseStatus: "expired",
    //           respondedAt: new Date()
    //         }
    //       });
    //     }
    //     
    //     return {
    //       ...invitation,
    //       responseStatus: "expired" as const
    //     };
    //   }
    //   
    //   return invitation;
    // }));

    return NextResponse.json({
      success: true,
      data: updatedInvitations.map((invitation: any) => {
        const isManual = invitation.source === 'MANUAL_INVITE';
        const project = invitation.project || null;
        const client = project?.client || invitation.client || null;
        
        // Debug logging
        console.log('🔍 Invitation client data:', {
          invitationId: invitation.id,
          isManual,
          hasProject: !!project,
          hasClient: !!client,
          clientName: client?.user?.name,
          clientImage: client?.user?.image,
          clientEmail: client?.user?.email
        });
        
        return {
          id: invitation.id,
          project: project
            ? {
                id: project.id,
                title: project.title,
                description: project.description,
                budget: project.budget,
                currency: project.currency,
                status: project.status,
              }
            : null,
          client: client
            ? {
                id: client.id,
                name: client.user?.name,
                email: client.user?.email,
                image: client.user?.image,
                companyName: client.companyName || null,
              }
            : null,
          message: invitation.clientMessage,
          title: isManual && invitation.metadata?.title ? invitation.metadata.title : (project ? null : null),
          budget: isManual && invitation.metadata?.budget ? invitation.metadata.budget : project?.budget,
          description: isManual && invitation.metadata?.description ? invitation.metadata.description : project?.description,
          isManualInvite: isManual,
          hasDeadline: invitation.acceptanceDeadline !== null,
          acceptanceDeadline: invitation.acceptanceDeadline,
          assignedAt: invitation.assignedAt,
          level: invitation.level,
          statusTextForClient: invitation.statusTextForClient,
          responseStatus: invitation.responseStatus,
        };
      })
    });

  } catch (error) {
    console.error("Error fetching developer invitations:", error);
    console.error("Error details:", {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    });
    return NextResponse.json(
      { 
        error: "Internal server error",
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
