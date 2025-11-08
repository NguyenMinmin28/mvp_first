import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function verifyMigration() {
  console.log("🔍 Verifying status migration...\n");

  const samples = await prisma.developerProfile.findMany({
    take: 5,
    select: {
      id: true,
      currentStatus: true,
      accountStatus: true,
      availabilityStatus: true,
    },
  });

  console.log("Sample migrated data:");
  console.log("=" .repeat(80));
  samples.forEach((p) => {
    console.log(
      `ID: ${p.id.substring(0, 8)}... | currentStatus: ${p.currentStatus} | accountStatus: ${p.accountStatus} | availabilityStatus: ${p.availabilityStatus}`
    );
  });

  // Count by status
  const stats = await prisma.developerProfile.groupBy({
    by: ["accountStatus", "availabilityStatus"],
    _count: true,
  });

  console.log("\n📊 Status distribution:");
  console.log("=" .repeat(80));
  stats.forEach((stat) => {
    console.log(
      `accountStatus: ${stat.accountStatus}, availabilityStatus: ${stat.availabilityStatus} -> ${stat._count} developers`
    );
  });

  await prisma.$disconnect();
}

verifyMigration()
  .then(() => {
    console.log("\n✅ Verification completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Verification failed:", error);
    process.exit(1);
  });

