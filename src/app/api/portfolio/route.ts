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

    // Create 6 slots array with saved portfolios in correct positions
    const portfoliosArray = Array.from({ length: 6 }, (_, index) => {
      const saved = developerProfile.portfolios.find(p => p.sortOrder === index);
      if (saved) {
        // Try to parse images array from imageUrl if it's JSON, otherwise use as single image
        let images: string[] = [];
        let imageUrl = saved.imageUrl || "";
        
        try {
          const parsed = JSON.parse(imageUrl);
          if (Array.isArray(parsed) && parsed.length > 0) {
            // Ensure structure [main, slot1, slot2, slot3, slot4, slot5] (6 slots total)
            images = [...parsed];
            while (images.length < 6) {
              images.push("");
            }
            images = images.slice(0, 6);
            imageUrl = images[0] || ""; // Main image for backward compatibility
          } else if (imageUrl) {
            // Single image: main image + 5 empty slots
            images = [imageUrl, "", "", "", "", ""];
          } else {
            images = ["", "", "", "", "", ""];
          }
        } catch {
          // Not JSON, treat as single image
          if (imageUrl) {
            images = [imageUrl, "", "", "", "", ""];
          } else {
            images = ["", "", "", "", "", ""];
          }
        }
        
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
      const mainImage = images[0] || portfolio.imageUrl || "";
      
      // Store images array as JSON in imageUrl if multiple images, otherwise just the URL
      const imageUrlToStore = images.length > 1 ? JSON.stringify(images) : mainImage;
      
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
        // Try to parse images array from imageUrl if it's JSON, otherwise use as single image
        let images: string[] = [];
        let imageUrl = saved.imageUrl || "";
        
        try {
          const parsed = JSON.parse(imageUrl);
          if (Array.isArray(parsed) && parsed.length > 0) {
            // Ensure structure [main, slot1, slot2, slot3, slot4, slot5] (6 slots total)
            images = [...parsed];
            while (images.length < 6) {
              images.push("");
            }
            images = images.slice(0, 6);
            imageUrl = images[0] || ""; // Main image for backward compatibility
          } else if (imageUrl) {
            // Single image: main image + 5 empty slots
            images = [imageUrl, "", "", "", "", ""];
          } else {
            images = ["", "", "", "", "", ""];
          }
        } catch {
          // Not JSON, treat as single image
          if (imageUrl) {
            images = [imageUrl, "", "", "", "", ""];
          } else {
            images = ["", "", "", "", "", ""];
          }
        }
        
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

