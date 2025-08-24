import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    // Kiểm tra xem đã có admin nào chưa
    const existingAdmin = await prisma.user.findFirst({
      where: {
        role: "ADMIN",
      },
    });

    if (existingAdmin) {
      console.log("❌ Admin account already exists:", existingAdmin.email);
      return;
    }

    // Tạo admin account
    const adminEmail = process.env.ADMIN_EMAIL || "admin@example.com";
    const adminPassword = process.env.ADMIN_PASSWORD || "admin123";

    // Hash password
    const hashedPassword = await bcrypt.hash(adminPassword, 12);

    const admin = await prisma.user.create({
      data: {
        email: adminEmail,
        name: "Administrator",
        passwordHash: hashedPassword,
        role: "ADMIN",
        isProfileCompleted: true,
        status: "ACTIVE",
      },
    });

    console.log("✅ Admin account created successfully!");
    console.log("📧 Email:", admin.email);
    console.log("🔑 Password:", adminPassword);
    console.log("🆔 User ID:", admin.id);
    console.log("👤 Role:", admin.role);
  } catch (error) {
    console.error("❌ Error creating admin account:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Chạy script
createAdmin();
