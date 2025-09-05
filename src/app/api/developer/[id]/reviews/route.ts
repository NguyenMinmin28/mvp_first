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

    // Get reviews for this developer
    const reviews = await prisma.review.findMany({
      where: {
        toUserId: developerProfile.userId, // Reviews received by this developer
        moderationStatus: "published"
      },
      include: {
        fromUser: {
          select: {
            id: true,
            name: true,
            image: true
          }
        },
        project: {
          select: {
            id: true,
            title: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Calculate average rating
    const averageRating = reviews.length > 0 
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
      : 0;

    return NextResponse.json({
      reviews: reviews.map(review => ({
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        createdAt: review.createdAt,
        fromUser: {
          id: review.fromUser.id,
          name: review.fromUser.name,
          image: review.fromUser.image
        },
        project: {
          id: review.project.id,
          title: review.project.title
        }
      })),
      averageRating: Math.round(averageRating * 10) / 10,
      totalReviews: reviews.length
    });

  } catch (error) {
    console.error("Error fetching developer reviews:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
