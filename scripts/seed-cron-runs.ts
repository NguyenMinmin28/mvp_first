import { prisma } from "../src/core/database/db";

async function seedCronRuns() {
  console.log("🌱 Seeding cron runs for testing...");
  
  const now = new Date();
  const cronRuns = [
    // Recent successful runs
    {
      job: "reconcile-subscriptions",
      status: "succeeded",
      success: true,
      startedAt: new Date(now.getTime() - 2 * 60 * 1000), // 2 minutes ago
      finishedAt: new Date(now.getTime() - 1 * 60 * 1000), // 1 minute ago
      details: {
        processed: 15,
        updated: 2,
        errors: 0,
        correlationId: "corr-test-1"
      }
    },
    {
      job: "reconcile-subscriptions",
      status: "succeeded",
      success: true,
      startedAt: new Date(now.getTime() - 7 * 60 * 1000), // 7 minutes ago
      finishedAt: new Date(now.getTime() - 6 * 60 * 1000), // 6 minutes ago
      details: {
        processed: 17,
        updated: 0,
        errors: 0,
        correlationId: "corr-test-2"
      }
    },
    {
      job: "reconcile-subscriptions",
      status: "succeeded",
      success: true,
      startedAt: new Date(now.getTime() - 12 * 60 * 1000), // 12 minutes ago
      finishedAt: new Date(now.getTime() - 11 * 60 * 1000), // 11 minutes ago
      details: {
        processed: 14,
        updated: 1,
        errors: 0,
        correlationId: "corr-test-3"
      }
    },
    // Failed runs
    {
      job: "reconcile-subscriptions",
      status: "failed",
      success: false,
      startedAt: new Date(now.getTime() - 17 * 60 * 1000), // 17 minutes ago
      finishedAt: new Date(now.getTime() - 16 * 60 * 1000), // 16 minutes ago
      details: {
        error: "PayPal API rate limit exceeded",
        stack: "Error: Rate limit exceeded\n    at PayPalService.getSubscription (/app/src/modules/paypal/paypal.service.ts:45:12)\n    at ReconciliationJob.reconcileSubscription (/app/src/modules/billing/reconciliation.job.ts:89:23)",
        correlationId: "corr-test-4"
      }
    },
    {
      job: "reconcile-subscriptions",
      status: "failed",
      success: false,
      startedAt: new Date(now.getTime() - 22 * 60 * 1000), // 22 minutes ago
      finishedAt: new Date(now.getTime() - 21 * 60 * 1000), // 21 minutes ago
      details: {
        error: "Database connection timeout",
        correlationId: "corr-test-5"
      }
    },
    // Currently running job
    {
      job: "reconcile-subscriptions",
      status: "started",
      success: null,
      startedAt: new Date(now.getTime() - 30 * 1000), // 30 seconds ago
      finishedAt: null,
      details: {
        correlationId: "corr-test-6"
      }
    },
    // Older successful runs
    {
      job: "reconcile-subscriptions",
      status: "succeeded",
      success: true,
      startedAt: new Date(now.getTime() - 27 * 60 * 1000), // 27 minutes ago
      finishedAt: new Date(now.getTime() - 26 * 60 * 1000), // 26 minutes ago
      details: {
        processed: 16,
        updated: 0,
        errors: 0,
        correlationId: "corr-test-7"
      }
    },
    {
      job: "reconcile-subscriptions",
      status: "succeeded",
      success: true,
      startedAt: new Date(now.getTime() - 32 * 60 * 1000), // 32 minutes ago
      finishedAt: new Date(now.getTime() - 31 * 60 * 1000), // 31 minutes ago
      details: {
        processed: 13,
        updated: 3,
        errors: 0,
        correlationId: "corr-test-8"
      }
    },
    {
      job: "reconcile-subscriptions",
      status: "succeeded",
      success: true,
      startedAt: new Date(now.getTime() - 37 * 60 * 1000), // 37 minutes ago
      finishedAt: new Date(now.getTime() - 36 * 60 * 1000), // 36 minutes ago
      details: {
        processed: 18,
        updated: 1,
        errors: 0,
        correlationId: "corr-test-9"
      }
    },
    {
      job: "reconcile-subscriptions",
      status: "succeeded",
      success: true,
      startedAt: new Date(now.getTime() - 42 * 60 * 1000), // 42 minutes ago
      finishedAt: new Date(now.getTime() - 41 * 60 * 1000), // 41 minutes ago
      details: {
        processed: 15,
        updated: 0,
        errors: 0,
        correlationId: "corr-test-10"
      }
    }
  ];

  try {
    for (const cronRun of cronRuns) {
      await (prisma as any).cronRun.create({
        data: cronRun
      });
    }
    
    console.log(`✅ Created ${cronRuns.length} cron run records`);
    console.log("📊 Sample data includes:");
    console.log("   - Recent successful runs");
    console.log("   - Failed runs with error details");
    console.log("   - Currently running job");
    console.log("   - Older historical runs");
    
  } catch (error) {
    console.error("❌ Failed to seed cron runs:", error);
    process.exit(1);
  }
}

// Run the seed
seedCronRuns()
  .then(() => {
    console.log("🎉 Cron runs seeding completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Cron runs seeding failed:", error);
    process.exit(1);
  });
