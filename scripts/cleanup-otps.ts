// @ts-nocheck
/**
 * Script to cleanup expired OTP codes
 * Run this script periodically (e.g., via cron job) to keep the database clean
 */

import { OtpService } from "../src/core/services/otp.service";

async function cleanupExpiredOtps() {
  try {
    console.log("Starting OTP cleanup...");

    const deletedCount = await OtpService.cleanupExpiredOtps();
    console.log(
      `✅ Cleanup completed. Deleted ${deletedCount} expired OTP codes.`
    );

    // Get statistics
    const stats = await OtpService.getOtpStats();
    console.log("📊 Current OTP Statistics:");
    console.log(`  - Active OTPs: ${stats.totalActive}`);
    console.log(`  - Expired OTPs: ${stats.expiredCount}`);
    console.log(`  - High attempt OTPs: ${stats.highAttemptCount}`);
  } catch (error) {
    console.error("❌ Error during OTP cleanup:", error);
    process.exit(1);
  }
}

// Run the cleanup
cleanupExpiredOtps()
  .then(() => {
    console.log("🎉 OTP cleanup script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 OTP cleanup script failed:", error);
    process.exit(1);
  });
