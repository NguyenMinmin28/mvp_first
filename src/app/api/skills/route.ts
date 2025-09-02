import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/database/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const search = searchParams.get("search");

    const where: any = {};
    
    if (category) {
      where.category = category;
    }
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { keywords: { hasSome: [search] } },
      ];
    }

    const skills = await prisma.skill.findMany({
      where,
      orderBy: { name: 'asc' },
      take: 100,
    });

    return NextResponse.json({ skills });
  } catch (error) {
    console.error("Error fetching skills:", error);
    return NextResponse.json(
      { error: "Failed to fetch skills" },
      { status: 500 }
    );
  }
}
