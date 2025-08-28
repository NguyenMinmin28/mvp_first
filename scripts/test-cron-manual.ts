import { prisma } from "../src/core/database/db";
import { ReconciliationJob } from "../src/modules/billing/reconciliation.job";
import { logger } from "../src/lib/logger";

async function testCronManual() {
  console.log("🧪 Testing Manual Cron Job Execution...");
  
  const correlationId = logger.generateCorrelationId();
  
  try {
    // Create cron run record
    const cronRecord = await (prisma as any).cronRun.create({
      data: {
        job: "reconcile-subscriptions",
        status: "started",
        success: null,
        details: { correlationId, source: "manual-test" }
      }
    });

    console.log(`📝 Created cron run record: ${cronRecord.id}`);
    
    // Run reconciliation
    const result = await ReconciliationJob.reconcileAllSubscriptions();
    
    // Update cron run record
    await (prisma as any).cronRun.update({
      where: { id: cronRecord.id },
      data: {
        status: "succeeded",
        success: true,
        finishedAt: new Date(),
        details: { 
          correlationId, 
          source: "manual-test",
          ...result 
        }
      }
    });
    
    console.log("✅ Manual cron job completed successfully!");
    console.log(`📊 Results:`);
    console.log(`   - Processed: ${result.processed} subscriptions`);
    console.log(`   - Updated: ${result.updated} subscriptions`);
    console.log(`   - Errors: ${result.errors} subscriptions`);
    console.log(`   - Cron Run ID: ${cronRecord.id}`);
    
  } catch (error) {
    console.error("❌ Manual cron job failed:", error);
    
    // Create failed cron run record
    try {
      await (prisma as any).cronRun.create({
        data: {
          job: "reconcile-subscriptions",
          status: "failed",
          success: false,
          details: { 
            error: error instanceof Error ? error.message : String(error),
            correlationId,
            source: "manual-test"
          }
        }
      });
    } catch (dbError) {
      console.error("Failed to create error record:", dbError);
    }
    
    process.exit(1);
  }
}

// Run the test
testCronManual()
  .then(() => {
    console.log("🎉 Manual cron test completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Manual cron test failed:", error);
    process.exit(1);
  });
