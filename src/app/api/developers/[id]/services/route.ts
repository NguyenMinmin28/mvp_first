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

    // Fetch services for the specific developer
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
      select: {
        id: true,
        title: true,
        coverUrl: true,
        priceMin: true,
        priceMax: true,
        priceType: true,
        ratingAvg: true,
        ratingCount: true,
        views: true,
        likesCount: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: services,
    });

  } catch (error) {
    console.error("Error fetching developer services:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
