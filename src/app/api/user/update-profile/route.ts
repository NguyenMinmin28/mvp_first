import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/features/auth/auth";
import { prisma as db } from "@/core/database/db";
import { FollowNotificationService } from "@/core/services/follow-notification.service";

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
      if (body.photoUrl !== undefined)
        clientUpdateData.photoUrl = body.photoUrl;

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
      if (body.photoUrl !== undefined)
        developerUpdateData.photoUrl = body.photoUrl;
      if (body.location !== undefined)
        developerUpdateData.location = body.location;
      // Coerce and validate number-like inputs
      if (body.age !== undefined) {
        const ageNum = typeof body.age === "string" ? parseInt(body.age, 10) : Number(body.age);
        if (!Number.isNaN(ageNum)) developerUpdateData.age = ageNum;
      }
      const hrInput = body.hourlyRate ?? body.hourlyRateUsd;
      if (hrInput !== undefined) {
        const hrNum = typeof hrInput === "string" ? parseFloat(hrInput) : Number(hrInput);
        if (!Number.isNaN(hrNum)) developerUpdateData.hourlyRateUsd = Math.round(hrNum);
      }

      if (Object.keys(developerUpdateData).length > 0) {
        const existing = await db.developerProfile.findUnique({ where: { userId } });
        if (existing) {
          // Check if portfolio was updated
          const portfolioUpdated = developerUpdateData.portfolioLinks !== undefined || 
                                  developerUpdateData.bio !== undefined ||
                                  developerUpdateData.linkedinUrl !== undefined;
          
          // Check if availability status changed
          const availabilityChanged = developerUpdateData.currentStatus !== undefined && 
                                     developerUpdateData.currentStatus !== existing.currentStatus;

          await db.developerProfile.update({ where: { userId }, data: developerUpdateData });

          // Send follow notifications
          if (portfolioUpdated) {
            await FollowNotificationService.notifyPortfolioUpdate(userId, session.user.name || "Developer");
          }
          
          if (availabilityChanged) {
            await FollowNotificationService.notifyAvailabilityChange(
              existing.id, // developer profile ID
              session.user.name || "Developer", 
              developerUpdateData.currentStatus
            );
          }
        } else {
          // Provide required defaults for new developer profiles
          await db.developerProfile.create({
            data: {
              userId,
              level: "FRESHER",
              experienceYears: 0,
              currentStatus: developerUpdateData.currentStatus ?? "available",
              adminApprovalStatus: "draft",
              ...developerUpdateData,
            },
          });
        }
      }

      // Sync skills if provided
      if (Array.isArray(body.skillIds)) {
        const profile = await db.developerProfile.findUnique({ where: { userId } });
        if (profile) {
          const current = await db.developerSkill.findMany({
            where: { developerProfileId: profile.id },
            select: { id: true, skillId: true },
          });
          const currentIds = new Set(current.map((s) => s.skillId));
          const incomingIds = new Set<string>(body.skillIds as string[]);

          const toAdd = [...incomingIds].filter((id) => !currentIds.has(id));
          const toRemove = current.filter((s) => !incomingIds.has(s.skillId)).map((s) => s.id);

          if (toAdd.length > 0) {
            await db.developerSkill.createMany({
              data: toAdd.map((skillId: string) => ({ developerProfileId: profile.id, skillId })),
            });
          }
          if (toRemove.length > 0) {
            await db.developerSkill.deleteMany({ where: { id: { in: toRemove } } });
          }
        }
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
