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

    // Helper to slugify skill names for Skill.slug
    const slugify = (input: string) =>
      input
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

    // Update within a transaction so user name + profile + skills stay consistent
    const result = await prisma.$transaction(async (tx) => {
      // Optionally update user full name
      if (typeof body.fullName === "string" && body.fullName.trim().length > 0) {
        await tx.user.update({
          where: { id: userId },
          data: { name: body.fullName.trim() },
        });
      }

      // Update developer profile scalars (use nullish coalescing so 0/false aren't lost)
      const updateData: any = {
        bio: body.bio ?? existingProfile.bio,
        experienceYears: body.experienceYears ?? existingProfile.experienceYears,
        level: body.level ?? existingProfile.level,
        linkedinUrl: body.linkedinUrl ?? existingProfile.linkedinUrl,
        portfolioLinks: body.portfolioLinks ?? existingProfile.portfolioLinks,
        whatsappNumber: body.whatsappNumber ?? existingProfile.whatsappNumber,
        whatsappVerified: body.whatsappVerified ?? existingProfile.whatsappVerified,
        adminApprovalStatus: body.adminApprovalStatus ?? existingProfile.adminApprovalStatus,
        updatedAt: new Date(),
      };

      // Store roles if provided (preserve existing if not provided)
      if (Array.isArray(body.roles)) {
        updateData.roles = body.roles;
      } else {
        // Preserve existing roles if not provided in this update
        updateData.roles = existingProfile.roles || [];
      }

      // Store languages if provided (preserve existing if not provided)
      if (Array.isArray(body.languages)) {
        updateData.languages = body.languages.length > 0 ? body.languages : null;
      } else {
        // Preserve existing languages if not provided in this update
        updateData.languages = existingProfile.languages || null;
      }

      const updatedProfile = await tx.developerProfile.update({
        where: { userId },
        data: updateData,
      });

      // If skills provided as an array of strings, upsert them and link to developer
      if (Array.isArray(body.skills) && body.skills.length > 0) {
        // Clear existing skills (lightweight reset)
        await tx.developerSkill.deleteMany({ where: { developerProfileId: updatedProfile.id } });

        for (const raw of body.skills) {
          const name = typeof raw === "string" ? raw.trim() : "";
          if (!name) continue;
          const slug = slugify(name);
          const skill = await tx.skill.upsert({
            where: { name },
            create: {
              name,
              slug,
              category: "General",
              keywords: [name.toLowerCase()],
            },
            update: {},
          });
          await tx.developerSkill.create({
            data: {
              developerProfileId: updatedProfile.id,
              skillId: skill.id,
              years: 0,
              rating: 3,
            },
          });
        }
      }

      return updatedProfile;
    });

    return NextResponse.json({
      success: true,
      message: "Onboarding data saved successfully",
      data: result,
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
