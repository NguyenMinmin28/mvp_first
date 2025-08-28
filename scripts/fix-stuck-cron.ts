import { prisma } from "../src/core/database/db";

async function fixStuckCronJobs() {
  console.log("🔧 Fixing Stuck Cron Jobs...");
  
  try {
    // Find stuck cron runs (status="started" for more than 10 minutes)
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    
    const stuckCronRuns = await (prisma as any).cronRun.findMany({
      where: {
        status: "started",
        startedAt: {
          lt: tenMinutesAgo
        }
      },
      orderBy: {
        startedAt: "desc"
      }
    });

    console.log(`📊 Found ${stuckCronRuns.length} stuck cron jobs`);

    if (stuckCronRuns.length === 0) {
      console.log("✅ No stuck cron jobs found!");
      return;
    }

    let fixedCount = 0;

    for (const cronRun of stuckCronRuns) {
      console.log(`\n🔧 Fixing stuck cron run:`);
      console.log(`   ID: ${cronRun.id}`);
      console.log(`   Job: ${cronRun.job}`);
      console.log(`   Started: ${cronRun.startedAt.toISOString()}`);
      console.log(`   Duration stuck: ${Math.round((Date.now() - cronRun.startedAt.getTime()) / 1000 / 60)} minutes`);

      // Mark as failed with timeout error
      await (prisma as any).cronRun.update({
        where: { id: cronRun.id },
        data: {
          status: "failed",
          success: false,
          finishedAt: new Date(),
          details: {
            ...cronRun.details as any,
            error: "Job timed out - marked as failed by cleanup script",
            timeoutAt: new Date().toISOString(),
            originalStartTime: cronRun.startedAt.toISOString()
          }
        }
      });

      console.log(`✅ Marked cron run ${cronRun.id} as failed`);
      fixedCount++;
    }

    console.log(`\n🎉 Fixed ${fixedCount} stuck cron jobs!`);

    // Show current status
    const recentCronRuns = await (prisma as any).cronRun.findMany({
      where: {
        job: "reconcile-subscriptions"
      },
      orderBy: {
        startedAt: "desc"
      },
      take: 5
    });

    console.log(`\n📊 Recent cron runs status:`);
    for (const run of recentCronRuns) {
      const duration = run.finishedAt 
        ? `${Math.round((run.finishedAt.getTime() - run.startedAt.getTime()) / 1000)}s`
        : "Running...";
      
      console.log(`   ${run.status.padEnd(10)} ${run.startedAt.toISOString()} (${duration})`);
    }

  } catch (error) {
    console.error("❌ Error fixing stuck cron jobs:", error);
  }
}

// Run the fix
fixStuckCronJobs()
  .then(() => {
    console.log("\n🎉 Stuck cron jobs fix completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Stuck cron jobs fix failed:", error);
    process.exit(1);
  });
