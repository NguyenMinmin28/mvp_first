import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/core/database/db";
import { authOptions } from "@/features/auth/auth";

export async function PUT(request: NextRequest) {
  try {
    // Get user session
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const { whatsappNumber, whatsappVerified } = await request.json();

    // Validate input
    if (!whatsappNumber) {
      return NextResponse.json(
        { error: "WhatsApp number is required" },
        { status: 400 }
      );
    }

    // Check if developer profile exists, create if not
    const existingProfile = await prisma.developerProfile.findUnique({
      where: { userId },
    });

    let updatedProfile;

    if (existingProfile) {
      // Update existing profile
      updatedProfile = await prisma.developerProfile.update({
        where: { userId },
        data: {
          whatsappNumber,
          whatsappVerified: whatsappVerified || false,
          updatedAt: new Date(),
        },
      });
    } else {
      // Create new profile with default values
      updatedProfile = await prisma.developerProfile.create({
        data: {
          userId,
          whatsappNumber,
          whatsappVerified: whatsappVerified || false,
          level: "FRESHER", // Default level
          experienceYears: 0, // Default experience
          currentStatus: "available", // Default status
          adminApprovalStatus: "draft", // Default approval status
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: existingProfile
        ? "WhatsApp information updated successfully"
        : "Developer profile created with WhatsApp information",
      data: {
        whatsappNumber: updatedProfile.whatsappNumber,
        whatsappVerified: updatedProfile.whatsappVerified,
        profileId: updatedProfile.id,
        isNewProfile: !existingProfile,
      },
    });
  } catch (error) {
    console.error("Error updating WhatsApp information:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
