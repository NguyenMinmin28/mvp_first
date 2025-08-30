// @ts-nocheck
/**
 * Script to sync PayPal plan IDs with database Package records
 * Run with: npx tsx scripts/paypal/sync-plans.ts
 */

import { prisma } from "../../src/core/database/db";
import { logger } from "../../src/lib/logger";

// Update these with your actual PayPal plan IDs after running seed-products-plans.ts
const PLAN_MAPPING = {
  "Basic Plan": process.env.PAYPAL_PLAN_ID_BASIC_PLAN,
  "Standard Plan": process.env.PAYPAL_PLAN_ID_STANDARD_PLAN, 
  "Premium Plan": process.env.PAYPAL_PLAN_ID_PREMIUM_PLAN,
};

async function syncPlans() {
  try {
    logger.info("🔄 Starting PayPal plans sync with database");

    for (const [planName, paypalPlanId] of Object.entries(PLAN_MAPPING)) {
      if (!paypalPlanId) {
        logger.warn(`No PayPal plan ID found for ${planName}. Set PAYPAL_PLAN_ID_${planName.toUpperCase().replace(/\s+/g, '_')} in environment.`);
        continue;
      }

      // Find existing package
      const existingPackage = await prisma.package.findFirst({
        where: { name: planName }
      });

      if (existingPackage) {
        // Update existing package
        await prisma.package.update({
          where: { id: existingPackage.id },
          data: { 
            providerPlanId: paypalPlanId,
            provider: "paypal",
            active: true
          }
        });
        
        logger.info(`✅ Updated ${planName} with plan ID: ${paypalPlanId}`);
      } else {
        logger.warn(`Package not found: ${planName}. Create it manually or run seed-billing-packages.ts first.`);
      }
    }

    // Verify sync
    const syncedPackages = await prisma.package.findMany({
      where: {
        provider: "paypal",
        providerPlanId: { not: null },
        active: true
      }
    });

    logger.info(`🎉 Sync completed! ${syncedPackages.length} packages now have PayPal plan IDs.`);

    console.log("\n📋 Current packages:");
    syncedPackages.forEach(pkg => {
      console.log(`- ${pkg.name}: ${pkg.providerPlanId} ($${pkg.priceUSD}/month)`);
    });

  } catch (error) {
    logger.error("❌ Sync failed", error as Error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
if (require.main === module) {
  syncPlans();
}
