import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/database/db";
import { getServerSessionUser } from "@/features/auth/auth-server";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSessionUser();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const serviceId = params.id;

    // Fetch service with all related data
    const service = await (prisma as any).service.findUnique({
      where: {
        id: serviceId,
        status: "PUBLISHED",
        visibility: "PUBLIC",
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
          include: {
            skill: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        categories: {
          include: {
            category: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        _count: {
          select: {
            leads: true,
          },
        },
      },
    });

    if (!service) {
      return NextResponse.json({ success: false, error: "Service not found" }, { status: 404 });
    }

    // Check if current user has liked this service
    let userLiked = false;
    if (session.id) {
      const like = await (prisma as any).serviceLike.findUnique({
        where: {
          userId_serviceId: {
            userId: session.id,
            serviceId: service.id,
          },
        },
      });
      userLiked = !!like;
    }

    // Format the response
    const data = {
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
      userLiked,
      developer: {
        id: service.developer.id,
        name: service.developer.user.name,
        image: service.developer.user.image,
        location: service.developer.location,
      },
      skills: service.skills.map((s: any) => s.skill.name),
      categories: service.categories.map((c: any) => c.category.name),
      leadsCount: service._count.leads,
    };

    return NextResponse.json({
      success: true,
      data,
    });

  } catch (error) {
    console.error("Error fetching service:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
