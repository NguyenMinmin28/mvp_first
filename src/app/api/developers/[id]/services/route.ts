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

    const developerId = params.id;
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "4"), 10);

    // Fetch services for the specific developer with complete data for ServiceDetailOverlay
    const services = await prisma.service.findMany({
      where: {
        developerId: developerId,
        status: "PUBLISHED",
        visibility: "PUBLIC",
      },
      take: limit,
      orderBy: [
        { ratingAvg: "desc" },
        { views: "desc" },
        { createdAt: "desc" }
      ],
      include: {
        developer: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
              }
            }
          }
        },
        skills: {
          include: {
            skill: {
              select: {
                name: true
              }
            }
          }
        },
        categories: {
          include: {
            category: {
              select: {
                name: true
              }
            }
          }
        },
        media: {
          where: {
            kind: "IMAGE"
          },
          orderBy: {
            sortOrder: "asc"
          },
          select: {
            url: true,
            kind: true
          }
        },
        leads: {
          select: {
            id: true
          }
        }
      },
    });

    // Transform the data to match ServiceDetailData interface
    const transformedServices = services.map(service => ({
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
      userLiked: false, // Default value
      developer: {
        id: service.developer.id,
        user: {
          id: service.developer.user.id,
          name: service.developer.user.name,
          image: service.developer.user.image,
        },
        location: service.developer.location,
      },
      skills: service.skills.map(s => s.skill.name),
      categories: service.categories.map(c => c.category.name),
      leadsCount: service.leads.length,
      galleryImages: service.media.slice(0, 9).map(m => m.url), // First 9 images for gallery
      showcaseImages: service.media.slice(0, 2).map(m => m.url), // First 2 images for showcase
    }));

    return NextResponse.json({
      success: true,
      data: transformedServices,
    });

  } catch (error) {
    console.error("Error fetching developer services:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
