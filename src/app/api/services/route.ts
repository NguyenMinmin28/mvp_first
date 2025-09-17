export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/database/db";
import { getServerSessionUser } from "@/features/auth/auth-server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "5"), 10);
    const sort = searchParams.get("sort") || "popular";

    // Build where clause for published services
    const where: any = {
      status: "PUBLISHED",
      visibility: "PUBLIC",
    };

    // Build orderBy based on sort parameter
    let orderBy: any[] = [];
    switch (sort) {
      case "new":
        orderBy = [{ createdAt: "desc" }];
        break;
      case "rating":
        orderBy = [{ ratingAvg: "desc" }, { ratingCount: "desc" }];
        break;
      case "popular":
      default:
        orderBy = [{ views: "desc" }, { likesCount: "desc" }, { ratingAvg: "desc" }];
        break;
    }

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

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error fetching services:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

