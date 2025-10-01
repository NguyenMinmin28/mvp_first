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

    // Get pagination and filter parameters from URL
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const filter = searchParams.get('filter') || 'all';
    const search = searchParams.get('search') || '';
    const skip = (page - 1) * limit;

    // Build where clause based on filter and search
    let whereClause: any = {};
    
    // Apply filter conditions
    if (filter !== 'all') {
      if (filter === 'whatsapp-verified') {
        whereClause.whatsappVerified = true;
      } else if (filter === 'whatsapp-not-verified') {
        whereClause.whatsappVerified = false;
      } else {
        whereClause.adminApprovalStatus = filter;
      }
    }

    // Add search functionality
    if (search.trim()) {
      const searchTerm = search.trim().toLowerCase();
      
      if (searchTerm.length >= 2) {
        whereClause.OR = [
          // Search in user name
          {
            user: {
              name: {
                contains: searchTerm,
                mode: "insensitive",
              },
            },
          },
          // Search in user email
          {
            user: {
              email: {
                contains: searchTerm,
                mode: "insensitive",
              },
            },
          },
          // Search in bio
          {
            bio: {
              contains: searchTerm,
              mode: "insensitive",
            },
          },
          // Search in location
          {
            location: {
              contains: searchTerm,
              mode: "insensitive",
            },
          },
          // Search in skills
          {
            skills: {
              some: {
                skill: {
                  name: {
                    contains: searchTerm,
                    mode: "insensitive",
                  },
                },
              },
            },
          },
        ];
      }
    }

    // Get total count for pagination with filter
    const totalCount = await prisma.developerProfile.count({
      where: whereClause,
    });

    const developers = await prisma.developerProfile.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            name: true,
            email: true,
            phoneE164: true,
          },
        },
        skills: {
          include: {
            skill: {
              select: {
                name: true,
                category: true,
              },
            },
          },
        },
        _count: {
          select: {
            assignmentCandidates: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: limit,
    });

    // Get reviews data for each developer
    const developersWithReviews = await Promise.all(
      developers.map(async (developer) => {
        const reviewsAggregate = await prisma.review.aggregate({
          where: {
            toUserId: developer.userId, // Use toUserId instead of developerId
          },
          _avg: {
            rating: true,
          },
          _count: {
            rating: true,
          },
        });

        return {
          ...developer,
          reviewsAggregate: {
            averageRating: reviewsAggregate._avg.rating || 0,
            totalReviews: reviewsAggregate._count.rating || 0,
          },
        };
      })
    );

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      success: true,
      developers: developersWithReviews,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error("Error fetching developers for admin:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

