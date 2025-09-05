import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/features/auth/auth";
import { prisma } from "@/core/database/db";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Handle both single review and array of reviews
    const reviews = Array.isArray(body.reviews) ? body.reviews : [body];
    
    if (reviews.length === 0) {
      return NextResponse.json(
        { error: "No reviews provided" },
        { status: 400 }
      );
    }

    // Validate each review
    for (const review of reviews) {
      if (!review.projectId || !review.developerId || !review.rating) {
        return NextResponse.json(
          { error: "Missing required fields" },
          { status: 400 }
        );
      }
    }

    // Process each review
    const createdReviews = [];
    for (const reviewData of reviews) {
      const { projectId, developerId, rating, comment, deliveryOnTime } = reviewData;

      // Verify the project belongs to the client
      const project = await prisma.project.findFirst({
        where: {
          id: projectId,
          client: {
            userId: session.user.id
          }
        }
      });

      if (!project) {
        continue; // Skip this review
      }

      // Get developer user ID
      const developer = await prisma.developerProfile.findUnique({
        where: { id: developerId },
        select: { userId: true }
      });

      if (!developer) {
        continue; // Skip this review
      }

      // Check if review already exists
      const existingReview = await prisma.review.findFirst({
        where: {
          projectId,
          fromUserId: session.user.id,
          toUserId: developer.userId
        }
      });

      if (existingReview) {
        continue; // Skip this review
      }

      // Create the review
      const review = await prisma.review.create({
        data: {
          projectId,
          fromUserId: session.user.id,
          toUserId: developer.userId,
          rating,
          comment: comment || "",
          type: "client_for_developer"
        }
      });

      createdReviews.push({
        id: review.id,
        projectId: review.projectId,
        developerId: developerId,
        rating: review.rating,
        comment: review.comment
      });
    }

    return NextResponse.json({
      success: true,
      message: `Successfully created ${createdReviews.length} reviews`,
      reviews: createdReviews
    });

  } catch (error) {
    console.error("Error creating review:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}