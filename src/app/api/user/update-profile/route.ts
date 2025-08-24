import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/features/auth/auth";
import { prisma as db } from "@/core/database/db";

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const userId = session.user.id;

    // Update user basic information
    const userUpdateData: any = {};
    if (body.name !== undefined) userUpdateData.name = body.name;
    if (body.phoneE164 !== undefined) userUpdateData.phoneE164 = body.phoneE164;

    if (Object.keys(userUpdateData).length > 0) {
      await db.user.update({
        where: { id: userId },
        data: userUpdateData,
      });
    }

    // Update role-specific profile
    if (session.user.role === "CLIENT") {
      const clientUpdateData: any = {};
      if (body.companyName !== undefined)
        clientUpdateData.companyName = body.companyName;
      if (body.location !== undefined)
        clientUpdateData.location = body.location;

      if (Object.keys(clientUpdateData).length > 0) {
        await db.clientProfile.upsert({
          where: { userId },
          update: clientUpdateData,
          create: {
            userId,
            ...clientUpdateData,
          },
        });
      }
    } else if (session.user.role === "DEVELOPER") {
      const developerUpdateData: any = {};
      if (body.bio !== undefined) developerUpdateData.bio = body.bio;
      if (body.experienceYears !== undefined)
        developerUpdateData.experienceYears = body.experienceYears;
      if (body.level !== undefined) developerUpdateData.level = body.level;
      if (body.linkedinUrl !== undefined)
        developerUpdateData.linkedinUrl = body.linkedinUrl;
      if (body.whatsappNumber !== undefined)
        developerUpdateData.whatsappNumber = body.whatsappNumber;
      if (body.usualResponseTimeMs !== undefined)
        developerUpdateData.usualResponseTimeMs = body.usualResponseTimeMs;
      if (body.currentStatus !== undefined)
        developerUpdateData.currentStatus = body.currentStatus;
      if (body.portfolioLinks !== undefined)
        developerUpdateData.portfolioLinks = body.portfolioLinks;

      if (Object.keys(developerUpdateData).length > 0) {
        await db.developerProfile.upsert({
          where: { userId },
          update: developerUpdateData,
          create: {
            userId,
            ...developerUpdateData,
          },
        });
      }
    }

    return NextResponse.json({
      message: "Profile updated successfully",
      success: true,
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
