export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/features/auth/auth";
import { prisma as db } from "@/core/database/db";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get fresh user data from database with profile information
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      include: {
        clientProfile: true,
        developerProfile: {
          include: {
            skills: {
              include: { skill: true },
            },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Combine user data with profile data
    const userData = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isProfileCompleted: user.isProfileCompleted,
      phoneE164: user.phoneE164,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      // Include profile-specific fields
      ...(user.clientProfile && {
        companyName: user.clientProfile.companyName,
        location: user.clientProfile.location,
      }),
      ...(user.developerProfile && ({
        photoUrl: user.developerProfile.photoUrl,
        bio: user.developerProfile.bio,
        experienceYears: user.developerProfile.experienceYears,
        level: user.developerProfile.level,
        linkedinUrl: user.developerProfile.linkedinUrl,
        portfolioLinks: user.developerProfile.portfolioLinks,
        location: user.developerProfile.location,
        // Optional fields may be missing if schema/migration not applied yet
        age: (user.developerProfile as any).age,
        hourlyRate: user.developerProfile.hourlyRateUsd,
        whatsappNumber: user.developerProfile.whatsappNumber,
        usualResponseTimeMs: user.developerProfile.usualResponseTimeMs,
        currentStatus: user.developerProfile.currentStatus,
        adminApprovalStatus: user.developerProfile.adminApprovalStatus,
        whatsappVerified: user.developerProfile.whatsappVerified,
        skills: Array.isArray(user.developerProfile.skills)
          ? user.developerProfile.skills.map((ds) => ({
              skillId: ds.skillId,
              skillName: (ds as any).skill?.name,
            }))
          : [],
      }) as any),
    };

    return NextResponse.json({
      user: userData,
      session: session.user,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching user data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
