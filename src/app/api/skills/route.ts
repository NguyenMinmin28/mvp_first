import { NextResponse } from "next/server";
import { prisma } from "@/core/database/db";

// Cache skills for 1 hour
export const revalidate = 3600;

export async function GET() {
  try {
    const skills = await prisma.skill.findMany({
      select: {
        id: true,
        name: true,
        category: true,
      },
      orderBy: [
        { category: "asc" },
        { name: "asc" }
      ]
    });

    return NextResponse.json(skills);
  } catch (error) {
    console.error("Error fetching skills:", error);
    return NextResponse.json(
      { error: "Failed to fetch skills" },
      { status: 500 }
    );
  }
}
