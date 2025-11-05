import { NextRequest, NextResponse } from "next/server";
import { getServerSessionUser } from "@/features/auth/auth-server";
import { prisma } from "@/core/database/db";

/**
 * Optimized Developers API với batch services loading
 * Giảm từ N+1 queries xuống 2 queries
 */

interface CursorData {
  createdAt?: string;
  id: string;
}

function parseCursor(cursor?: string): CursorData | null {
  if (!cursor) return null;
  try {
    const decoded = Buffer.from(cursor, 'base64').toString('utf-8');
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

function createCursor(doc: any): string {
  const cursorData: CursorData = { 
    id: doc.id,
    createdAt: doc.createdAt
  };
  return Buffer.from(JSON.stringify(cursorData)).toString('base64');
}

export async function GET(request: NextRequest) {
  try {
    console.log('🚀 Optimized Developers API called');
    
    // Không yêu cầu authentication cho public listing
    // const session = await getServerSessionUser();
    // if (!session) {
    //   return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    // }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '12'), 50);
    const sortBy = searchParams.get('sort') || 'popular';
    const search = searchParams.get('search') || '';
    const filters = searchParams.get("filters") ? searchParams.get("filters")!.split(",") : [];
    const skills = searchParams.get("skills") ? searchParams.get("skills")!.split(",") : [];
    const priceMin = searchParams.get("priceMin");
    const priceMax = searchParams.get("priceMax");
    const currency = searchParams.get("currency") || "USD";
    const paymentType = searchParams.get("paymentType");
    const level = searchParams.get("level") ? searchParams.get("level")!.split(",") : [];
    const location = searchParams.get("location");
    const availability = searchParams.get("availability") ? searchParams.get("availability")!.split(",") : [];
    const cursor = searchParams.get('cursor');

    console.log('📊 API params:', { limit, sortBy, search, filters, skills, priceMin, priceMax, currency, paymentType, level, location, availability, cursor: !!cursor });

    // Build where clause
    const where: any = {
      adminApprovalStatus: 'approved'
    };

    // Add search filter
    if (search.trim()) {
      where.OR = [
        { user: { name: { contains: search, mode: 'insensitive' } } },
        { bio: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } }
      ];
    }

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
            filterConditions.push({ 
              currentStatus: { 
                in: ["available", "online"] 
              } 
            });
            break;
          case "Others":
            // Others: only apply filtering when skills are selected
            // If no skills selected, don't add any filter condition for Others
            break;
        }
      });
      
      if (filterConditions.length > 0) {
        // Use AND logic to combine all filter conditions
        where.AND = where.AND || [];
        where.AND.push(...filterConditions);
        
        // If we already have OR conditions from search, we need to combine them
        if (where.OR) {
          where.AND.push({ OR: where.OR });
          delete where.OR;
        }
      }
    }

    // Add skills filtering (only when Others filter is selected)
    if (skills.length > 0 && filters.includes("Others")) {
      console.log('🔍 API - Applying skills filtering:', skills);
      where.AND = where.AND || [];
      where.AND.push({
        skills: {
          some: {
            skillId: {
              in: skills
            }
          }
        }
      });
    }

    // Add new filter parameters
    if (level.length > 0) {
      where.AND = where.AND || [];
      where.AND.push({
        level: {
          in: level
        }
      });
    }

    if (location && location.trim()) {
      where.AND = where.AND || [];
      where.AND.push({
        location: {
          contains: location.trim(),
          mode: 'insensitive'
        }
      });
    }

    if (availability.length > 0) {
      where.AND = where.AND || [];
      where.AND.push({
        currentStatus: {
          in: availability
        }
      });
    }

    // Add price range filtering (based on hourly rate or services)
    if (priceMin || priceMax) {
      where.AND = where.AND || [];
      
      // Convert price to USD if needed (simplified - in real app you'd use exchange rates)
      const minPrice = priceMin ? parseFloat(priceMin) : 0;
      const maxPrice = priceMax ? parseFloat(priceMax) : Number.MAX_SAFE_INTEGER;
      
      // Filter by hourly rate
      if (paymentType === "hourly" || paymentType === "both") {
        where.AND.push({
          hourlyRateUsd: {
            gte: minPrice,
            lte: maxPrice
          }
        });
      }
      
      // For fixed price, we'd need to join with services table
      // This is a simplified approach - in production you'd want more sophisticated filtering
      if (paymentType === "fixed" || paymentType === "both") {
        where.AND.push({
          services: {
            some: {
              status: 'PUBLISHED',
              visibility: 'PUBLIC',
              OR: [
                {
                  priceMin: {
                    gte: minPrice,
                    lte: maxPrice
                  }
                },
                {
                  priceMax: {
                    gte: minPrice,
                    lte: maxPrice
                  }
                }
              ]
            }
          }
        });
      }
    }

    // Add cursor filter for keyset pagination
    const cursorData = parseCursor(cursor || undefined);
    if (cursorData) {
      where.AND = where.AND || [];
      where.AND.push({
        OR: [
          { createdAt: { lt: cursorData.createdAt } },
          {
            createdAt: cursorData.createdAt,
            id: { gt: cursorData.id }
          }
        ]
      });
    }

    // Build sort order
    const orderBy = [
      { createdAt: 'desc' as const },
      { id: 'asc' as const }
    ];

    console.log('🔍 Where clause:', JSON.stringify(where, null, 2));

    // Query developers with optimized projection
    const developers = await prisma.developerProfile.findMany({
      where,
        select: {
          id: true,
          bio: true,
          location: true,
          hourlyRateUsd: true,
          level: true,
          currentStatus: true,
          photoUrl: true,
          createdAt: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        },
        skills: {
          select: {
            skill: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        _count: {
          select: {
            services: {
              where: {
                status: 'PUBLISHED',
                visibility: 'PUBLIC'
              }
            },
            assignmentCandidates: {
              where: {
                responseStatus: 'accepted'
              }
            }
          }
        }
      },
      orderBy,
      take: limit + 1
    });

    console.log(`📊 Query returned ${developers.length} developers`);
    
    // Debug: Check if skills filtering is working
    if (skills.length > 0 && filters.includes("Others")) {
      console.log('🔍 Skills filtering debug:');
      console.log('- Selected skills:', skills);
      console.log('- Developers found:', developers.length);
      if (developers.length > 0) {
        console.log('- Sample developer skills:', developers[0].skills?.map(s => ({ id: s.skill.id, name: s.skill.name })) || []);
      }
    }
    
    // Debug: Check skills data structure for all developers
    console.log('🔍 All developers skills debug:');
    developers.slice(0, 3).forEach((dev, index) => {
      console.log(`Developer ${index + 1}:`, {
        id: dev.id,
        name: dev.user.name,
        skills: dev.skills?.map(s => ({ id: s.skill.id, name: s.skill.name })) || [],
        skillsRaw: dev.skills || []
      });
    });

    // Check if there are more pages
    const hasNextPage = developers.length > limit;
    const data = hasNextPage ? developers.slice(0, limit) : developers;

    // Get additional stats for each developer
    const developerIds = data.map(d => d.id);
    const userIds = data.map(d => d.user.id);
    
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
    const ratingPromises = data.map(async (developer) => {
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
    
    // Create next cursor
    const nextCursor = hasNextPage && data.length > 0 
      ? createCursor(data[data.length - 1])
      : null;

    // Get developer IDs for batch services loading
    const serviceDeveloperIds = data.map(d => d.id);
    console.log(`🔍 Loading services for ${serviceDeveloperIds.length} developers`);

    // Batch load services for all developers
    const developerServices = await prisma.service.findMany({
      where: {
        developerId: { in: serviceDeveloperIds },
        status: 'PUBLISHED',
        visibility: 'PUBLIC'
      },
      select: {
        id: true,
        title: true,
        coverUrl: true,
        priceMin: true,
        priceMax: true,
        priceType: true,
        ratingAvg: true,
        ratingCount: true,
        views: true,
        likesCount: true,
        developerId: true,
        // Chỉ lấy 1 thumbnail cho mỗi service
        media: {
          where: {
            kind: 'IMAGE',
            sortOrder: { gte: 1, lte: 1 }
          },
          select: {
            url: true
          },
          take: 1
        }
      },
      orderBy: [
        { ratingAvg: 'desc' },
        { views: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    // Group services by developer ID
    const servicesByDeveloper = developerServices.reduce((acc, service) => {
      const devId = service.developerId;
      if (!acc[devId]) acc[devId] = [];
      acc[devId].push({
        ...service,
        coverUrl: service.media[0]?.url || service.coverUrl
      });
      return acc;
    }, {} as Record<string, any[]>);

    console.log(`📊 Loaded services for ${Object.keys(servicesByDeveloper).length} developers`);

    // Transform data for response
    const transformedData = data.map(developer => ({
      ...developer,
      currentStatus: developer.currentStatus,
      services: (servicesByDeveloper[developer.id] || []).slice(0, 4), // Limit to 4 services
      skills: developer.skills.map(s => ({
        id: s.skill.id,
        name: s.skill.name
      })),
      // Add real stats
      followersCount: followersMap.get(developer.user.id) || 0,
      ratingAvg: ratingMap.get(developer.id)?.averageRating || 0,
      ratingCount: ratingMap.get(developer.id)?.totalReviews || 0,
      hiredCount: developer._count.assignmentCandidates,
      earnedAmount: earnedMap.get(developer.id) || 0
    }));

    const response = {
      success: true,
      data: transformedData,
      pagination: {
        hasNextPage,
        nextCursor,
        limit
      }
    };

    console.log('✅ Optimized developers API response ready');
    return NextResponse.json(response);

  } catch (error) {
    console.error("❌ Error in optimized developers API:", error);
    return NextResponse.json(
      { 
        success: false,
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
