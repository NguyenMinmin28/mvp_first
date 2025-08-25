import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
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

    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    // Get all developer profiles with user info and skills
    const developers = await prisma.developerProfile.findMany({
      include: {
        user: {
          select: {
            name: true,
            email: true,
            phoneE164: true,
          }
        },
        skills: {
          include: {
            skill: {
              select: {
                name: true,
                category: true,
              }
            }
          }
        },
        reviewsAggregate: {
          select: {
            averageRating: true,
            totalReviews: true,
          }
        }
      },
      orderBy: [
        { adminApprovalStatus: "asc" }, // pending first
        { createdAt: "desc" }           // newest first
      ]
    });

    // Transform data for frontend
    const transformedDevelopers = developers.map(dev => ({
      id: dev.id,
      userId: dev.userId,
      level: dev.level,
      adminApprovalStatus: dev.adminApprovalStatus,
      currentStatus: dev.currentStatus,
      whatsAppVerified: !!dev.whatsAppNumber, // Check if WhatsApp is set
      createdAt: dev.createdAt,
      updatedAt: dev.updatedAt,
      user: dev.user,
      skills: dev.skills,
      reviewsAggregate: dev.reviewsAggregate
    }));

    return NextResponse.json(transformedDevelopers);

  } catch (error) {
    console.error("Error fetching developers:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
