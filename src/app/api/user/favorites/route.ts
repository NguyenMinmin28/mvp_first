import { NextRequest, NextResponse } from "next/server";
import { getServerSessionUser } from "@/features/auth/auth-server";
import { prisma } from "@/core/database/db";
import { z } from "zod";

const toggleFavoriteSchema = z.object({
  developerId: z.string(),
  ensure: z.boolean().optional(), // when true, only add (idempotent)
});

// GET /api/user/favorites - Get client's favorite developers
export async function GET() {
  try {
    const sessionUser = await getServerSessionUser();
    if (!sessionUser || sessionUser.role !== "CLIENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const clientProfile = await prisma.clientProfile.findUnique({
      where: { userId: sessionUser.id },
    });

    if (!clientProfile) {
      return NextResponse.json({ error: "Client profile not found" }, { status: 404 });
    }

    const favorites = await prisma.favoriteDeveloper.findMany({
      where: { clientId: clientProfile.id },
      include: {
        developer: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
            skills: {
              include: {
                skill: true,
              },
            },
            reviewsSummary: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const formattedFavorites = favorites.map((fav) => ({
      id: fav.developer.id,
      name: fav.developer.user.name,
      email: fav.developer.user.email,
      image: fav.developer.user.image,
      photoUrl: fav.developer.photoUrl,
      location: fav.developer.location,
      experienceYears: fav.developer.experienceYears,
      hourlyRateUsd: fav.developer.hourlyRateUsd,
      level: fav.developer.level,
      currentStatus: fav.developer.currentStatus,
      adminApprovalStatus: fav.developer.adminApprovalStatus,
      whatsappNumber: fav.developer.whatsappNumber,
      skills: fav.developer.skills.map((s: any) => ({
        skillId: s.skillId,
        skillName: s.skill.name,
      })),
      averageRating: fav.developer.reviewsSummary?.averageRating || 0,
      totalReviews: fav.developer.reviewsSummary?.totalReviews || 0,
      favoritedAt: fav.createdAt,
    }));

    return NextResponse.json({ favorites: formattedFavorites });
  } catch (error) {
    console.error("Error fetching favorites:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/user/favorites - Toggle favorite status
export async function POST(request: NextRequest) {
  try {
    const sessionUser = await getServerSessionUser();
    if (!sessionUser || sessionUser.role !== "CLIENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { developerId, ensure } = toggleFavoriteSchema.parse(body);

    const clientProfile = await prisma.clientProfile.findUnique({
      where: { userId: sessionUser.id },
    });

    if (!clientProfile) {
      return NextResponse.json({ error: "Client profile not found" }, { status: 404 });
    }

    // Check if developer exists
    const developer = await prisma.developerProfile.findUnique({
      where: { id: developerId },
    });

    if (!developer) {
      return NextResponse.json({ error: "Developer not found" }, { status: 404 });
    }

    // Check if already favorited
    const existingFavorite = await prisma.favoriteDeveloper.findUnique({
      where: {
        clientId_developerId: {
          clientId: clientProfile.id,
          developerId: developerId,
        },
      },
    });

    if (existingFavorite) {
      if (ensure) {
        // Idempotent add: already favorited, keep as is
        return NextResponse.json({ isFavorited: true, message: "Already in favorites" });
      }
      // Remove from favorites (toggle mode)
      await prisma.favoriteDeveloper.delete({
        where: { id: existingFavorite.id },
      });
      return NextResponse.json({ isFavorited: false, message: "Removed from favorites" });
    } else {
      // Add to favorites
      await prisma.favoriteDeveloper.create({
        data: {
          clientId: clientProfile.id,
          developerId: developerId,
        },
      });
      return NextResponse.json({ isFavorited: true, message: "Added to favorites" });
    }
  } catch (error) {
    console.error("Error toggling favorite:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request data" }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
