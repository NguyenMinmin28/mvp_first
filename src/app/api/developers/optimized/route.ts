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
    const cursor = searchParams.get('cursor');

    console.log('📊 API params:', { limit, sortBy, search, cursor: !!cursor });

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
            }
          }
        }
      },
      orderBy,
      take: limit + 1
    });

    console.log(`📊 Query returned ${developers.length} developers`);

    // Check if there are more pages
    const hasNextPage = developers.length > limit;
    const data = hasNextPage ? developers.slice(0, limit) : developers;
    
    // Create next cursor
    const nextCursor = hasNextPage && data.length > 0 
      ? createCursor(data[data.length - 1])
      : null;

    // Get developer IDs for batch services loading
    const developerIds = data.map(d => d.id);
    console.log(`🔍 Loading services for ${developerIds.length} developers`);

    // Batch load services for all developers
    const developerServices = await prisma.service.findMany({
      where: {
        developerId: { in: developerIds },
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
      skills: developer.skills.map(s => s.skill.name)
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
