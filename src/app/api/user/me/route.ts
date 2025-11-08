export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/features/auth/auth";
import { prisma as db } from "@/core/database/db";

// Helper function to parse portfolio imageUrl (can be JSON string or single URL)
function parsePortfolioImageUrl(imageUrl: string | null | undefined): string {
  if (!imageUrl) return "";
  
  // Check if it looks like JSON (starts with [)
  if (imageUrl.trim().startsWith("[")) {
    try {
      const parsed = JSON.parse(imageUrl);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Get first non-empty image as main image
        const nonEmptyImages = parsed.filter((img: string) => img && img.trim() !== "");
        return nonEmptyImages[0] || "";
      }
    } catch {
      // Failed to parse, return empty
      return "";
    }
  }
  
  // Not JSON, treat as single URL
  return imageUrl;
}

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
            portfolios: {
              orderBy: { sortOrder: 'asc' }
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
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      hasPassword: !!user.passwordHash, // Boolean to indicate if user has a password set
      // Include profile-specific fields
      ...(user.clientProfile && {
        companyName: user.clientProfile.companyName,
        location: user.clientProfile.location,
        photoUrl: (user.clientProfile as any).photoUrl, // Add photoUrl for client profile
      }),
      ...(user.developerProfile && ({
        photoUrl: user.developerProfile.photoUrl,
        bio: user.developerProfile.bio,
        experienceYears: user.developerProfile.experienceYears,
        level: user.developerProfile.level,
        linkedinUrl: user.developerProfile.linkedinUrl,
        resumeUrl: (user.developerProfile as any).resumeUrl,
        portfolioLinks: user.developerProfile.portfolios?.map((p: any) => ({
          id: p.id,
          title: p.title,
          description: p.description,
          url: p.projectUrl,
          imageUrl: parsePortfolioImageUrl(p.imageUrl),
          images: (() => {
            // Parse images array from imageUrl if it's JSON
            if (!p.imageUrl) return [];
            if (p.imageUrl.trim().startsWith("[")) {
              try {
                const parsed = JSON.parse(p.imageUrl);
                if (Array.isArray(parsed)) {
                  const normalized = [...parsed];
                  while (normalized.length < 6) normalized.push("");
                  return normalized.slice(0, 6);
                }
              } catch {
                return [];
              }
            }
            // Single URL, put it in first slot
            return p.imageUrl ? [p.imageUrl, "", "", "", "", ""] : ["", "", "", "", "", ""];
          })(),
          createdAt: p.createdAt.toISOString(),
        })) || [],
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
