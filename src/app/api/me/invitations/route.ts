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
        responseStatus: { in: ["pending", "expired"] },
        project: {
          client: {
            user: {
              id: {
                not: undefined
              }
            }
          }
        }
      },
      include: {
        project: {
          include: {
            client: {
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
      data: updatedInvitations.map((invitation: any) => ({
        id: invitation.id,
        project: {
          id: invitation.project.id,
          title: invitation.project.title,
          description: invitation.project.description,
          budget: invitation.project.budget,
          currency: invitation.project.currency,
          status: invitation.project.status
        },
        client: {
          id: invitation.project.client.id,
          name: invitation.project.client.user.name,
          email: invitation.project.client.user.email,
          image: invitation.project.client.user.image,
          companyName: invitation.project.client.companyName
        },
        message: invitation.clientMessage, // Only for manual invites
        // For manual invites, use client-entered data; for auto invites, use project data
        title: invitation.source === "MANUAL_INVITE" && invitation.metadata?.title 
          ? invitation.metadata.title 
          : null,
        budget: invitation.source === "MANUAL_INVITE" && invitation.metadata?.budget 
          ? invitation.metadata.budget 
          : invitation.project.budget,
        description: invitation.source === "MANUAL_INVITE" && invitation.metadata?.description 
          ? invitation.metadata.description 
          : invitation.project.description,
        isManualInvite: invitation.source === "MANUAL_INVITE",
        hasDeadline: invitation.acceptanceDeadline !== null,
        acceptanceDeadline: invitation.acceptanceDeadline,
        assignedAt: invitation.assignedAt,
        level: invitation.level,
        statusTextForClient: invitation.statusTextForClient,
        responseStatus: invitation.responseStatus // Add missing responseStatus field
      }))
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
