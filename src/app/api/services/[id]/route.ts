import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/database/db";
import { getServerSessionUser } from "@/features/auth/auth-server";
import { billingService } from "@/modules/billing/billing.service";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
    try {
      const session = await getServerSessionUser();
      // Allow public access to published services, but require auth for userLiked check

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
        media: {
          select: {
            url: true,
            sortOrder: true,
          },
          orderBy: {
            sortOrder: 'asc',
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

    // Check if current user has liked this service (only if authenticated)
    let userLiked = false;
    if (session && session.id) {
      const like = await (prisma as any).serviceLike.findUnique({
        where: {
          userId_serviceId: {
            userId: session.id,
            serviceId: service.id,
          },
        },
      });
      userLiked = !!like;
      console.log('Service GET - userLiked check:', { userId: session.id, serviceId: service.id, like, userLiked });
    }

    // Debug: Log skills data
    console.log('Service GET - Skills data:', {
      serviceId: service.id,
      skillsRaw: service.skills,
      skillsCount: service.skills?.length || 0,
      skillsMapped: service.skills?.map((s: any) => s.skill?.name) || []
    });

    // Categorize images based on sortOrder
    // sortOrder 0 = main image (coverUrl)
    // sortOrder 1-9 = gallery images (first 9)
    // sortOrder 10+ = showcase images
    const galleryImages = service.media
      .filter((media: any) => media.sortOrder >= 1 && media.sortOrder <= 9)
      .map((media: any) => media.url);
    
    const showcaseImages = service.media
      .filter((media: any) => media.sortOrder >= 10)
      .map((media: any) => media.url);

    console.log('Service media categorization:', {
      totalMedia: service.media.length,
      galleryImages,
      showcaseImages,
      media: service.media
    });

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
      skills: service.skills && Array.isArray(service.skills) 
        ? service.skills.map((s: any) => s.skill?.name).filter((name: string) => name) 
        : [],
      categories: service.categories.map((c: any) => c.category.name),
      leadsCount: service._count.leads,
      galleryImages,
      showcaseImages,
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

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSessionUser();
    if (!session?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const serviceId = params.id;
    const body = await request.json();
    const { message, budget, description, contactVia } = body || {};

    // Resolve client profile
    const clientProfile = await (prisma as any).clientProfile.findFirst({
      where: { userId: session.id }
    });
    if (!clientProfile) {
      return NextResponse.json({ success: false, error: "Client profile not found" }, { status: 400 });
    }

    // Check connects quota
    const canConnect = await billingService.canUseConnect(clientProfile.id);
    if (!canConnect.allowed) {
      return NextResponse.json({ success: false, error: canConnect.reason || "Connect quota exceeded" }, { status: 402 });
    }

    // Create lead
    const lead = await (prisma as any).serviceLead.create({
      data: {
        serviceId,
        clientId: session.id,
        message: message ?? null,
        contactVia: contactVia || "IN_APP",
      }
    });

    // Increment connects usage
    await billingService.incrementConnectUsage(clientProfile.id);

    return NextResponse.json({ success: true, data: { id: lead.id } });
  } catch (error) {
    console.error("Error creating service lead:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
