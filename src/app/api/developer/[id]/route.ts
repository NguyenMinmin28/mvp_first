import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/features/auth/auth";
import { prisma } from "@/core/database/db";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const developerId = params.id;

    // Check authentication
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Get developer profile
    const developer = await prisma.developerProfile.findUnique({
      where: { id: developerId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        }
      }
    });

    if (!developer) {
      return NextResponse.json(
        { error: "Developer not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      developer: {
        id: developer.id,
        name: developer.user.name,
        email: developer.user.email,
        photoUrl: developer.photoUrl,
        image: developer.user.image,
        location: developer.location,
        experienceYears: developer.experienceYears,
        level: developer.level,
        currentStatus: developer.currentStatus
      }
    });

  } catch (error) {
    console.error("Error fetching developer:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
