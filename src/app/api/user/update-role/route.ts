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
    console.log("🔍 Starting role update process...");
    
    const session = await getServerSession(authOptions);
    console.log("🔍 Session:", session?.user?.id);

    if (!session?.user?.id) {
      console.log("❌ No session or user ID found");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    console.log("🔍 Request body:", body);
    
    const { role } = updateRoleSchema.parse(body);
    console.log("🔍 Parsed role:", role);

    console.log("Updating user role and creating profile:", {
      userId: session.user.id,
      newRole: role,
    });

    // Check if user already has a different role
    const existingUser = await db.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });
    console.log("🔍 Existing user:", existingUser);

    if (existingUser?.role && existingUser.role !== role) {
      console.log("❌ User already has different role");
      return NextResponse.json(
        {
          error: `User already has role ${existingUser.role}. Cannot change to ${role}.`,
        },
        { status: 400 }
      );
    }

    // Use transaction to ensure both operations succeed or fail together
    console.log("🔍 Starting database transaction...");
    const result = await db.$transaction(async (tx: any) => {
      console.log("🔍 Inside transaction...");
      
      // Check if profile already exists
      if (role === "CLIENT") {
        console.log("🔍 Checking for existing client profile...");
        const existingClientProfile = await tx.clientProfile.findUnique({
          where: { userId: session.user.id },
        });
        console.log("🔍 Existing client profile:", existingClientProfile);
        if (existingClientProfile) {
          throw new Error("Client profile already exists for this user");
        }
      } else if (role === "DEVELOPER") {
        console.log("🔍 Checking for existing developer profile...");
        const existingDeveloperProfile = await tx.developerProfile.findUnique({
          where: { userId: session.user.id },
        });
        console.log("🔍 Existing developer profile:", existingDeveloperProfile);
        if (existingDeveloperProfile) {
          throw new Error("Developer profile already exists for this user");
        }
      }

      // Update user role
      console.log("🔍 Updating user role...");
      const updatedUser = await tx.user.update({
        where: { id: session.user.id },
        data: {
          role,
          // For CLIENT we can consider completed; for DEVELOPER keep false until admin approval
          isProfileCompleted: role === "CLIENT",
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isProfileCompleted: true,
        },
      });
      console.log("🔍 Updated user:", updatedUser);

      // Create corresponding profile based on role
      if (role === "CLIENT") {
        console.log("🔍 Creating client profile...");
        await tx.clientProfile.create({
          data: {
            userId: session.user.id,
            companyName: null, // Will be filled later
            location: null, // Will be filled later
          },
        });
        console.log("✅ Client profile created successfully");
      } else if (role === "DEVELOPER") {
        console.log("🔍 Creating developer profile...");
        
        // First create a ReviewsAggregate record
        const reviewsSummary = await tx.reviewsAggregate.create({
          data: {
            averageRating: 0,
            totalReviews: 0,
          },
        });
        console.log("🔍 Created reviews summary:", reviewsSummary);
        
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
            reviewsSummaryId: reviewsSummary.id, // Link to the created reviews summary
          },
        });
        console.log("✅ Developer profile created successfully");
      }

      return updatedUser;
    });

    console.log("✅ User role updated and profile created successfully:", result);

    return NextResponse.json({
      success: true,
      user: result,
      message: `Role updated to ${role} and profile created`,
    });
  } catch (error) {
    console.error("❌ Error updating user role and creating profile:", error);
    console.error("❌ Error stack:", error instanceof Error ? error.stack : "No stack trace");

    if (error instanceof z.ZodError) {
      console.error("❌ Zod validation error:", error.issues);
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
