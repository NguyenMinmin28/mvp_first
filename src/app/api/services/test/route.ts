import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/database/db";

export async function GET(request: NextRequest) {
  try {
    // Get all services with their media
    const services = await prisma.service.findMany({
      include: {
        media: {
          select: {
            url: true,
            sortOrder: true,
          },
          orderBy: {
            sortOrder: 'asc',
          },
        },
        developer: {
          include: {
            user: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      take: 5, // Limit to 5 services for testing
    });

    // Format response to show media categorization
    const formattedServices = services.map(service => {
      const galleryImages = service.media
        .filter(media => media.sortOrder >= 1 && media.sortOrder <= 9)
        .map(media => media.url);
      
      const showcaseImages = service.media
        .filter(media => media.sortOrder >= 10)
        .map(media => media.url);

      return {
        id: service.id,
        title: service.title,
        developerName: service.developer.user.name,
        totalMedia: service.media.length,
        media: service.media,
        galleryImages,
        showcaseImages,
        coverUrl: service.coverUrl,
      };
    });

    return NextResponse.json({
      success: true,
      data: formattedServices,
    });
  } catch (error) {
    console.error('Test API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch services' },
      { status: 500 }
    );
  }
}