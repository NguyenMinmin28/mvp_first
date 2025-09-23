import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import authOptions from "../../../../config/auth.config";
import { prisma } from "@/core/database/db";
import { FollowNotificationService } from "@/core/services/follow-notification.service";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      title,
      description,
      skills,
      pricing,
      timeline,
      location,
      mainImage,
      galleryImages,
      showcaseImages,
      images // fallback for combined images
    } = body;

    // Validation
    if (!title || !description || !mainImage || !galleryImages || galleryImages.length === 0) {
      return NextResponse.json(
        { error: "Title, description, main image, and at least one gallery image are required" },
        { status: 400 }
      );
    }

    // Get developer profile
    const developer = await prisma.developerProfile.findUnique({
      where: { userId: session.user.id },
      include: { user: true }
    });

    if (!developer) {
      return NextResponse.json(
        { error: "Developer profile not found" },
        { status: 404 }
      );
    }

    // Create service
    const service = await prisma.service.create({
      data: {
        slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        title,
        shortDesc: description.substring(0, 160), // First 160 chars as short description
        description,
        coverUrl: mainImage,
        priceType: pricing?.type === 'hourly' ? 'HOURLY' : 'FIXED',
        priceMin: pricing?.amount || 0,
        priceMax: pricing?.amount || 0,
        deliveryDays: timeline ? parseInt(timeline.replace(/\D/g, '')) : null,
        revisions: 3, // Default revisions
        status: 'PUBLISHED',
        visibility: 'PUBLIC',
        ratingAvg: 0,
        ratingCount: 0,
        views: 0,
        likesCount: 0,
        favoritesCount: 0,
        developerId: developer.id
      },
      include: {
        developer: {
          include: {
            user: true
          }
        }
      }
    });

    // Create service media for images with proper categorization
    const allImages = [
      { url: mainImage, kind: 'IMAGE', sortOrder: 0 },
      ...galleryImages.map((url: string, index: number) => ({
        url,
        kind: 'IMAGE' as const,
        sortOrder: index + 1
      })),
      ...(showcaseImages || []).map((url: string, index: number) => ({
        url,
        kind: 'IMAGE' as const,
        sortOrder: index + galleryImages.length + 1
      }))
    ];

    if (allImages.length > 0) {
      await prisma.serviceMedia.createMany({
        data: allImages.map(({ url, kind, sortOrder }) => ({
          serviceId: service.id,
          url,
          kind,
          sortOrder
        }))
      });
    }

    // Notify followers (fire-and-forget)
    try {
      console.log("🔔 Service created, sending follow notifications:", {
        developerId: developer.id,
        developerName: developer.user?.name || "Developer",
        serviceId: service.id,
        serviceTitle: service.title
      });
      await FollowNotificationService.notifyServicePosted(
        developer.id, // Use developer profile ID, not user ID
        developer.user?.name || "Developer",
        service.id,
        service.title
      );
      console.log("🔔 Follow notifications sent successfully");
    } catch (e) {
      console.error("🔔 Failed to send follow notifications for service:", e);
    }

    return NextResponse.json({
      success: true,
      service
    });

  } catch (error) {
    console.error("Error creating service:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log('Services API GET called');
    
    // Get session for myServices filter
    const session = await getServerSession(authOptions);
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const search = searchParams.get('search') || '';
    const skills = searchParams.get('skills')?.split(',') || [];
    const pricingType = searchParams.get('pricingType') || '';
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const myServices = searchParams.get('myServices') === 'true';

    const skip = (page - 1) * limit;

    console.log('Services API called with params:', { page, limit, search, skills, pricingType, minPrice, maxPrice, myServices });

    // Build where clause - simplified
    const where: any = {
      status: 'PUBLISHED'
    };

    // Handle "My Services" filter
    if (myServices && session?.user?.id) {
      // Get developer profile for current user
      const developer = await prisma.developerProfile.findUnique({
        where: { userId: session.user.id }
      });
      
      if (developer) {
        where.developerId = developer.id;
        // For "My Services", show both DRAFT and PUBLISHED services
        where.status = {
          in: ['DRAFT', 'PUBLISHED']
        };
      } else {
        // If user is not a developer, return empty results
        where.developerId = 'nonexistent';
      }
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (pricingType) {
      where.priceType = pricingType.toUpperCase();
    }

    if (minPrice || maxPrice) {
      where.priceMin = {};
      if (minPrice) where.priceMin.gte = parseInt(minPrice);
      if (maxPrice) where.priceMin.lte = parseInt(maxPrice);
    }

    console.log('Where clause:', where);

    // Get services with pagination - simplified query first
    const [services, total] = await Promise.all([
      prisma.service.findMany({
        where,
        include: {
          developer: {
            include: {
              user: true
            }
          },
          media: {
            orderBy: {
              sortOrder: 'asc'
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.service.count({ where })
    ]);

    console.log('Query results:', { servicesCount: services.length, total });

    // Process services to include galleryImages and showcaseImages
    const processedServices = services.map(service => {
      const galleryImages = service.media
        .filter((media: any) => media.sortOrder >= 1 && media.sortOrder <= 9)
        .map((media: any) => media.url);
      
      const showcaseImages = service.media
        .filter((media: any) => media.sortOrder >= 10)
        .map((media: any) => media.url);

      return {
        ...service,
        galleryImages,
        showcaseImages
      };
    });

    const response = {
      success: true,
      data: processedServices,
      pagination: {
        page,
        limit,
        totalCount: total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1
      }
    };

    console.log('API response:', response);
    return NextResponse.json(response);

  } catch (error) {
    console.error("Error fetching services:", error);
    console.error("Error stack:", error instanceof Error ? error.stack : "No stack");
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