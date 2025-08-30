export const runtime = "nodejs";

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

    // Get all invitations for this developer
    const invitations = await prisma.assignmentCandidate.findMany({
      where: {
        developerId: developerProfile.id
      },
      include: {
        batch: {
          include: {
            project: {
              include: {
                client: {
                  include: {
                    user: {
                      select: {
                        name: true
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      orderBy: [
        { responseStatus: "asc" }, // pending first
        { assignedAt: "desc" }     // newest first
      ]
    });

    // Get skills for each invitation
    const invitationsWithSkills = await Promise.all(
      invitations.map(async (invitation: any) => {
        const skills = await prisma.skill.findMany({
          where: {
            id: { in: invitation.batch.project.skillsRequired }
          },
          select: {
            name: true
          }
        });

        return {
          id: invitation.id,
          level: invitation.level,
          responseStatus: invitation.responseStatus,
          acceptanceDeadline: invitation.acceptanceDeadline,
          assignedAt: invitation.assignedAt,
          respondedAt: invitation.respondedAt,
          isFirstAccepted: invitation.isFirstAccepted,
          batch: {
            id: invitation.batch.id,
            status: invitation.batch.status,
            project: {
              id: invitation.batch.project.id,
              title: invitation.batch.project.title,
              description: invitation.batch.project.description,
              skillsRequired: invitation.batch.project.skillsRequired,
              status: invitation.batch.project.status,
              client: {
                user: {
                  name: invitation.batch.project.client.user.name
                },
                companyName: invitation.batch.project.client.companyName
              }
            }
          },
          skills
        };
      })
    );

    return NextResponse.json(invitationsWithSkills);

  } catch (error) {
    console.error("Error fetching invitations:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
