export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/database/db";
import { getServerSessionUser } from "@/features/auth/auth-server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(parseInt(searchParams.get("page") || "1"), 1);
    const limit = Math.min(parseInt(searchParams.get("limit") || "12"), 50);
    const sort = searchParams.get("sort") || "popular";
    const search = searchParams.get("search") || "";
    const offset = (page - 1) * limit;

    // Build where clause for published services
    const where: any = {
      status: "PUBLISHED",
      visibility: "PUBLIC",
    };

    // Add search functionality with improved precision
    if (search.trim()) {
      const searchTerm = search.trim().toLowerCase();
      
      // Only search if term is at least 2 characters to avoid too broad results
      if (searchTerm.length >= 2) {
        // Only search in relevant fields for better precision
        where.OR = [
          // Priority 1: Exact title match
          {
            title: {
              contains: searchTerm,
              mode: "insensitive",
            },
          },
          // Priority 2: Skills match (most relevant for service search)
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
          // Priority 3: Categories match
          {
            categories: {
              some: {
                category: {
                  name: {
                    contains: searchTerm,
                    mode: "insensitive",
                  },
                },
              },
            },
          },
          // Priority 4: Short description (only if search term is substantial)
          ...(searchTerm.length >= 3 ? [{
            shortDesc: {
              contains: searchTerm,
              mode: "insensitive",
            },
          }] : []),
          // Priority 5: Developer name (only if search term is substantial)
          ...(searchTerm.length >= 3 ? [{
            developer: {
              user: {
                name: {
                  contains: searchTerm,
                  mode: "insensitive",
                },
              },
            },
          }] : []),
        ];
      } else {
        // For very short search terms, only search in title and skills
        where.OR = [
          {
            title: {
              contains: searchTerm,
              mode: "insensitive",
            },
          },
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

    // Build orderBy based on sort parameter
    let orderBy: any[] = [];
    
    // If searching, prioritize relevance first
    if (search.trim()) {
      // For search results, prioritize by relevance then by popularity
      orderBy = [
        { views: "desc" }, 
        { likesCount: "desc" }, 
        { ratingAvg: "desc" },
        { createdAt: "desc" }
      ];
    } else {
      // For non-search results, use normal sorting
      switch (sort) {
        case "new":
          orderBy = [{ createdAt: "desc" }];
          break;
        case "rating":
          orderBy = [{ ratingAvg: "desc" }, { ratingCount: "desc" }];
          break;
        case "random":
          // For random sorting, we'll use a random seed approach
          // First get all service IDs, then shuffle and take the limit
          const allServices = await (prisma as any).service.findMany({
            where,
            select: { id: true },
          });
          
          // Shuffle the array using Fisher-Yates algorithm
          const shuffled = allServices.sort(() => Math.random() - 0.5);
          const randomIds = shuffled.slice(0, limit).map((s: any) => s.id);
          
          // Return early with random services
          const randomServices = await (prisma as any).service.findMany({
            where: {
              ...where,
              id: { in: randomIds }
            },
            include: {
              developer: {
                include: {
                  user: {
                    select: {
                      id: true,
                      name: true,
                      image: true,
                    },
                  },
                },
              },
              skills: {
                take: 3,
                include: {
                  skill: {
                    select: { name: true },
                  },
                },
              },
              categories: {
                take: 2,
                include: {
                  category: {
                    select: { name: true },
                  },
                },
              },
              _count: {
                select: {
                  leads: true,
                  likes: true,
                  favorites: true,
                },
              },
            },
          });

          // Determine which of these services current user has liked
          const sessionUser = await getServerSessionUser();
          let likedServiceIds = new Set<string>();
          if (sessionUser?.id && randomServices.length > 0) {
            const ids = randomServices.map((s: any) => s.id);
            const likes = await (prisma as any).serviceLike.findMany({
              where: { userId: sessionUser.id, serviceId: { in: ids } },
              select: { serviceId: true },
            });
            likedServiceIds = new Set(likes.map((l: any) => l.serviceId));
          }

          const randomData = randomServices.map((service: any) => ({
            id: service.id,
            slug: service.slug,
            title: service.title,
            shortDesc: service.shortDesc,
            coverUrl: service.coverUrl,
            priceType: service.priceType,
            priceMin: service.priceMin,
            priceMax: service.priceMax,
            deliveryDays: service.deliveryDays,
            ratingAvg: service.ratingAvg,
            ratingCount: service.ratingCount,
            views: service.views,
            likesCount: service.likesCount,
            favoritesCount: service.favoritesCount,
            userLiked: likedServiceIds.has(service.id),
            developer: {
              id: service.developer.id,
              name: service.developer.user?.name,
              image: service.developer.user?.image || service.developer.photoUrl,
              location: service.developer.location,
            },
            skills: service.skills.map((s: any) => s.skill?.name).filter(Boolean),
            categories: service.categories.map((c: any) => c.category?.name).filter(Boolean),
            leadsCount: service._count?.leads || 0,
          }));

          return NextResponse.json({ 
            success: true, 
            data: randomData,
            pagination: {
              page,
              limit,
              totalCount: allServices.length,
              totalPages: Math.ceil(allServices.length / limit),
              hasNextPage: false, // Random doesn't support pagination
              hasPrevPage: false,
            }
          });
        case "popular":
        default:
          orderBy = [{ views: "desc" }, { likesCount: "desc" }, { ratingAvg: "desc" }];
          break;
      }
    }

    // Get total count for pagination
    const totalCount = await (prisma as any).service.count({ where });

    const services = await (prisma as any).service.findMany({
      where,
      include: {
        developer: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
        },
        skills: {
          take: 3,
          include: {
            skill: {
              select: { name: true },
            },
          },
        },
        categories: {
          take: 2,
          include: {
            category: {
              select: { name: true },
            },
          },
        },
        _count: {
          select: {
            leads: true,
            likes: true,
            favorites: true,
          },
        },
      },
      orderBy,
      skip: offset,
      take: limit,
    });

    // Determine which of these services current user has liked
    const sessionUser = await getServerSessionUser();
    let likedServiceIds = new Set<string>();
    if (sessionUser?.id && services.length > 0) {
      const ids = services.map((s: any) => s.id);
      const likes = await (prisma as any).serviceLike.findMany({
        where: { userId: sessionUser.id, serviceId: { in: ids } },
        select: { serviceId: true },
      });
      likedServiceIds = new Set(likes.map((l: any) => l.serviceId));
    }

    const data = services.map((service: any) => ({
      id: service.id,
      slug: service.slug,
      title: service.title,
      shortDesc: service.shortDesc,
      coverUrl: service.coverUrl,
      priceType: service.priceType,
      priceMin: service.priceMin,
      priceMax: service.priceMax,
      deliveryDays: service.deliveryDays,
      ratingAvg: service.ratingAvg,
      ratingCount: service.ratingCount,
      views: service.views,
      likesCount: service.likesCount,
      favoritesCount: service.favoritesCount,
      userLiked: likedServiceIds.has(service.id),
      developer: {
        id: service.developer.id,
        name: service.developer.user?.name,
        image: service.developer.user?.image || service.developer.photoUrl,
        location: service.developer.location,
      },
      skills: service.skills.map((s: any) => s.skill?.name).filter(Boolean),
      categories: service.categories.map((c: any) => c.category?.name).filter(Boolean),
      leadsCount: service._count?.leads || 0,
    }));

    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return NextResponse.json({ 
      success: true, 
      data,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage,
        hasPrevPage,
      }
    });
  } catch (error) {
    console.error("Error fetching services:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

