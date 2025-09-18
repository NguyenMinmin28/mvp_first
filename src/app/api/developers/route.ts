import { NextRequest, NextResponse } from "next/server";
import { getServerSessionUser } from "@/features/auth/auth-server";
import { prisma } from "@/core/database/db";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSessionUser();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");
    const sort = searchParams.get("sort") || "popular";
    const search = searchParams.get("search") || "";
    const offset = (page - 1) * limit;

    // Build where clause
    const where: any = {
      adminApprovalStatus: "approved", // Only show approved developers
    };

    // Add search functionality
    if (search.trim()) {
      const searchTerm = search.trim().toLowerCase();
      
      if (searchTerm.length >= 2) {
        where.OR = [
          // Search in user name
          {
            user: {
              name: {
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

    // Get total count for pagination
    const totalCount = await prisma.developerProfile.count({ where });

    // Build order by clause - prioritize freelancers with services
    let orderBy: any[] = [];
    switch (sort) {
      case "new":
        orderBy = [{ createdAt: "desc" }];
        break;
      case "rating":
        orderBy = [{ createdAt: "desc" }];
        break;
      case "popular":
      default:
        // Prioritize freelancers with services, then by creation date
        orderBy = [{ createdAt: "desc" }];
        break;
    }

    // Fetch developers with pagination
    const developers = await prisma.developerProfile.findMany({
      where,
      skip: offset,
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        skills: {
          include: {
            skill: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        _count: {
          select: {
            services: {
              where: {
                status: "PUBLISHED",
                visibility: "PUBLIC",
              },
            },
          } as any,
        },
      },
    });

    // Sort developers: those with services first, then by the specified order
    const sortedDevelopers = developers.sort((a, b) => {
      const aHasServices = a._count.services > 0;
      const bHasServices = b._count.services > 0;
      
      // If one has services and the other doesn't, prioritize the one with services
      if (aHasServices && !bHasServices) return -1;
      if (!aHasServices && bHasServices) return 1;
      
      // If both have services or both don't have services, use the original orderBy logic
      switch (sort) {
        case "rating":
          return ((b as any).ratingAvg || 0) - ((a as any).ratingAvg || 0);
        case "newest":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case "popular":
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

    // For now, just return developers without services data
    // TODO: Add services data once Prisma client is regenerated
    const orderedDevelopers = sortedDevelopers.map(developer => ({
      ...developer,
      services: [], // Empty services array for now
    }));

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return NextResponse.json({
      success: true,
      data: orderedDevelopers,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage,
        hasPrevPage,
      },
    });
  } catch (error) {
    console.error("Error fetching developers:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch developers" },
      { status: 500 }
    );
  }
}
