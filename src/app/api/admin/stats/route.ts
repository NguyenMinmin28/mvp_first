export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/features/auth/auth";
import { prisma } from "@/core/database/db";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get all client IDs that exist
    const existingClientIds = await prisma.clientProfile.findMany({
      select: {
        id: true,
      },
    });

    const validClientIds = existingClientIds.map(client => client.id);

    // If no valid clients found, return empty stats
    if (validClientIds.length === 0) {
      return NextResponse.json({
        success: true,
        stats: {
          totalProjects: 0,
          activeProjects: 0,
          completedProjects: 0,
          totalDevelopers: 0,
          approvedDevelopers: 0,
          pendingApprovals: 0,
          totalBlogPosts: 0,
          publishedPosts: 0,
          draftPosts: 0,
        }
      });
    }

    // Get project statistics
    const [
      totalProjects,
      activeProjects,
      completedProjects,
      totalDevelopers,
      approvedDevelopers,
      pendingApprovals,
      totalBlogPosts,
      publishedPosts,
      draftPosts
    ] = await Promise.all([
      // Total projects
      prisma.project.count({
        where: {
          clientId: {
            in: validClientIds,
          },
        },
      }),
      
      // Active projects (assigning, accepted, in_progress)
      prisma.project.count({
        where: {
          clientId: {
            in: validClientIds,
          },
          status: {
            in: ["assigning", "accepted", "in_progress"]
          }
        },
      }),
      
      // Completed projects
      prisma.project.count({
        where: {
          clientId: {
            in: validClientIds,
          },
          status: "completed"
        },
      }),
      
      // Total developers
      prisma.developerProfile.count(),
      
      // Approved developers
      prisma.developerProfile.count({
        where: {
          adminApprovalStatus: "approved"
        }
      }),
      
      // Pending approvals
      prisma.developerProfile.count({
        where: {
          adminApprovalStatus: "pending"
        }
      }),
      
      // Total blog posts
      (prisma as any).post.count(),
      
      // Published posts
      (prisma as any).post.count({
        where: {
          status: "PUBLISHED"
        }
      }),
      
      // Draft posts
      (prisma as any).post.count({
        where: {
          status: "DRAFT"
        }
      }),
    ]);

    return NextResponse.json({
      success: true,
      stats: {
        totalProjects,
        activeProjects,
        completedProjects,
        totalDevelopers,
        approvedDevelopers,
        pendingApprovals,
        totalBlogPosts,
        publishedPosts,
        draftPosts,
      }
    });
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
