import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/database/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const limit = parseInt(searchParams.get("limit") || "50");

    // Build where clause for search (search in name, category, and keywords)
    const where: any = {};
    if (search.trim()) {
      const searchTerm = search.trim();
      where.OR = [
        {
          name: {
            contains: searchTerm,
            mode: "insensitive",
          },
        },
        {
          category: {
            contains: searchTerm,
            mode: "insensitive",
          },
        },
        {
          keywords: {
            has: searchTerm.toLowerCase(),
          },
        },
      ];
    }

    // Fetch all skills (for selection during signup/onboarding)
    // Include count of developers for reference but don't filter by it
    const skills = await prisma.skill.findMany({
      where,
      take: limit,
      select: {
        id: true,
        name: true,
        category: true,
        keywords: true,
        _count: {
          select: {
            developerSkills: {
              where: {
                developerProfile: {
                  adminApprovalStatus: "approved"
                }
              }
            }
          }
        }
      },
      orderBy: {
        name: "asc"
      }
    });

    // Return all skills (including those with 0 developers) for selection
    const formattedSkills = skills.map(skill => ({
      id: skill.id,
      name: skill.name,
      category: skill.category,
      keywords: skill.keywords,
      _count: {
        developers: skill._count.developerSkills
      }
    }));

    return NextResponse.json({
      success: true,
      skills: formattedSkills,
      total: formattedSkills.length
    });

  } catch (error) {
    console.error("Error fetching skills:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch skills" },
      { status: 500 }
    );
  }
}