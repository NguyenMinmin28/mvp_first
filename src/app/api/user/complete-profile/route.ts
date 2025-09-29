import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/features/auth/auth";
import { prisma as db } from "@/core/database/db";
import { z } from "zod";

const clientProfileSchema = z.object({
  type: z.literal("client"),
  name: z.string().min(2),
  companyName: z.string().optional(),
  location: z.string().min(1),
});

const developerProfileSchema = z.object({
  type: z.literal("developer"),
  name: z.string().min(2),
  bio: z.string().min(10),
  experienceYears: z.number().min(0),
  level: z.enum(["FRESHER", "MID", "EXPERT"]),
  linkedinUrl: z.string().url().optional().or(z.literal("")),
  portfolioLinks: z.array(z.string().url()).optional(),
  whatsappNumber: z.string().optional(),
  whatsappVerified: z.boolean().optional(),
  skillsInput: z
    .array(
      z.object({
        name: z.string().min(1),
        years: z.number().min(0),
        rating: z.number().min(1).max(5),
      })
    )
    .min(1),
});

const completeProfileSchema = z.discriminatedUnion("type", [
  clientProfileSchema,
  developerProfileSchema,
]);

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const data = completeProfileSchema.parse(body);

    if (data.type === "client") {
      // Create/Update client profile
      await db.$transaction(async (tx: any) => {
        // Update user basic info
        await tx.user.update({
          where: { id: session.user.id },
          data: {
            name: data.name,
            isProfileCompleted: true,
          },
        });

        // Create or update client profile
        await tx.clientProfile.upsert({
          where: { userId: session.user.id },
          create: {
            userId: session.user.id,
            companyName: data.companyName || null,
            location: data.location,
          },
          update: {
            companyName: data.companyName || null,
            location: data.location,
          },
        });
      });
    } else if (data.type === "developer") {
      // Create/Update developer profile
      await db.$transaction(async (tx: any) => {
        // Update user basic info
        await tx.user.update({
          where: { id: session.user.id },
          data: {
            name: data.name,
            isProfileCompleted: true,
          },
        });

        // Create or update developer profile
        const developerProfile = await tx.developerProfile.upsert({
          where: { userId: session.user.id },
          create: {
            userId: session.user.id,
            bio: data.bio,
            experienceYears: data.experienceYears,
            level: data.level,
            linkedinUrl: data.linkedinUrl || null,
            portfolioLinks: data.portfolioLinks || [],
            whatsappNumber: data.whatsappNumber || null,
            whatsappVerified: data.whatsappVerified || false,
          },
          update: {
            bio: data.bio,
            experienceYears: data.experienceYears,
            level: data.level,
            linkedinUrl: data.linkedinUrl || null,
            portfolioLinks: data.portfolioLinks || [],
            whatsappNumber: data.whatsappNumber || null,
            whatsappVerified: data.whatsappVerified || false,
          },
        });

        // Handle skills
        if (data.skillsInput?.length > 0) {
          // Remove existing skills
          await tx.developerSkill.deleteMany({
            where: { developerProfileId: developerProfile.id },
          });

          // Process each skill
          for (const skillInput of data.skillsInput) {
            if (!skillInput.name.trim()) continue;

            // Find or create skill
            const skill = await tx.skill.upsert({
              where: { name: skillInput.name.trim() },
              create: {
                name: skillInput.name.trim(),
                keywords: [skillInput.name.toLowerCase().trim()],
              },
              update: {},
            });

            // Create developer skill
            await tx.developerSkill.create({
              data: {
                developerProfileId: developerProfile.id,
                skillId: skill.id,
                years: skillInput.years,
                rating: skillInput.rating,
              },
            });
          }
        }
      });
    }

    return NextResponse.json({
      success: true,
      message: "Profile completed successfully",
    });
  } catch (error) {
    console.error("Error completing profile:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
