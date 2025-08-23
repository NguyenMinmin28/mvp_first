/**
 * Script to fix database data before pushing schema
 * Run: pnpm tsx scripts/fix-database.ts
 */

import { PrismaClient } from "@prisma/client";

async function fixDatabase() {
  console.log("🔧 Fixing database data...\n");

  const prisma = new PrismaClient();

  try {
    // 1. Check current users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        phoneNumber: true,
        email: true,
        name: true,
      },
    });

    console.log("📊 Current users:", users);

    // 2. Fix users with null phoneNumber
    const usersWithNullPhone = users.filter((u) => u.phoneNumber === null);

    if (usersWithNullPhone.length > 0) {
      console.log(
        `\n🔧 Found ${usersWithNullPhone.length} users with null phoneNumber`
      );

      for (const user of usersWithNullPhone) {
        // Generate unique phone number for existing users
        const uniquePhone = `+84${Date.now()}${Math.random().toString(36).substr(2, 4)}`;

        console.log(`  Updating user ${user.id}: null → ${uniquePhone}`);

        await prisma.user.update({
          where: { id: user.id },
          data: { phoneNumber: uniquePhone },
        });
      }

      console.log("✅ Fixed users with null phoneNumber");
    } else {
      console.log("✅ No users with null phoneNumber found");
    }

    // 3. Check final state
    const finalUsers = await prisma.user.findMany({
      select: {
        id: true,
        phoneNumber: true,
        email: true,
        name: true,
      },
    });

    console.log("\n📊 Final users state:", finalUsers);
  } catch (error) {
    console.error("❌ Error fixing database:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the fix
fixDatabase()
  .then(() => {
    console.log("\n🎉 Database fix completed!");
    console.log("💡 Now you can run: pnpm prisma:push");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Database fix failed:", error);
    process.exit(1);
  });
