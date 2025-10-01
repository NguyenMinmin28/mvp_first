import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/database/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const limit = parseInt(searchParams.get("limit") || "20");
    const page = parseInt(searchParams.get("page") || "1");
    const skip = (page - 1) * limit;

    // Build where clause for search
    const where: any = {};
    if (search.trim()) {
      where.name = {
        contains: search.trim(),
        mode: "insensitive",
      };
    }

    // Get total count for pagination
    const totalCount = await prisma.skill.count({ where });

    // Fetch skills with pagination
    const skills = await prisma.skill.findMany({
      where,
      skip,
      take: limit,
      select: {
        id: true,
        name: true,
        category: true,
      },
      orderBy: {
        name: "asc"
      }
    });

    return NextResponse.json({
      success: true,
      skills: skills,
      total: totalCount,
      page: page,
      limit: limit,
      totalPages: Math.ceil(totalCount / limit)
    });

  } catch (error) {
    console.error("Error fetching all skills:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch skills" },
      { status: 500 }
    );
  }
}
