/**
 * Migration script to split currentStatus into accountStatus and availabilityStatus
 * 
 * Logic:
 * - online/offline -> accountStatus
 * - available/not_available -> availabilityStatus
 * 
 * For existing data:
 * - If currentStatus is "online" or "offline" -> accountStatus = currentStatus, availabilityStatus = "available" (default)
 * - If currentStatus is "available" or "not_available" -> availabilityStatus = currentStatus, accountStatus = "offline" (default)
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function migrateStatusSplit() {
  console.log("🔄 Starting status split migration...");

  try {
    // Get all developer profiles
    const profiles = await prisma.developerProfile.findMany({
      select: {
        id: true,
        currentStatus: true,
      },
    });

    console.log(`📊 Found ${profiles.length} developer profiles to migrate`);

    let migrated = 0;
    let skipped = 0;

    for (const profile of profiles) {
      const currentStatus = profile.currentStatus;

      // Determine accountStatus and availabilityStatus based on currentStatus
      let accountStatus: "online" | "offline";
      let availabilityStatus: "available" | "not_available";

      if (currentStatus === "online" || currentStatus === "offline") {
        // These are account statuses
        accountStatus = currentStatus as "online" | "offline";
        availabilityStatus = "available"; // Default to available
      } else if (currentStatus === "available" || currentStatus === "not_available") {
        // These are availability statuses
        availabilityStatus = currentStatus as "available" | "not_available";
        accountStatus = "offline"; // Default to offline
      } else {
        // Unknown status, use defaults
        console.warn(`⚠️ Unknown status "${currentStatus}" for profile ${profile.id}, using defaults`);
        accountStatus = "offline";
        availabilityStatus = "available";
      }

      // Update the profile
      await prisma.developerProfile.update({
        where: { id: profile.id },
        data: {
          accountStatus,
          availabilityStatus,
        },
      });

      migrated++;
    }

    console.log(`✅ Migration completed:`);
    console.log(`   - Migrated: ${migrated}`);
    console.log(`   - Skipped: ${skipped}`);
    console.log(`   - Total: ${profiles.length}`);

  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration
migrateStatusSplit()
  .then(() => {
    console.log("✅ Status split migration completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Status split migration failed:", error);
    process.exit(1);
  });

