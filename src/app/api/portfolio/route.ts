import { NextRequest, NextResponse } from "next/server";
import { getServerSessionUser } from "@/features/auth/auth-server";
import { prisma } from "@/core/database/db";

export async function GET() {
  try {
    const user = await getServerSessionUser();
    if (!user || user.role !== "DEVELOPER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get developer profile
    const developerProfile = await prisma.developerProfile.findUnique({
      where: { userId: user.id },
      include: {
        portfolios: {
          orderBy: { sortOrder: "asc" }
        }
      }
    });

    if (!developerProfile) {
      return NextResponse.json({ error: "Developer profile not found" }, { status: 404 });
    }

    return NextResponse.json({ portfolios: developerProfile.portfolios });
  } catch (error) {
    console.error("Error fetching portfolios:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getServerSessionUser();
    if (!user || user.role !== "DEVELOPER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { portfolios } = body;

    if (!Array.isArray(portfolios)) {
      return NextResponse.json({ error: "Portfolios must be an array" }, { status: 400 });
    }

    // Get developer profile
    const developerProfile = await prisma.developerProfile.findUnique({
      where: { userId: user.id }
    });

    if (!developerProfile) {
      return NextResponse.json({ error: "Developer profile not found" }, { status: 404 });
    }

    // Delete existing portfolios
    await prisma.portfolio.deleteMany({
      where: { developerId: developerProfile.id }
    });

    // Create new portfolios
    const portfolioData = portfolios
      .filter(portfolio => 
        portfolio.title || portfolio.description || portfolio.projectUrl || portfolio.imageUrl
      )
      .map((portfolio, index) => ({
        developerId: developerProfile.id,
        title: portfolio.title || "",
        description: portfolio.description || "",
        projectUrl: portfolio.projectUrl || "",
        imageUrl: portfolio.imageUrl || "",
        sortOrder: index
      }));

    if (portfolioData.length > 0) {
      await prisma.portfolio.createMany({
        data: portfolioData
      });
    }

    // Return updated portfolios
    const updatedPortfolios = await prisma.portfolio.findMany({
      where: { developerId: developerProfile.id },
      orderBy: { sortOrder: "asc" }
    });

    return NextResponse.json({ 
      success: true, 
      portfolios: updatedPortfolios 
    });
  } catch (error) {
    console.error("Error saving portfolios:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

