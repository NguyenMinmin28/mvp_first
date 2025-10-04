import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/features/auth/auth";
import { prisma as db } from "@/core/database/db";
import { IdeaSparkService } from "@/core/services/ideaspark.service";
import DashboardClient from "./DashboardClient";

const ideaSparkService = new IdeaSparkService();

export default async function DashboardUserPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/auth/signin?callbackUrl=/dashboard-user");
  }

  if (session.user.role !== "DEVELOPER") {
    redirect("/");
  }

  try {
    // Fetch user data directly from database
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      include: {
        clientProfile: true,
        developerProfile: {
          include: {
            skills: {
              include: { skill: true },
            },
          },
        },
      },
    });

    if (!user) {
      redirect("/auth/signin?callbackUrl=/dashboard-user");
    }

    // Fetch follower count for this developer
    const followersCount = await db.follow.count({
      where: { followingId: session.user.id },
    });

    // Combine user data with profile data (same logic as API)
    const userData = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isProfileCompleted: user.isProfileCompleted,
      phoneE164: user.phoneE164,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      lastLoginAt: user.lastLoginAt,
      followersCount,
      // Include profile-specific fields
      ...(user.clientProfile && {
        companyName: user.clientProfile.companyName,
        location: user.clientProfile.location,
        photoUrl: (user.clientProfile as any).photoUrl,
      }),
      ...(user.developerProfile &&
        ({
          photoUrl: user.developerProfile.photoUrl,
          bio: user.developerProfile.bio,
          experienceYears: user.developerProfile.experienceYears,
          level: user.developerProfile.level,
          linkedinUrl: user.developerProfile.linkedinUrl,
          portfolioLinks: user.developerProfile.portfolioLinks,
          location: user.developerProfile.location,
          age: (user.developerProfile as any).age,
          hourlyRate: user.developerProfile.hourlyRateUsd,
          whatsappNumber: user.developerProfile.whatsappNumber,
          usualResponseTimeMs: user.developerProfile.usualResponseTimeMs,
          currentStatus: user.developerProfile.currentStatus,
          adminApprovalStatus: user.developerProfile.adminApprovalStatus,
          whatsappVerified: user.developerProfile.whatsappVerified,
          resumeUrl: user.developerProfile.resumeUrl,
          skills: Array.isArray(user.developerProfile.skills)
            ? user.developerProfile.skills.map((ds) => ({
                skillId: ds.skillId,
                skillName: (ds as any).skill?.name,
              }))
            : [],
        } as any)),
    };

    // Fetch ideas and projects in parallel
    const [ideas, projects] = await Promise.all([
      ideaSparkService
        .getUserIdeas(session.user.id)
        .then((ideas) => ({
          ideas: ideas.slice(0, 6).map((idea) => ({
            id: idea.id,
            title: idea.title,
            summary: idea.summary,
            createdAt: idea.createdAt.toISOString(),
            _count: {
              likes: 0, // TODO: Add actual counts from database
              comments: 0,
              bookmarks: 0,
            },
          })),
        }))
        .catch(() => ({ ideas: [] })),
      fetchProjectsForDeveloper(session.user.id),
    ]);

    return (
      <DashboardClient
        initialSession={{ user: session.user }}
        initialMe={{ user: userData }}
        initialIdeas={ideas}
        initialProjects={projects}
      />
    );
  } catch (error) {
    console.error("Error loading dashboard data:", error);
    // Fallback to client-side loading
    return (
      <DashboardClient
        initialSession={{ user: session.user }}
        initialMe={null}
        initialIdeas={{ ideas: [] }}
        initialProjects={{ projects: [] }}
      />
    );
  }
}

// Helper function to fetch projects (simplified version of the API logic)
async function fetchProjectsForDeveloper(userId: string) {
  try {
    // Get developer profile
    const developerProfile = await db.developerProfile.findUnique({
      where: { userId },
    });

    if (!developerProfile) {
      return { projects: [] };
    }

    // Get assignments for this developer
    const assignments = await db.assignmentCandidate.findMany({
      where: { developerId: developerProfile.id },
      include: {
        project: true,
      },
      orderBy: { assignedAt: "desc" },
    });

    // Transform assignments to match the expected format
    // Only include auto-rotation assignments, exclude manual invites
    const mapped = assignments
      .filter((assignment: any) => assignment.source !== "MANUAL_INVITE")
      .map((assignment: any) => ({
        id: assignment.projectId,
        name:
          assignment.project?.name ||
          assignment.project?.title ||
          "Unknown Project",
        description: assignment.project?.description || "",
        status:
          assignment.responseStatus === "accepted"
            ? ("approved" as const)
            : assignment.responseStatus === "rejected"
              ? ("rejected" as const)
              : assignment.responseStatus === "expired"
                ? ("rejected" as const)
                : ("recent" as const),
        date: (assignment.assignedAt instanceof Date
          ? assignment.assignedAt
          : new Date(assignment.assignedAt)
        ).toISOString(),
        budget: assignment.project?.budget,
        currency: assignment.project?.currency,
        skills:
          assignment.project?.skillsRequired ||
          assignment.project?.requiredSkills ||
          [],
        assignmentStatus: assignment.responseStatus,
        assignment: {
          id: assignment.id,
          acceptanceDeadline: assignment.acceptanceDeadline
            ? (assignment.acceptanceDeadline instanceof Date
                ? assignment.acceptanceDeadline
                : new Date(assignment.acceptanceDeadline)
              ).toISOString()
            : new Date().toISOString(),
          responseStatus: assignment.responseStatus,
          assignedAt: (assignment.assignedAt instanceof Date
            ? assignment.assignedAt
            : new Date(assignment.assignedAt)
          ).toISOString(),
          batchId: assignment.batchId,
          source: assignment.source,
          clientMessage: assignment.clientMessage,
        },
        isManualInvite: false,
      }));

    // Deduplicate by projectId, keep the most recent assignment
    const latestByProject = new Map<string, any>();
    for (const p of mapped) {
      const existing = latestByProject.get(p.id);
      if (
        !existing ||
        new Date(p.date).getTime() > new Date(existing.date).getTime()
      ) {
        latestByProject.set(p.id, p);
      }
    }
    const projects = Array.from(latestByProject.values());

    return { projects };
  } catch (error) {
    console.error("Error fetching projects:", error);
    return { projects: [] };
  }
}
