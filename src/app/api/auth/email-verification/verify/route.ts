export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { EmailVerificationService } from "@/core/services/email-verification.service";

export async function POST(request: NextRequest) {
  try {
    const { email, code } = await request.json();

    if (!email || !code) {
      return NextResponse.json(
        { error: "Email and verification code are required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Validate code format (6 digits)
    if (!/^\d{6}$/.test(code)) {
      return NextResponse.json(
        { error: "Verification code must be 6 digits" },
        { status: 400 }
      );
    }

    console.log("🔐 Verifying email OTP for:", email);

    // Verify OTP
    const verificationResult = await EmailVerificationService.verifyEmailOtp(
      email,
      code
    );

    if (!verificationResult.success) {
      return NextResponse.json(
        {
          error: verificationResult.message,
          remainingAttempts: verificationResult.remainingAttempts,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Email verification successful",
      email,
    });
  } catch (error) {
    console.error("Email verification error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
