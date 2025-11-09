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
      if (body.resumeUrl !== undefined)
        developerUpdateData.resumeUrl = body.resumeUrl;
      if (body.whatsappNumber !== undefined)
        developerUpdateData.whatsappNumber = body.whatsappNumber;
      if (body.whatsappVerified !== undefined)
        developerUpdateData.whatsappVerified = body.whatsappVerified;
      if (body.usualResponseTimeMs !== undefined)
        developerUpdateData.usualResponseTimeMs = body.usualResponseTimeMs;
      // Handle availabilityStatus (available/not_available) - independent from login/logout
      if (body.availabilityStatus !== undefined) {
        developerUpdateData.availabilityStatus = body.availabilityStatus;
        // Keep currentStatus for backward compatibility
        developerUpdateData.currentStatus = body.availabilityStatus;
      }
      // DEPRECATED: currentStatus - kept for backward compatibility only
      if (body.currentStatus !== undefined && body.availabilityStatus === undefined) {
        // Only update if availabilityStatus is not provided
        // This is for backward compatibility
        const status = body.currentStatus;
        if (status === "available" || status === "not_available") {
          developerUpdateData.availabilityStatus = status;
        }
        developerUpdateData.currentStatus = status;
      }
      // Note: portfolioLinks is deprecated - portfolios are now managed via Portfolio table
      // If portfolioLinks is provided as array of objects, ignore it
      // If it's provided as String[], we can still update it for backward compatibility
      if (body.portfolioLinks !== undefined) {
        // Only update if it's an array of strings (String[])
        if (Array.isArray(body.portfolioLinks) && body.portfolioLinks.length > 0) {
          // Check if first element is a string (String[]) or object (Portfolio objects)
          if (typeof body.portfolioLinks[0] === 'string') {
            developerUpdateData.portfolioLinks = body.portfolioLinks;
          }
          // If it's objects, ignore it - portfolios should be managed via /api/portfolio
        } else if (Array.isArray(body.portfolioLinks) && body.portfolioLinks.length === 0) {
          // Empty array is valid
          developerUpdateData.portfolioLinks = [];
        }
      }
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
          // Check if portfolio was updated (only if portfolioLinks is actually being updated as String[])
          const portfolioLinksUpdated = developerUpdateData.portfolioLinks !== undefined && 
                                       Array.isArray(developerUpdateData.portfolioLinks) &&
                                       (developerUpdateData.portfolioLinks.length === 0 || typeof developerUpdateData.portfolioLinks[0] === 'string');
          const portfolioUpdated = portfolioLinksUpdated || 
                                  developerUpdateData.bio !== undefined ||
                                  developerUpdateData.linkedinUrl !== undefined;
          
          // Check if availability status changed
          const availabilityChanged = (developerUpdateData.availabilityStatus !== undefined && 
                                     developerUpdateData.availabilityStatus !== existing.availabilityStatus) ||
                                     (developerUpdateData.currentStatus !== undefined && 
                                     (developerUpdateData.currentStatus === "available" || developerUpdateData.currentStatus === "not_available") &&
                                     developerUpdateData.currentStatus !== existing.availabilityStatus);

          await db.developerProfile.update({ where: { userId }, data: developerUpdateData });
          // Record activity time on user whenever availability/status changes or profile updates
          try {
            await db.user.update({ where: { id: userId }, data: { lastLoginAt: new Date() } });
          } catch {}

          // Send follow notifications
          if (portfolioUpdated) {
            await FollowNotificationService.notifyPortfolioUpdate(userId, session.user.name || "Developer");
          }
          
          if (availabilityChanged) {
            const newAvailabilityStatus = developerUpdateData.availabilityStatus || 
                                        (developerUpdateData.currentStatus === "available" || developerUpdateData.currentStatus === "not_available" 
                                          ? developerUpdateData.currentStatus 
                                          : existing.availabilityStatus);
            await FollowNotificationService.notifyAvailabilityChange(
              existing.id, // developer profile ID
              session.user.name || "Developer", 
              newAvailabilityStatus
            );
          }
        } else {
          // Provide required defaults for new developer profiles
          await db.developerProfile.create({
            data: {
              userId,
              level: "FRESHER",
              experienceYears: 0,
              // Set both accountStatus and availabilityStatus explicitly
              accountStatus: "offline", // New developer starts offline (will be set to online on first login)
              availabilityStatus: developerUpdateData.availabilityStatus ?? "available", // Default to available
              currentStatus: developerUpdateData.currentStatus ?? developerUpdateData.availabilityStatus ?? "available", // Deprecated field
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
