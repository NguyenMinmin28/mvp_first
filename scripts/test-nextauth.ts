/**
 * Script to test NextAuth WhatsApp authentication
 * Run: pnpm tsx scripts/test-nextauth.ts
 */

import { OtpService } from "../src/core/services/otp.service";
import { WhatsAppService } from "../src/core/services/whatsapp.service";

async function testNextAuthFlow() {
  console.log("🧪 Testing NextAuth WhatsApp Flow...\n");

  try {
    // 1. Generate OTP
    const phoneNumber = "0865848439";
    const phoneE164 = WhatsAppService.formatPhoneNumber(phoneNumber);

    console.log("📱 Phone number:", {
      original: phoneNumber,
      formatted: phoneE164,
    });

    const otpResult = await OtpService.generateOtp(phoneE164);
    console.log("🔐 OTP generated:", {
      success: otpResult.success,
      code: otpResult.code,
      expiresAt: otpResult.expiresAt,
    });

    if (!otpResult.success) {
      console.log("❌ Failed to generate OTP");
      return;
    }

    // 2. Verify OTP directly
    console.log("\n🔐 Testing OTP verification directly...");
    const verifyResult = await OtpService.verifyOtp(phoneE164, otpResult.code!);
    console.log("✅ OTP verification result:", verifyResult);

    if (!verifyResult.success) {
      console.log("❌ OTP verification failed");
      return;
    }

    // 3. Test user creation/lookup
    console.log("\n👤 Testing user creation/lookup...");

    // This simulates what NextAuth would do
    const { PrismaClient } = require("@prisma/client");
    const prisma = new PrismaClient();

    let user = await prisma.user.findUnique({
      where: { phoneNumber: phoneE164 },
    });

    if (!user) {
      console.log("👤 Creating new user...");
      user = await prisma.user.create({
        data: {
          phoneNumber: phoneE164,
          name: "",
          email: "",
        },
      });
      console.log("✅ User created:", user);
    } else {
      console.log("✅ User found:", user);
    }

    await prisma.$disconnect();

    console.log("\n🎉 All tests passed! NextAuth should work.");
    console.log("💡 If you still get 401, check:");
    console.log("   - CSRF token validation");
    console.log("   - NextAuth session configuration");
    console.log("   - Browser cookies and session");
  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

// Run the test
testNextAuthFlow()
  .then(() => {
    console.log("\n✨ Test completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Test failed:", error);
    process.exit(1);
  });
