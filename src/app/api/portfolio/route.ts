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

    // Create 5 slots array with saved portfolios in correct positions
    const portfoliosArray = Array.from({ length: 5 }, (_, index) => {
      const saved = developerProfile.portfolios.find(p => p.sortOrder === index);
      return saved ? {
        id: saved.id,
        title: saved.title,
        description: saved.description,
        projectUrl: saved.projectUrl,
        imageUrl: saved.imageUrl
      } : {
        title: "",
        description: "",
        projectUrl: "",
        imageUrl: ""
      };
    });

    console.log('📋 GET: Returning portfolios array:', portfoliosArray);

    return NextResponse.json({ portfolios: portfoliosArray });
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

    console.log('💾 API: Saving portfolios for user:', user.id);
    console.log('📦 API: Received portfolios:', portfolios);

    if (!Array.isArray(portfolios)) {
      return NextResponse.json({ error: "Portfolios must be an array" }, { status: 400 });
    }

    // Get developer profile
    const developerProfile = await prisma.developerProfile.findUnique({
      where: { userId: user.id }
    });

    console.log('👤 API: Developer profile:', developerProfile?.id);

    if (!developerProfile) {
      return NextResponse.json({ error: "Developer profile not found" }, { status: 404 });
    }

    // Delete existing portfolios
    console.log('🗑️ API: Deleting existing portfolios...');
    await prisma.portfolio.deleteMany({
      where: { developerId: developerProfile.id }
    });

    // Create new portfolios - save all 5 slots, even empty ones
    const portfolioData = portfolios.map((portfolio, index) => ({
      developerId: developerProfile.id,
      title: portfolio.title || "",
      description: portfolio.description || "",
      projectUrl: portfolio.projectUrl || "",
      imageUrl: portfolio.imageUrl || "",
      sortOrder: index
    }));

    console.log('📝 API: Portfolio data to create:', portfolioData);

    // Only create portfolios that have content
    const portfoliosWithContent = portfolioData.filter(portfolio => 
      portfolio.title || portfolio.description || portfolio.projectUrl || portfolio.imageUrl
    );

    if (portfoliosWithContent.length > 0) {
      await prisma.portfolio.createMany({
        data: portfoliosWithContent
      });
      console.log('✅ API: Created portfolios successfully:', portfoliosWithContent.length);
    } else {
      console.log('ℹ️ API: No portfolios with content to save');
    }

    // Return updated portfolios in correct order (5 slots)
    const savedPortfolios = await prisma.portfolio.findMany({
      where: { developerId: developerProfile.id },
      orderBy: { sortOrder: "asc" }
    });

    // Create 5 slots array with saved portfolios in correct positions
    const portfoliosArray = Array.from({ length: 5 }, (_, index) => {
      const saved = savedPortfolios.find(p => p.sortOrder === index);
      return saved ? {
        id: saved.id,
        title: saved.title,
        description: saved.description,
        projectUrl: saved.projectUrl,
        imageUrl: saved.imageUrl
      } : {
        title: "",
        description: "",
        projectUrl: "",
        imageUrl: ""
      };
    });

    console.log('📋 API: Returning portfolios array:', portfoliosArray);

    return NextResponse.json({ 
      success: true, 
      portfolios: portfoliosArray 
    });
  } catch (error) {
    console.error("Error saving portfolios:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

