import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/features/auth/auth";
import { prisma } from "@/core/database/db";
import { z } from "zod";

const createReviewSchema = z.object({
  projectId: z.string(),
  developerId: z.string(),
  rating: z.number().min(1).max(5),
  comment: z.string().min(1),
  deliveryOnTime: z.boolean(),
});

export async function POST(request: NextRequest) {
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
        { error: "Only clients can submit reviews" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { projectId, developerId, rating, comment, deliveryOnTime } = createReviewSchema.parse(body);

    // Verify the project belongs to the client and is completed
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        client: {
          userId: session.user.id
        },
        status: "completed"
      },
      include: {
        currentBatch: {
          include: {
            candidates: {
              where: {
                developerId: developerId,
                responseStatus: "accepted"
              }
            }
          }
        }
      }
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found or not completed" },
        { status: 404 }
      );
    }

    // Check if developer was actually assigned to this project
    if (!project.currentBatch?.candidates?.length) {
      return NextResponse.json(
        { error: "Developer was not assigned to this project" },
        { status: 400 }
      );
    }

    // Get developer's user ID
    const developer = await prisma.developerProfile.findUnique({
      where: { id: developerId },
      select: { userId: true }
    });

    if (!developer) {
      return NextResponse.json(
        { error: "Developer not found" },
        { status: 404 }
      );
    }

    // Check if review already exists
    const existingReview = await prisma.review.findFirst({
      where: {
        projectId: projectId,
        fromUserId: session.user.id,
        toUserId: developer.userId,
        type: "client_for_developer"
      }
    });

    if (existingReview) {
      return NextResponse.json(
        { error: "Review already exists for this project" },
        { status: 400 }
      );
    }

    // Create review in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the review
      const review = await tx.review.create({
        data: {
          type: "client_for_developer",
          fromUserId: session.user.id,
          toUserId: developer.userId,
          projectId: projectId,
          rating: rating,
          comment: comment,
        }
      });

      // Update or create ReviewsAggregate for the developer
      const developerProfile = await tx.developerProfile.findUnique({
        where: { id: developerId },
        include: { reviewsSummary: true }
      });

      if (!developerProfile) {
        throw new Error("Developer profile not found");
      }

      // Get all reviews for this developer
      const allReviews = await tx.review.findMany({
        where: {
          toUserId: developer.userId,
          type: "client_for_developer",
          moderationStatus: "published"
        }
      });

      // Calculate new average rating and total reviews
      const totalReviews = allReviews.length;
      const averageRating = totalReviews > 0 
        ? allReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews 
        : 0;

      // Update or create ReviewsAggregate
      if (developerProfile.reviewsSummary) {
        await tx.reviewsAggregate.update({
          where: { id: developerProfile.reviewsSummary.id },
          data: {
            averageRating: averageRating,
            totalReviews: totalReviews,
            updatedAt: new Date()
          }
        });
      } else {
        const newReviewsSummary = await tx.reviewsAggregate.create({
          data: {
            averageRating: averageRating,
            totalReviews: totalReviews
          }
        });

        await tx.developerProfile.update({
          where: { id: developerId },
          data: {
            reviewsSummaryId: newReviewsSummary.id
          }
        });
      }

      // Check if this is the first review for this project
      const projectReviews = await tx.review.findMany({
        where: {
          projectId: projectId,
          type: "client_for_developer"
        }
      });

      // If this is the first review, mark project as completed
      if (projectReviews.length === 1) {
        await tx.project.update({
          where: { id: projectId },
          data: {
            status: "completed"
          }
        });
      }

      return review;
    });

    return NextResponse.json({
      success: true,
      review: {
        id: result.id,
        rating: result.rating,
        comment: result.comment,
        createdAt: result.createdAt
      }
    });

  } catch (error) {
    console.error("Error creating review:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
