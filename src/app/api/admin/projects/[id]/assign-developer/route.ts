import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/features/auth/auth";
import { prisma } from "@/core/database/db";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { developerId, reason } = await request.json();
    const projectId = params.id;

    if (!developerId) {
      return NextResponse.json(
        { error: "Developer ID is required" },
        { status: 400 }
      );
    }

    // Verify project exists and is in assigning status
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        client: {
          include: { user: true }
        },
        currentBatch: {
          include: {
            candidates: {
              include: {
                developer: {
                  include: { user: true }
                }
              }
            }
          }
        }
      }
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    if (project.status !== "assigning") {
      return NextResponse.json(
        { error: "Project is not in assigning status" },
        { status: 400 }
      );
    }

    // Verify developer exists and is approved
    const developer = await prisma.developerProfile.findUnique({
      where: { id: developerId },
      include: {
        user: true,
        skills: {
          include: { skill: true }
        }
      }
    });

    if (!developer) {
      return NextResponse.json(
        { error: "Developer not found" },
        { status: 404 }
      );
    }

    if (developer.adminApprovalStatus !== "approved") {
      return NextResponse.json(
        { error: "Developer is not approved" },
        { status: 400 }
      );
    }

    // Resolve skill IDs to skill names for better logging
    const skillNames = await prisma.skill.findMany({
      where: {
        id: { in: project.skillsRequired }
      },
      select: {
        id: true,
        name: true,
      }
    });

    const skillIdToName = Object.fromEntries(
      skillNames.map((skill: any) => [skill.id, skill.name])
    );

    const projectSkillNames = project.skillsRequired.map((id: any) => skillIdToName[id] || id);

    // Check if developer has any of the required skills (optional check for admin)
    const developerSkillNames = developer.skills.map((s: any) => s.skill.name);
    const hasRequiredSkills = projectSkillNames.some((skill: any) => 
      developerSkillNames.includes(skill)
    );

    // Admin can assign developers even without matching skills
    // Just log a warning for reference
    if (!hasRequiredSkills) {
      console.log(`⚠️ Admin assigning developer ${developer.user.email} without matching skills. Required: ${projectSkillNames.join(", ")}, Has: ${developerSkillNames.join(", ")}`);
    }

    // Use transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx: any) => {
      // Update project status to accepted
      const updatedProject = await tx.project.update({
        where: { id: projectId },
        data: {
          status: "accepted",
          contactRevealEnabled: true,
        }
      });

      // Create a new candidate entry for the admin-assigned developer
      const candidate = await tx.assignmentCandidate.create({
        data: {
          batchId: project.currentBatchId!,
          projectId: projectId,
          developerId: developerId,
          level: developer.level,
          usualResponseTimeMsSnapshot: developer.usualResponseTimeMs,
          statusTextForClient: "Assigned by admin",
          assignedAt: new Date(),
          acceptanceDeadline: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
          responseStatus: "accepted",
          isFirstAccepted: true,
        }
      });

      // Create contact reveal event
      const contactReveal = await tx.contactRevealEvent.create({
        data: {
          projectId: projectId,
          clientId: project.clientId,
          developerId: developerId,
          batchId: project.currentBatchId!,
          channel: "email",
          revealedAt: new Date(),
          countsAgainstLimit: false, // Admin assignment doesn't count against quota
          ip: "127.0.0.1", // Admin assignment from server
          userAgent: "Admin Panel", // Admin assignment from server
        }
      });

      // Update project to point to the revealed developer
      await tx.project.update({
        where: { id: projectId },
        data: {
          contactRevealedDeveloperId: developerId,
        }
      });

      return { updatedProject, candidate, contactReveal };
    });

    console.log(`✅ Admin ${session.user.email} assigned developer ${developer.user.email} to project ${project.title}`);

    return NextResponse.json({
      success: true,
      message: "Developer assigned successfully",
      data: {
        project: result.updatedProject,
        developer: {
          id: developer.id,
          name: developer.user.name,
          email: developer.user.email,
          level: developer.level,
        }
      }
    });

  } catch (error) {
    console.error("Error assigning developer:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
