import { NextRequest, NextResponse } from "next/server";
import { getServerSessionUser } from "@/features/auth/auth-server";
import { prisma } from "@/core/database/db";

// Helper function to parse imageUrl and return normalized images array
function parsePortfolioImages(imageUrl: string | null | undefined): { imageUrl: string; images: string[] } {
  const url = imageUrl || "";
  let images: string[] = [];
  let mainImageUrl = "";
  
  // Check if imageUrl looks like JSON (starts with [)
  const isJsonLike = url.trim().startsWith("[");
  
  if (isJsonLike) {
    try {
      const parsed = JSON.parse(url);
      if (Array.isArray(parsed)) {
        // Ensure structure [main, slot1, slot2, slot3, slot4, slot5] (6 slots total)
        images = [...parsed];
        while (images.length < 6) {
          images.push("");
        }
        images = images.slice(0, 6);
        // Get first non-empty image as main image
        const nonEmptyImages = images.filter(img => img && img.trim() !== "");
        mainImageUrl = nonEmptyImages[0] || "";
      } else {
        // Parsed but not an array, treat as invalid
        images = ["", "", "", "", "", ""];
        mainImageUrl = "";
      }
    } catch {
      // Failed to parse JSON, treat as invalid if it looks like JSON
      if (url.trim().startsWith("[")) {
        images = ["", "", "", "", "", ""];
        mainImageUrl = "";
      } else {
        // Doesn't look like JSON, treat as single image URL
        images = [url, "", "", "", "", ""];
        mainImageUrl = url;
      }
    }
  } else {
    // Not JSON-like, treat as single image URL
    if (url) {
      images = [url, "", "", "", "", ""];
      mainImageUrl = url;
    } else {
      images = ["", "", "", "", "", ""];
      mainImageUrl = "";
    }
  }
  
  return { imageUrl: mainImageUrl, images };
}

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

    // Create 6 slots array with saved portfolios in correct positions
    const portfoliosArray = Array.from({ length: 6 }, (_, index) => {
      const saved = developerProfile.portfolios.find(p => p.sortOrder === index);
      if (saved) {
        const { imageUrl, images } = parsePortfolioImages(saved.imageUrl);
        
        return {
          id: saved.id,
          title: saved.title,
          description: saved.description,
          projectUrl: saved.projectUrl,
          imageUrl: imageUrl,
          images: images
        };
      } else {
        return {
          title: "",
          description: "",
          projectUrl: "",
          imageUrl: "",
          images: ["", "", "", "", "", ""]
        };
      }
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

    // Create new portfolios - save all 6 slots, even empty ones
    const portfolioData = portfolios.map((portfolio, index) => {
      // Get images array or use imageUrl as fallback
      const images = portfolio.images || (portfolio.imageUrl ? [portfolio.imageUrl] : []);
      // Normalize: ensure we have exactly 6 slots (main + 5 additional)
      const normalizedImages: string[] = [];
      for (let i = 0; i < 6; i++) {
        normalizedImages.push(images[i] || "");
      }
      
      // Count non-empty images (excluding empty strings)
      const nonEmptyImages = normalizedImages.filter(img => img && img.trim() !== "");
      const mainImage = normalizedImages[0] || "";
      
      // Only store as JSON if there are 2+ non-empty images, otherwise store as single URL
      // This ensures backward compatibility and avoids JSON parsing issues
      const imageUrlToStore = nonEmptyImages.length > 1 
        ? JSON.stringify(normalizedImages) 
        : mainImage;
      
      return {
        developerId: developerProfile.id,
        title: portfolio.title || "",
        description: portfolio.description || "",
        projectUrl: portfolio.projectUrl || "",
        imageUrl: imageUrlToStore,
        sortOrder: index
      };
    });

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

    // Return updated portfolios in correct order (6 slots)
    const savedPortfolios = await prisma.portfolio.findMany({
      where: { developerId: developerProfile.id },
      orderBy: { sortOrder: "asc" }
    });

    // Create 6 slots array with saved portfolios in correct positions
    const portfoliosArray = Array.from({ length: 6 }, (_, index) => {
      const saved = savedPortfolios.find(p => p.sortOrder === index);
      if (saved) {
        const { imageUrl, images } = parsePortfolioImages(saved.imageUrl);
        
        return {
          id: saved.id,
          title: saved.title,
          description: saved.description,
          projectUrl: saved.projectUrl,
          imageUrl: imageUrl,
          images: images
        };
      } else {
        return {
          title: "",
          description: "",
          projectUrl: "",
          imageUrl: "",
          images: ["", "", "", "", "", ""]
        };
      }
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

