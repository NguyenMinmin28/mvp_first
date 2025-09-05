import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
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

    // Get user's review statistics
    const reviewStats = await prisma.review.aggregate({
      where: {
        toUserId: session.user.id, // Reviews received by this user
        moderationStatus: "published"
      },
      _avg: {
        rating: true
      },
      _count: {
        rating: true
      }
    });

    const averageRating = reviewStats._avg.rating || 0;
    const totalReviews = reviewStats._count.rating || 0;

    return NextResponse.json({
      averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal place
      totalReviews: totalReviews
    });

  } catch (error) {
    console.error("Error fetching review statistics:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
