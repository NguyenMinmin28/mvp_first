import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/features/auth/auth";
import { prisma } from "@/core/database/db";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get ideas statistics
    const [
      totalIdeas,
      approvedIdeas,
      pendingIdeas,
      totalLikes,
      totalComments,
      totalBookmarks,
      totalConnects,
      recentIdeas
    ] = await Promise.all([
      // Total ideas
      (prisma as any).idea.count(),
      
      // Approved ideas
      (prisma as any).idea.count({
        where: {
          status: "APPROVED"
        }
      }),
      
      // Pending ideas
      (prisma as any).idea.count({
        where: {
          status: "PENDING"
        }
      }),
      
      // Total likes across all ideas
      (prisma as any).ideaLike.count(),
      
      // Total comments across all ideas
      (prisma as any).ideaComment.count(),
      
      // Total bookmarks across all ideas
      (prisma as any).ideaBookmark.count(),
      
      // Total connects across all ideas
      (prisma as any).ideaConnect.count(),
      
      // Recent ideas (last 30 days)
      (prisma as any).idea.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        }
      })
    ]);

    // Calculate engagement rate
    const engagementRate = totalIdeas > 0 ? Math.round(((totalLikes + totalComments + totalBookmarks) / totalIdeas) * 100) : 0;

    // Get top categories from skills
    const topCategories = await (prisma as any).skill.groupBy({
      by: ['category'],
      _count: {
        category: true
      },
      orderBy: {
        _count: {
          category: 'desc'
        }
      },
      take: 5
    });

    return NextResponse.json({
      success: true,
      stats: {
        totalIdeas,
        approvedIdeas,
        pendingIdeas,
        totalLikes,
        totalComments,
        totalBookmarks,
        totalConnects,
        recentIdeas,
        engagementRate,
        topCategories: topCategories.map(cat => ({
          category: cat.category,
          count: cat._count.category
        }))
      }
    });

  } catch (error) {
    console.error("Error fetching ideas stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch ideas stats" },
      { status: 500 }
    );
  }
}
