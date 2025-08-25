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
        { error: "Only clients can view project assignments" },
        { status: 403 }
      );
    }

    // Get project with client verification
    const project = await prisma.project.findFirst({
      where: {
        id: params.id,
        client: {
          userId: session.user.id
        }
      },
      include: {
        client: true,
      }
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    // Get current batch candidates
    let candidates = [];
    if (project.currentBatchId) {
      candidates = await prisma.assignmentCandidate.findMany({
        where: {
          batchId: project.currentBatchId
        },
        include: {
          developer: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                }
              },
              skills: {
                include: {
                  skill: {
                    select: {
                      name: true
                    }
                  }
                }
              }
            }
          }
        },
        orderBy: [
          { level: "desc" }, // EXPERT first
          { assignedAt: "asc" }
        ]
      });
    }

    // Get skills for the project
    const skills = await prisma.skill.findMany({
      where: {
        id: { in: project.skillsRequired }
      },
      select: {
        id: true,
        name: true
      }
    });

    return NextResponse.json({
      project: {
        id: project.id,
        title: project.title,
        description: project.description,
        skillsRequired: project.skillsRequired,
        status: project.status,
        contactRevealEnabled: project.contactRevealEnabled,
        currentBatchId: project.currentBatchId,
      },
      candidates: candidates.map(candidate => ({
        id: candidate.id,
        developerId: candidate.developerId,
        level: candidate.level,
        responseStatus: candidate.responseStatus,
        acceptanceDeadline: candidate.acceptanceDeadline,
        assignedAt: candidate.assignedAt,
        respondedAt: candidate.respondedAt,
        usualResponseTimeMsSnapshot: candidate.usualResponseTimeMsSnapshot,
        statusTextForClient: candidate.statusTextForClient,
        developer: {
          id: candidate.developer.id,
          user: candidate.developer.user,
          level: candidate.developer.level,
          skills: candidate.developer.skills.map(skill => ({
            skill: { name: skill.skill.name },
            years: skill.years
          }))
        }
      })),
      skills
    });

  } catch (error) {
    console.error("Error fetching assignment data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
