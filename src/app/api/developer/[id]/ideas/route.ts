import { NextRequest, NextResponse } from "next/server";
import { IdeaSparkService } from "@/core/services/ideaspark.service";
import { prisma } from "@/core/database/db";

const ideaSparkService = new IdeaSparkService();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const developerId = params.id;
    
    // Get developer profile to get userId
    const developer = await prisma.developerProfile.findUnique({
      where: { id: developerId },
      select: { userId: true },
    });

    if (!developer) {
      return NextResponse.json(
        { error: "Developer not found" },
        { status: 404 }
      );
    }

    // Fetch ideas for this developer
    const ideas = await ideaSparkService.getUserIdeas(developer.userId);

    return NextResponse.json({ ideas: ideas.slice(0, 10) });
  } catch (error) {
    console.error("Error fetching developer ideas:", error);
    return NextResponse.json(
      { error: "Failed to fetch ideas" },
      { status: 500 }
    );
  }
}

