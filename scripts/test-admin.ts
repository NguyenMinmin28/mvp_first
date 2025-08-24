import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function testAdmin() {
  try {
    console.log("🔍 Testing admin setup...");

    // Kiểm tra admin user
    const admin = await prisma.user.findFirst({
      where: {
        role: "ADMIN",
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isProfileCompleted: true,
      },
    });

    if (admin) {
      console.log("✅ Admin user found:");
      console.log("   ID:", admin.id);
      console.log("   Email:", admin.email);
      console.log("   Name:", admin.name);
      console.log("   Role:", admin.role);
      console.log("   Profile Completed:", admin.isProfileCompleted);
    } else {
      console.log("❌ No admin user found");
      console.log("   Run: pnpm create:admin");
    }

    // Kiểm tra tổng số user
    const totalUsers = await prisma.user.count();
    console.log("\n📊 Total users in database:", totalUsers);

    // Kiểm tra user theo role
    const usersByRole = await prisma.user.groupBy({
      by: ["role"],
      _count: {
        role: true,
      },
    });

    console.log("\n👥 Users by role:");
    usersByRole.forEach((group) => {
      console.log(`   ${group.role || "NO_ROLE"}: ${group._count.role}`);
    });
  } catch (error) {
    console.error("❌ Error testing admin setup:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Chạy test
testAdmin();
