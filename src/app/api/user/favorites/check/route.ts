import { NextRequest, NextResponse } from "next/server";
import { getServerSessionUser } from "@/features/auth/auth-server";
import { prisma } from "@/core/database/db";

// GET /api/user/favorites/check?developerId=xxx - Check if developer is favorited
export async function GET(request: NextRequest) {
  try {
    const sessionUser = await getServerSessionUser();
    if (!sessionUser || sessionUser.role !== "CLIENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const developerId = searchParams.get("developerId");

    if (!developerId) {
      return NextResponse.json({ error: "Developer ID is required" }, { status: 400 });
    }

    const clientProfile = await prisma.clientProfile.findUnique({
      where: { userId: sessionUser.id },
    });

    if (!clientProfile) {
      return NextResponse.json({ error: "Client profile not found" }, { status: 404 });
    }

    const favorite = await prisma.favoriteDeveloper.findUnique({
      where: {
        clientId_developerId: {
          clientId: clientProfile.id,
          developerId: developerId,
        },
      },
    });

    return NextResponse.json({ isFavorited: !!favorite });
  } catch (error) {
    console.error("Error checking favorite status:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
