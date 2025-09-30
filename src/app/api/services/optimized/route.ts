import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import authOptions from "../../../../../config/auth.config";
import { prisma } from "@/core/database/db";

/**
 * Optimized Services API với projection và keyset pagination
 * Giảm tải database và tăng tốc độ response
 */

interface CursorData {
  ratingAvg?: number;
  views?: number;
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

function createCursor(doc: any, sortBy: string): string {
  const cursorData: CursorData = { id: doc.id };
  
  switch (sortBy) {
    case 'popular':
      cursorData.ratingAvg = doc.ratingAvg;
      cursorData.views = doc.views;
      break;
    case 'newest':
      cursorData.createdAt = doc.createdAt;
      break;
    case 'priceAsc':
    case 'priceDesc':
      cursorData.ratingAvg = doc.ratingAvg; // fallback
      break;
  }
  
  return Buffer.from(JSON.stringify(cursorData)).toString('base64');
}

function buildCursorMatch(cursor: CursorData | null, sortBy: string): any {
  if (!cursor) return {};
  
  switch (sortBy) {
    case 'popular':
      return {
        OR: [
          { ratingAvg: { lt: cursor.ratingAvg } },
          { 
            ratingAvg: cursor.ratingAvg,
            views: { lt: cursor.views }
          },
          {
            ratingAvg: cursor.ratingAvg,
            views: cursor.views,
            id: { gt: cursor.id }
          }
        ]
      };
    case 'newest':
      return {
        OR: [
          { createdAt: { lt: cursor.createdAt } },
          {
            createdAt: cursor.createdAt,
            id: { gt: cursor.id }
          }
        ]
      };
    case 'priceAsc':
      return {
        OR: [
          { priceMin: { gt: cursor.ratingAvg } }, // using ratingAvg as priceMin fallback
          {
            priceMin: cursor.ratingAvg,
            id: { gt: cursor.id }
          }
        ]
      };
    case 'priceDesc':
      return {
        OR: [
          { priceMin: { lt: cursor.ratingAvg } },
          {
            priceMin: cursor.ratingAvg,
            id: { gt: cursor.id }
          }
        ]
      };
    default:
      return {};
  }
}

function buildSortOrder(sortBy: string): any[] {
  switch (sortBy) {
    case 'popular':
      return [
        { ratingAvg: 'desc' },
        { views: 'desc' },
        { id: 'asc' }
      ];
    case 'newest':
      return [
        { createdAt: 'desc' },
        { id: 'asc' }
      ];
    case 'priceAsc':
      return [
        { priceMin: 'asc' },
        { id: 'asc' }
      ];
    case 'priceDesc':
      return [
        { priceMin: 'desc' },
        { id: 'asc' }
      ];
    default:
      return [
        { ratingAvg: 'desc' },
        { views: 'desc' },
        { id: 'asc' }
      ];
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log('🚀 Optimized Services API called');
    
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(request.url);
    
    // Parse parameters
    const limit = Math.min(parseInt(searchParams.get('limit') || '12'), 50);
    const sortBy = searchParams.get('sort') || 'popular';
    const search = searchParams.get('search') || '';
    const categories = searchParams.get('categories')?.split(',') || [];
    const skills = searchParams.get('skills')?.split(',') || [];
    const priceMin = searchParams.get('priceMin');
    const priceMax = searchParams.get('priceMax');
    const myServices = searchParams.get('myServices') === 'true';
    const cursor = searchParams.get('cursor');
    
    console.log('📊 API params:', { limit, sortBy, search, categories, skills, myServices, cursor: !!cursor });

    // Build base where clause
    const where: any = {
      status: 'PUBLISHED',
      visibility: 'PUBLIC'
    };

    // Handle "My Services" filter
    if (myServices && session?.user?.id) {
      const developer = await prisma.developerProfile.findUnique({
        where: { userId: session.user.id },
        select: { id: true }
      });
      
      if (developer) {
        where.developerId = developer.id;
        where.status = { in: ['DRAFT', 'PUBLISHED'] };
      } else {
        where.developerId = 'nonexistent';
      }
    }

    // Add search filter
    if (search.trim()) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { shortDesc: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Add category filter
    if (categories.length > 0) {
      where.categories = {
        some: {
          category: {
            name: { in: categories }
          }
        }
      };
    }

    // Add skills filter
    if (skills.length > 0) {
      where.skills = {
        some: {
          skill: {
            name: { in: skills }
          }
        }
      };
    }

    // Add price filter
    if (priceMin || priceMax) {
      where.priceMin = {};
      if (priceMin) where.priceMin.gte = parseInt(priceMin);
      if (priceMax) where.priceMin.lte = parseInt(priceMax);
    }

    // Add cursor filter for keyset pagination
    const cursorData = parseCursor(cursor || undefined);
    if (cursorData) {
      const cursorMatch = buildCursorMatch(cursorData, sortBy);
      where.AND = where.AND || [];
      where.AND.push(cursorMatch);
    }

    console.log('🔍 Where clause:', JSON.stringify(where, null, 2));

    // Build sort order
    const orderBy = buildSortOrder(sortBy);
    console.log('📈 Sort order:', orderBy);

    // Query with optimized projection
    const services = await prisma.service.findMany({
      where,
      select: {
        id: true,
        slug: true,
        title: true,
        shortDesc: true,
        priceType: true,
        priceMin: true,
        priceMax: true,
        deliveryDays: true,
        ratingAvg: true,
        ratingCount: true,
        views: true,
        likesCount: true,
        createdAt: true,
        _count: {
          select: {
            leads: true
          }
        },
        developer: {
          select: {
            id: true,
            location: true,
            user: {
              select: {
                id: true,
                name: true,
                image: true
              }
            }
          }
        },
        coverUrl: true // Sử dụng coverUrl thay vì media join
      },
      orderBy,
      take: limit + 1 // Lấy thêm 1 để check hasNextPage
    });

    console.log(`📊 Query returned ${services.length} services`);

    // Check if there are more pages
    const hasNextPage = services.length > limit;
    const data = hasNextPage ? services.slice(0, limit) : services;
    
    // Create next cursor
    const nextCursor = hasNextPage && data.length > 0 
      ? createCursor(data[data.length - 1], sortBy)
      : null;

    // Transform data for response
    const transformedData = data.map(service => ({
      ...service,
      // Sử dụng coverUrl trực tiếp cho galleryImages (array of strings)
      galleryImages: service.coverUrl ? [service.coverUrl] : [],
      // Add leadsCount từ _count
      leadsCount: service._count.leads,
      // Add empty arrays for compatibility
      skills: [],
      categories: []
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

    console.log('✅ Optimized API response ready');
    return NextResponse.json(response);

  } catch (error) {
    console.error("❌ Error in optimized services API:", error);
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
