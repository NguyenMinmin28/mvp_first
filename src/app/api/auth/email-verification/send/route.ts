export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { EmailVerificationService } from "@/core/services/email-verification.service";
import { prisma } from "@/core/database/db";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    console.log("📧 Generating email verification code for:", email);

    // Check if email already exists (prevent sending code to a registered email)
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json(
        { error: "Email already in use" },
        { status: 409 }
      );
    }

    // Generate OTP
    const otpResult = await EmailVerificationService.generateEmailOtp(email);

    if (!otpResult.success) {
      return NextResponse.json({ error: otpResult.message }, { status: 400 });
    }

    // Send email (skip in non-production)
    const emailSent = await EmailVerificationService.sendVerificationEmail(
      email,
      otpResult.code!
    );

    if (!emailSent) {
      // Provide more actionable error when missing envs
      const hasApiKey = !!process.env.RESEND_API_KEY;
      const fromAddr = process.env.RESEND_FROM;
      const hint = !hasApiKey
        ? "Missing RESEND_API_KEY"
        : `Check RESEND_FROM (using ${fromAddr}) or domain verification`;
      return NextResponse.json(
        {
          error: "Failed to send verification email",
          hint,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Verification code sent to your email",
      expiresAt: otpResult.expiresAt,
    });
  } catch (error) {
    console.error("Email verification generation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
