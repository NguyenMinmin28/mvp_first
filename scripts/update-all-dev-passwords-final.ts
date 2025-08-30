// @ts-nocheck
import { prisma } from "../src/core/database/db";
import bcrypt from "bcryptjs";

async function updateAllDevPasswordsFinal() {
  try {
    console.log("🔐 Updating ALL developer passwords...");
    
    // Hash password once
    const password = "password123";
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Update ALL developers with password, regardless of current status
    const result = await prisma.user.updateMany({
      where: { 
        role: "DEVELOPER"
      },
      data: { passwordHash: hashedPassword }
    });
    
    console.log(`✅ Updated ${result.count} developers!`);
    
    console.log("\n🎉 Successfully added passwords to ALL developers!");
    console.log("📧 Login credentials:");
    console.log("   Email: any developer email");
    console.log("   Password: password123");
    
    // Show all developer emails
    console.log("\n📋 All developer emails:");
    const allDevs = await prisma.user.findMany({
      where: { role: "DEVELOPER" },
      select: { email: true, name: true },
      orderBy: { email: 'asc' }
    });
    
    allDevs.forEach(dev => {
      console.log(`   - ${dev.email} (${dev.name})`);
    });
    
    console.log(`\n🔢 Total: ${allDevs.length} developers`);
    
  } catch (error) {
    console.error("❌ Error adding passwords:", error);
  } finally {
    await prisma.$disconnect();
  }
}

updateAllDevPasswordsFinal();
