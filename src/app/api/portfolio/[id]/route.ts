import { NextRequest, NextResponse } from "next/server";
import { getServerSessionUser } from "@/features/auth/auth-server";
import { db } from "@/core/database/db";

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
    const developerProfile = await db.developerProfile.findUnique({
      where: { userId: user.id }
    });

    if (!developerProfile) {
      return NextResponse.json({ error: "Developer profile not found" }, { status: 404 });
    }

    // Update portfolio
    const updatedPortfolio = await db.portfolio.update({
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
    const developerProfile = await db.developerProfile.findUnique({
      where: { userId: user.id }
    });

    if (!developerProfile) {
      return NextResponse.json({ error: "Developer profile not found" }, { status: 404 });
    }

    // Delete portfolio
    await db.portfolio.delete({
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

