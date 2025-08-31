export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { OtpService } from "@/core/services/otp.service";
import { WhatsAppService } from "@/core/services/whatsapp.service";

export async function POST(request: NextRequest) {
  try {
    let phoneNumber: string;
    let verificationCode: string;

    // Handle both JSON and form data
    const contentType = request.headers.get("content-type");

    if (contentType?.includes("application/json")) {
      const jsonData = await request.json();
      phoneNumber = jsonData.phoneNumber;
      verificationCode = jsonData.verificationCode;
    } else if (contentType?.includes("application/x-www-form-urlencoded")) {
      const formData = await request.formData();
      phoneNumber = formData.get("phoneNumber") as string;
      verificationCode = formData.get("verificationCode") as string;
    } else {
      return NextResponse.json(
        { error: "Unsupported content type. Use JSON or form data." },
        { status: 400 }
      );
    }

    console.log("🔍 OTP Verification Request:", {
      phoneNumber,
      verificationCode,
      contentType,
    });

    if (!phoneNumber || !verificationCode) {
      return NextResponse.json(
        { error: "Phone number and verification code are required" },
        { status: 400 }
      );
    }

    // Format phone number to E.164
    const phoneE164 = WhatsAppService.formatPhoneNumber(phoneNumber);
    console.log("📱 Phone number formatting:", {
      original: phoneNumber,
      formatted: phoneE164,
    });

    // Validate phone number format
    if (!WhatsAppService.validatePhoneNumber(phoneE164)) {
      console.log("❌ Invalid phone number format:", phoneE164);
      return NextResponse.json(
        { error: "Invalid phone number format" },
        { status: 400 }
      );
    }

    // Verify OTP
    console.log("🔐 Verifying OTP for:", phoneE164);
    const otpResult = await OtpService.verifyOtp(phoneE164, verificationCode);
    console.log("🔐 OTP verification result:", otpResult);

    if (!otpResult.success) {
      return NextResponse.json(
        {
          error: otpResult.message,
          remainingAttempts: otpResult.remainingAttempts,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Verification successful",
      phoneNumber: phoneE164,
    });
  } catch (error) {
    console.error("OTP verification error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
