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
    const filters = searchParams.get("filters") ? searchParams.get("filters")!.split(",") : [];
    const offset = (page - 1) * limit;

    // Build where clause
    const where: any = {
      adminApprovalStatus: "approved", // Only show approved developers
    };

    // Add filter functionality
    if (filters.length > 0) {
      const filterConditions: any[] = [];
      
      filters.forEach(filter => {
        switch (filter) {
          case "Starter":
            filterConditions.push({ level: "FRESHER" });
            break;
          case "Professional":
            filterConditions.push({ 
              OR: [
                { level: "MID" },
                { level: "EXPERT" }
              ]
            });
            break;
          case "Ready to Work":
            // Use availabilityStatus (independent from online/offline)
            filterConditions.push({ 
              availabilityStatus: "available"
            });
            break;
          case "Others":
            // Others: exclude "available" status
            filterConditions.push({
              availabilityStatus: { 
                not: "available"
              }
            });
            break;
        }
      });
      
      if (filterConditions.length > 0) {
        // Use AND logic to combine all filter conditions
        where.AND = where.AND || [];
        where.AND.push(...filterConditions);
      }
    }

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
      select: {
        id: true,
        bio: true,
        location: true,
        hourlyRateUsd: true,
        level: true,
        currentStatus: true, // Deprecated - kept for backward compatibility
        accountStatus: true, // Online/Offline status
        availabilityStatus: true, // Available/Not Available status
        photoUrl: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        skills: {
          select: {
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
            assignmentCandidates: {
              where: {
                responseStatus: 'accepted'
              }
            }
          },
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

    // Get additional stats for each developer
    const developerIds = sortedDevelopers.map(d => d.id);
    const userIds = sortedDevelopers.map(d => d.user.id);
    
    // Get followers count for each developer
    const followersData = await prisma.follow.groupBy({
      by: ['followingId'],
      where: {
        followingId: { in: userIds }
      },
      _count: {
        followingId: true
      }
    });
    
    const followersMap = new Map(
      followersData.map(f => [f.followingId, f._count.followingId])
    );
    
    // Get earned amount from completed projects
    const earnedCandidates = await prisma.assignmentCandidate.findMany({
      where: {
        developerId: { in: developerIds },
        responseStatus: 'accepted',
        project: {
          status: 'completed'
        }
      },
      select: {
        developerId: true,
        project: {
          select: {
            budget: true,
            budgetMin: true,
            budgetMax: true,
            title: true
          }
        }
      }
    });
    
    console.log(`💰 Found ${earnedCandidates.length} completed projects for earnings calculation`);
    earnedCandidates.forEach(candidate => {
      const project = candidate.project;
      const budget = project?.budget || 0;
      const budgetMin = project?.budgetMin || 0;
      const budgetMax = project?.budgetMax || 0;
      const finalBudget = budget || (budgetMin + budgetMax) / 2 || 0;
      console.log(`💰 Developer ${candidate.developerId}: Project "${project?.title}" - Budget: ${budget}, Min: ${budgetMin}, Max: ${budgetMax}, Final: ${finalBudget}`);
    });
    
    const earnedMap = new Map<string, number>();
    earnedCandidates.forEach(candidate => {
      const current = earnedMap.get(candidate.developerId) || 0;
      const project = candidate.project;
      const budget = project?.budget || 0;
      const budgetMin = project?.budgetMin || 0;
      const budgetMax = project?.budgetMax || 0;
      const finalBudget = budget || (budgetMin + budgetMax) / 2 || 0;
      earnedMap.set(candidate.developerId, current + finalBudget);
    });
    
    console.log('💰 Final earned amounts:', Object.fromEntries(earnedMap));
    
    // Get ratings for each developer
    const ratingPromises = sortedDevelopers.map(async (developer) => {
      const reviewsAggregate = await prisma.review.aggregate({
        where: {
          toUserId: developer.user.id, // Use toUserId instead of developerId
          moderationStatus: "published"
        },
        _avg: {
          rating: true,
        },
        _count: {
          rating: true,
        },
      });
      
      return {
        developerId: developer.id,
        averageRating: reviewsAggregate._avg.rating || 0,
        totalReviews: reviewsAggregate._count.rating || 0,
      };
    });
    
    const ratingResults = await Promise.all(ratingPromises);
    const ratingMap = new Map(
      ratingResults.map(r => [r.developerId, { averageRating: r.averageRating, totalReviews: r.totalReviews }])
    );

    // For now, just return developers without services data
    // TODO: Add services data once Prisma client is regenerated
    const orderedDevelopers = sortedDevelopers.map(developer => ({
      ...developer,
      services: [], // Empty services array for now
      // Add real stats
      followersCount: followersMap.get(developer.user.id) || 0,
      ratingAvg: ratingMap.get(developer.id)?.averageRating || 0,
      ratingCount: ratingMap.get(developer.id)?.totalReviews || 0,
      hiredCount: developer._count.assignmentCandidates,
      earnedAmount: earnedMap.get(developer.id) || 0
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
