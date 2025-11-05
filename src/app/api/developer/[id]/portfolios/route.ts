import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/database/db";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "5"), 5);

    // Allow public access - no authentication required
    // Portfolio is public by default for viewing on services/people page
    const portfolios = await prisma.portfolio.findMany({
      where: {
        developerId: params.id,
      },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      take: limit,
    });

    const items = portfolios.map((p: any) => ({
      id: p.id,
      title: p.title,
      description: p.description,
      url: p.projectUrl,
      imageUrl: p.imageUrl,
      createdAt: p.createdAt,
    }));

    return NextResponse.json({ items });
  } catch (error) {
    console.error("Error fetching portfolios:", error);
    return NextResponse.json({ error: "Failed to fetch portfolios" }, { status: 500 });
  }
}


