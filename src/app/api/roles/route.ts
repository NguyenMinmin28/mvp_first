import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/database/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const limit = parseInt(searchParams.get("limit") || "50");

    // Check if DeveloperRole model exists in Prisma client
    if (!prisma.developerRole) {
      console.error("DeveloperRole model not found in Prisma client. Please restart Next.js dev server.");
      // Fallback to hardcoded roles if model not available
      const fallbackRoles = [
        "Frontend Developer",
        "Backend Developer",
        "Full Stack Developer",
        "Mobile Developer",
        "DevOps Engineer",
        "UI/UX Designer",
        "QA Engineer",
        "Data Scientist",
        "Machine Learning Engineer",
        "Product Manager",
        "Technical Writer",
        "System Administrator",
        "Database Administrator",
        "Cloud Architect",
        "Security Engineer",
        "Blockchain Developer",
        "Game Developer",
        "Embedded Systems Developer",
        "Site Reliability Engineer",
        "Business Analyst",
      ];
      
      let filtered = fallbackRoles;
      if (search.trim()) {
        const searchLower = search.trim().toLowerCase();
        filtered = fallbackRoles.filter((r) => r.toLowerCase().includes(searchLower));
      }
      
      return NextResponse.json({
        success: true,
        roles: filtered.slice(0, limit).map((r) => ({
          id: r.toLowerCase().replace(/\s+/g, "-"),
          name: r,
          category: null,
        })),
        total: filtered.length,
      });
    }

    // Build where clause for search
    const where: any = {
      isActive: true, // Only return active roles
    };
    
    if (search.trim()) {
      where.name = {
        contains: search.trim(),
        mode: "insensitive",
      };
    }

    // Fetch roles from database
    const roles = await prisma.developerRole.findMany({
      where,
      take: limit,
      select: {
        id: true,
        name: true,
        category: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json({
      success: true,
      roles: roles,
      total: roles.length,
    });
  } catch (error) {
    console.error("Error fetching roles:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch roles" },
      { status: 500 }
    );
  }
}

