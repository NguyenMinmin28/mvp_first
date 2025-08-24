import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/features/auth/auth";
import { prisma as db } from "@/core/database/db";
import { z } from "zod";

const updateRoleSchema = z.object({
  role: z.enum(["CLIENT", "DEVELOPER"]),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { role } = updateRoleSchema.parse(body);

    console.log("Updating user role and creating profile:", {
      userId: session.user.id,
      newRole: role,
    });

    // Check if user already has a different role
    const existingUser = await db.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (existingUser?.role && existingUser.role !== role) {
      return NextResponse.json(
        {
          error: `User already has role ${existingUser.role}. Cannot change to ${role}.`,
        },
        { status: 400 }
      );
    }

    // Use transaction to ensure both operations succeed or fail together
    const result = await db.$transaction(async (tx) => {
      // Check if profile already exists
      if (role === "CLIENT") {
        const existingClientProfile = await tx.clientProfile.findUnique({
          where: { userId: session.user.id },
        });
        if (existingClientProfile) {
          throw new Error("Client profile already exists for this user");
        }
      } else if (role === "DEVELOPER") {
        const existingDeveloperProfile = await tx.developerProfile.findUnique({
          where: { userId: session.user.id },
        });
        if (existingDeveloperProfile) {
          throw new Error("Developer profile already exists for this user");
        }
      }

      // Update user role
      const updatedUser = await tx.user.update({
        where: { id: session.user.id },
        data: {
          role,
          isProfileCompleted: true, // Mark profile as completed since we're creating the profile
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isProfileCompleted: true,
        },
      });

      // Create corresponding profile based on role
      if (role === "CLIENT") {
        await tx.clientProfile.create({
          data: {
            userId: session.user.id,
            companyName: null, // Will be filled later
            location: null, // Will be filled later
          },
        });
        console.log("Client profile created successfully");
      } else if (role === "DEVELOPER") {
        await tx.developerProfile.create({
          data: {
            userId: session.user.id,
            photoUrl: null, // Will be filled later
            bio: null, // Will be filled later
            experienceYears: 0, // Default value
            level: "FRESHER", // Default level
            linkedinUrl: null, // Will be filled later
            portfolioLinks: [], // Empty array by default
            whatsappNumber: null, // Will be filled later
            whatsappVerified: false, // Default value
            usualResponseTimeMs: 0, // Default value
            currentStatus: "available", // Default status
            adminApprovalStatus: "draft", // Default status
          },
        });
        console.log("Developer profile created successfully");
      }

      return updatedUser;
    });

    console.log("User role updated and profile created successfully:", result);

    return NextResponse.json({
      success: true,
      user: result,
      message: `Role updated to ${role} and profile created`,
    });
  } catch (error) {
    console.error("Error updating user role and creating profile:", error);

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
