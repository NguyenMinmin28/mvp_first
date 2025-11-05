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

    const items = portfolios.map((p: any) => {
      // Normalize images: support both single URL and JSON array
      const raw = p.imageUrl || "";
      let images: string[] = [];
      let imageUrl = "";

      const looksJson = raw.trim().startsWith("[");
      if (looksJson) {
        try {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            images = [...parsed].slice(0, 6);
            while (images.length < 6) images.push("");
            const nonEmpty = images.filter((u) => u && u.trim() !== "");
            imageUrl = nonEmpty[0] || "";
          } else {
            images = ["", "", "", "", "", ""];
            imageUrl = "";
          }
        } catch {
          images = ["", "", "", "", "", ""];
          imageUrl = "";
        }
      } else {
        if (raw) {
          images = [raw, "", "", "", "", ""];
          imageUrl = raw;
        } else {
          images = ["", "", "", "", "", ""];
          imageUrl = "";
        }
      }

      return {
        id: p.id,
        title: p.title,
        description: p.description,
        url: p.projectUrl,
        imageUrl,
        images,
        createdAt: p.createdAt,
      };
    });

    return NextResponse.json({ items });
  } catch (error) {
    console.error("Error fetching portfolios:", error);
    return NextResponse.json({ error: "Failed to fetch portfolios" }, { status: 500 });
  }
}


