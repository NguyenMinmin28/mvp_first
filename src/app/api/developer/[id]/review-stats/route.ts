import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/features/auth/auth";
import { prisma } from "@/core/database/db";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const developerId = params.id;

    // Check authentication
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Get developer profile to find the user ID
    const developerProfile = await prisma.developerProfile.findUnique({
      where: { id: developerId },
      select: { userId: true }
    });

    if (!developerProfile) {
      return NextResponse.json(
        { error: "Developer not found" },
        { status: 404 }
      );
    }

    // Get reviews for this specific developer
    const reviewStats = await prisma.review.aggregate({
      where: {
        toUserId: developerProfile.userId, // Reviews received by this developer
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
    console.error("Error fetching developer review statistics:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
