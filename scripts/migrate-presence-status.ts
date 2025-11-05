/**
 * Migration script to update PresenceStatus enum values
 * Migrates from old statuses (checking, busy, away) to new statuses (available, not_available, online, offline)
 * Uses raw MongoDB queries to bypass Prisma enum validation
 */

import { MongoClient } from "mongodb";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function migratePresenceStatus() {
  console.log("🔄 Starting PresenceStatus migration...");

  const mongoUrl = process.env.DATABASE_URL;
  if (!mongoUrl) {
    throw new Error("DATABASE_URL not found in environment variables");
  }

  const mongoClient = new MongoClient(mongoUrl);

  try {
    await mongoClient.connect();
    console.log("✅ Connected to MongoDB");

    const db = mongoClient.db();
    const developerProfilesCollection = db.collection("DeveloperProfile");
    const activityLogsCollection = db.collection("DeveloperActivityLog");

    // Migration mapping
    const migrationMap: Record<string, string> = {
      checking: "online", // checking -> online
      busy: "not_available", // busy -> not_available
      away: "offline", // away -> offline
      // available stays as available
      // New statuses (online, offline, not_available) stay as is
    };

    // Migrate DeveloperProfile
    console.log("\n📊 Migrating DeveloperProfile...");
    
    let migrated = 0;
    let skipped = 0;

    for (const [oldStatus, newStatus] of Object.entries(migrationMap)) {
      const result = await developerProfilesCollection.updateMany(
        { currentStatus: oldStatus },
        { $set: { currentStatus: newStatus } }
      );
      
      if (result.modifiedCount > 0) {
        console.log(`✅ Updated ${result.modifiedCount} profiles: ${oldStatus} → ${newStatus}`);
        migrated += result.modifiedCount;
      }
    }

    // Count how many already have valid statuses
    const validStatuses = ["available", "online", "offline", "not_available"];
    const validCount = await developerProfilesCollection.countDocuments({
      currentStatus: { $in: validStatuses },
    });
    skipped = validCount;

    console.log(`\n📈 DeveloperProfile Migration Summary:`);
    console.log(`✅ Migrated: ${migrated} profiles`);
    console.log(`⏭️  Already valid: ${skipped} profiles`);

    // Migrate DeveloperActivityLog
    console.log("\n🔄 Migrating DeveloperActivityLog entries...");
    
    let logMigrated = 0;
    for (const [oldStatus, newStatus] of Object.entries(migrationMap)) {
      const result = await activityLogsCollection.updateMany(
        { status: oldStatus },
        { $set: { status: newStatus } }
      );
      
      if (result.modifiedCount > 0) {
        console.log(`✅ Updated ${result.modifiedCount} logs: ${oldStatus} → ${newStatus}`);
        logMigrated += result.modifiedCount;
      }
    }

    console.log(`\n📈 ActivityLog Migration Summary:`);
    console.log(`✅ Migrated: ${logMigrated} activity log entries`);

    console.log(`\n🎉 Migration completed successfully!`);
    console.log(`\n📋 Summary:`);
    console.log(`   - DeveloperProfile: ${migrated} migrated, ${skipped} already valid`);
    console.log(`   - DeveloperActivityLog: ${logMigrated} migrated`);

  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  } finally {
    await mongoClient.close();
    await prisma.$disconnect();
  }
}

// Run migration
migratePresenceStatus()
  .then(() => {
    console.log("\n✨ All done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Migration failed:", error);
    process.exit(1);
  });

