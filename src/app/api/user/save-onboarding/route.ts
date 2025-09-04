import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/features/auth/auth";
import { prisma } from "@/core/database/db";

export async function POST(request: NextRequest) {
  try {
    // Get user session
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await request.json();

    // Validate that user is a developer
    if (session.user.role !== "DEVELOPER") {
      return NextResponse.json(
        { error: "Only developers can save onboarding data" },
        { status: 403 }
      );
    }

    // Check if developer profile exists
    const existingProfile = await prisma.developerProfile.findUnique({
      where: { userId },
    });

    if (!existingProfile) {
      return NextResponse.json(
        { error: "Developer profile not found. Please complete role selection first." },
        { status: 404 }
      );
    }

    // Update developer profile with onboarding data
    const updatedProfile = await prisma.developerProfile.update({
      where: { userId },
      data: {
        // Basic information
        bio: body.bio || existingProfile.bio,
        experienceYears: body.experienceYears || existingProfile.experienceYears,
        level: body.level || existingProfile.level,
        linkedinUrl: body.linkedinUrl || existingProfile.linkedinUrl,
        portfolioLinks: body.portfolioLinks || existingProfile.portfolioLinks,
        whatsappNumber: body.whatsappNumber || existingProfile.whatsappNumber,
        whatsappVerified: body.whatsappVerified || existingProfile.whatsappVerified,
        
        // Keep existing approval status unless explicitly changing
        adminApprovalStatus: body.adminApprovalStatus || existingProfile.adminApprovalStatus,
        
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Onboarding data saved successfully",
      data: updatedProfile,
    });
  } catch (error) {
    console.error("Error saving onboarding data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
