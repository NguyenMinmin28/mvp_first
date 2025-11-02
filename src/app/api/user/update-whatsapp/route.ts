import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/core/database/db";
import { authOptions } from "@/features/auth/auth";
import { WhatsAppService } from "@/core/services/whatsapp.service";

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

    // Validate phone number format (should include country code)
    if (!whatsappNumber.startsWith('+')) {
      return NextResponse.json(
        { error: "WhatsApp number must include country code (e.g., +84...)" },
        { status: 400 }
      );
    }

    // Format phone number to ensure consistent E.164 format
    const phoneE164 = WhatsAppService.formatPhoneNumber(whatsappNumber);

    // Check if phone number is already verified by another user
    // Check in User.phoneE164
    const existingUserByPhone = await prisma.user.findFirst({
      where: {
        phoneE164: phoneE164,
        isPhoneVerified: true,
        id: { not: userId },
      },
    });

    // Check in DeveloperProfile.whatsappNumber
    const existingDeveloperByPhone = await prisma.developerProfile.findFirst({
      where: {
        whatsappNumber: phoneE164,
        whatsappVerified: true,
        userId: { not: userId },
      },
    });

    if (existingUserByPhone || existingDeveloperByPhone) {
      return NextResponse.json(
        {
          error: "This phone number is already verified and associated with another account. Please use a different phone number.",
        },
        { status: 409 } // Conflict
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
          whatsappNumber: phoneE164,
          whatsappVerified: whatsappVerified || false,
          updatedAt: new Date(),
        },
      });
    } else {
      // Create new profile with default values
      updatedProfile = await prisma.developerProfile.create({
        data: {
          userId,
          whatsappNumber: phoneE164,
          whatsappVerified: whatsappVerified || false,
          level: "FRESHER", // Default level
          experienceYears: 0, // Default experience
          currentStatus: "available", // Default status
          adminApprovalStatus: "draft", // Default approval status
        },
      });
    }

    // Also update User.phoneE164 and isPhoneVerified if WhatsApp is verified
    if (whatsappVerified) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          phoneE164: phoneE164,
          isPhoneVerified: true,
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
