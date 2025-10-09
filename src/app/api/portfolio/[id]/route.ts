import { NextRequest, NextResponse } from "next/server";
import { getServerSessionUser } from "@/features/auth/auth-server";
import { prisma } from "@/core/database/db";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getServerSessionUser();
    if (!user || user.role !== "DEVELOPER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, projectUrl, imageUrl, sortOrder } = body;

    // Get developer profile
    const developerProfile = await prisma.developerProfile.findUnique({
      where: { userId: user.id }
    });

    if (!developerProfile) {
      return NextResponse.json({ error: "Developer profile not found" }, { status: 404 });
    }

    // Update portfolio
    const updatedPortfolio = await prisma.portfolio.update({
      where: { 
        id: params.id,
        developerId: developerProfile.id // Ensure user owns this portfolio
      },
      data: {
        title,
        description,
        projectUrl,
        imageUrl,
        sortOrder
      }
    });

    return NextResponse.json({ 
      success: true, 
      portfolio: updatedPortfolio 
    });
  } catch (error) {
    console.error("Error updating portfolio:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getServerSessionUser();
    if (!user || user.role !== "DEVELOPER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get developer profile
    const developerProfile = await prisma.developerProfile.findUnique({
      where: { userId: user.id }
    });

    if (!developerProfile) {
      return NextResponse.json({ error: "Developer profile not found" }, { status: 404 });
    }

    // Delete portfolio
    await prisma.portfolio.delete({
      where: { 
        id: params.id,
        developerId: developerProfile.id // Ensure user owns this portfolio
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting portfolio:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

