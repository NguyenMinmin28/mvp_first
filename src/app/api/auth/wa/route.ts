export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import {
  getWhatsAppService,
  WhatsAppService,
} from "@/core/services/whatsapp.service";
import { OtpService } from "@/core/services/otp.service";

export async function POST(request: NextRequest) {
  try {
    let phoneNumber: string;

    // Handle both JSON and form data
    const contentType = request.headers.get("content-type");

    if (contentType?.includes("application/json")) {
      const jsonData = await request.json();
      phoneNumber = jsonData.phoneNumber;
    } else if (contentType?.includes("application/x-www-form-urlencoded")) {
      const formData = await request.formData();
      phoneNumber = formData.get("phoneNumber") as string;
    } else {
      return NextResponse.json(
        { error: "Unsupported content type. Use JSON or form data." },
        { status: 400 }
      );
    }

    if (!phoneNumber || phoneNumber.length < 10) {
      return NextResponse.json(
        { error: "Invalid phone number format" },
        { status: 400 }
      );
    }

    // Format phone number to E.164
    const phoneE164 = WhatsAppService.formatPhoneNumber(phoneNumber);

    // Validate phone number format
    if (!WhatsAppService.validatePhoneNumber(phoneE164)) {
      return NextResponse.json(
        {
          error:
            "Invalid phone number format. Please use international format (+country code)",
        },
        { status: 400 }
      );
    }

    // Generate OTP
    console.log("🔐 Generating OTP for:", phoneE164);
    const otpResult = await OtpService.generateOtp(phoneE164);
    console.log("🔐 OTP generation result:", {
      success: otpResult.success,
      code: otpResult.code,
      expiresAt: otpResult.expiresAt,
    });

    if (!otpResult.success) {
      return NextResponse.json(
        { error: otpResult.message },
        { status: 429 } // Too Many Requests
      );
    }

    // Check if in development mode AND we want to test real WhatsApp
    const isDevelopment = process.env.NODE_ENV === "development";
    const forceWhatsAppTest = process.env.FORCE_WHATSAPP_TEST === "true";

    if (isDevelopment && !forceWhatsAppTest) {
      // In development, return the code for testing
      return NextResponse.json({
        success: true,
        message: "Verification code sent successfully",
        phoneNumber: phoneE164,
        development: true,
        // Only in development - remove in production
        demoCode: otpResult.code,
        expiresAt: otpResult.expiresAt,
      });
    }

    try {
      // Send verification code via WhatsApp Business API
      const whatsappService = getWhatsAppService();

      // Check if we have valid credentials (not demo mode)
      const hasCredentials =
        process.env.WHATSAPP_ACCESS_TOKEN &&
        process.env.WHATSAPP_PHONE_NUMBER_ID;

      if (!hasCredentials) {
        // Demo mode - simulate sending
        console.log(
          `Demo mode: Would send verification code ${otpResult.code} to ${phoneE164}`
        );

        return NextResponse.json({
          success: true,
          message: "Verification code sent successfully (Demo Mode)",
          phoneNumber: phoneE164,
          expiresAt: otpResult.expiresAt,
          demo: true,
        });
      }

      // Try sending template message first (preferred)
      try {
        console.log("Formatting phone number:", phoneNumber);
        console.log("Phone number:", phoneE164);
        console.log("OTP code:", otpResult.code);

        await whatsappService.sendVerificationCode(phoneE164, otpResult.code!);
      } catch (templateError) {
        console.warn(
          "Template message failed, falling back to text message:",
          templateError
        );

        // Fallback to text message
        const message = `Your verification code is: ${otpResult.code}. This code will expire in 5 minutes.`;
        await whatsappService.sendTextMessage(phoneE164, message);
      }

      return NextResponse.json({
        success: true,
        message: "Verification code sent successfully via WhatsApp",
        phoneNumber: phoneE164,
        expiresAt: otpResult.expiresAt,
      });
    } catch (whatsappError) {
      console.error("WhatsApp sending failed:", whatsappError);

      // If WhatsApp fails, we could fallback to SMS or email
      // For now, return the error
      return NextResponse.json(
        {
          error:
            "Failed to send verification code via WhatsApp. Please try again later.",
          details:
            whatsappError instanceof Error
              ? whatsappError.message
              : "Unknown error",
        },
        { status: 503 } // Service Unavailable
      );
    }
  } catch (error) {
    console.error("WhatsApp API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
