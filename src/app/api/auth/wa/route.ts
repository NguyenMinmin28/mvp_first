export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import {
  getWhatsAppService,
  WhatsAppService,
} from "@/core/services/whatsapp.service";
import { OtpService } from "@/core/services/otp.service";

export async function POST(request: NextRequest) {
  console.log("🚀 API: WhatsApp OTP endpoint called");
  console.log("📡 Request method:", request.method);
  console.log("📡 Request URL:", request.url);
  console.log("📡 Request headers:", Object.fromEntries(request.headers.entries()));
  
  try {
    let phoneNumber: string;

    // Handle both JSON and form data
    const contentType = request.headers.get("content-type");
    console.log("📦 Content type:", contentType);

    if (contentType?.includes("application/json")) {
      const jsonData = await request.json();
      phoneNumber = jsonData.phoneNumber;
      console.log("📦 JSON data received:", jsonData);
    } else if (contentType?.includes("application/x-www-form-urlencoded")) {
      const formData = await request.formData();
      phoneNumber = formData.get("phoneNumber") as string;
      console.log("📦 Form data received:", { phoneNumber });
    } else {
      console.log("❌ Unsupported content type:", contentType);
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

    // Bypass/Development modes
    const isDevelopment = process.env.NODE_ENV === "development";
    const forceWhatsAppTest = process.env.FORCE_WHATSAPP_TEST === "true";
    const whatsappBypass = process.env.WHATSAPP_BYPASS === "true";

    if (whatsappBypass) {
      // Explicit bypass: always return the code so client can auto-fill and verify
      return NextResponse.json({
        success: true,
        message: "Verification code prepared (Bypass Mode)",
        phoneNumber: phoneE164,
        bypass: true,
        demoCode: otpResult.code,
        expiresAt: otpResult.expiresAt,
      });
    }

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
      console.log("🚀 Starting WhatsApp sending process...");
      
      // Send verification code via WhatsApp Business API
      const whatsappService = getWhatsAppService();
      console.log("✅ WhatsApp service initialized");

      // Check if we have valid credentials (not demo mode)
      const hasCredentials =
        process.env.WHATSAPP_ACCESS_TOKEN &&
        process.env.WHATSAPP_PHONE_NUMBER_ID;

      console.log("🔍 WhatsApp credentials check:", {
        hasAccessToken: !!process.env.WHATSAPP_ACCESS_TOKEN,
        hasPhoneNumberId: !!process.env.WHATSAPP_PHONE_NUMBER_ID,
        hasCredentials,
        disableSending: process.env.WHATSAPP_DISABLE_SENDING,
      });

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
        console.log("🚀 Attempting to send WhatsApp verification code...");
        console.log("📱 Phone number:", phoneE164);
        console.log("🔐 OTP code:", otpResult.code);

        const result = await whatsappService.sendVerificationCode(phoneE164, otpResult.code!);
        console.log("✅ WhatsApp template message sent successfully:", result);
      } catch (templateError) {
        console.error("❌ Template message failed:", templateError);
        console.warn(
          "Template message failed, falling back to text message:",
          templateError
        );

        try {
          // Fallback to text message
          const message = `Your verification code is: ${otpResult.code}. This code will expire in 5 minutes.`;
          console.log("📱 Sending fallback text message:", message);
          const textResult = await whatsappService.sendTextMessage(phoneE164, message);
          console.log("✅ WhatsApp text message sent successfully:", textResult);
        } catch (textError) {
          console.error("❌ Text message also failed:", textError);
          throw textError;
        }
      }

      return NextResponse.json({
        success: true,
        message: "Verification code sent successfully via WhatsApp",
        phoneNumber: phoneE164,
        expiresAt: otpResult.expiresAt,
      });
    } catch (whatsappError) {
      console.error("❌ WhatsApp sending failed:", whatsappError);
      console.error("❌ Error details:", {
        message: whatsappError instanceof Error ? whatsappError.message : "Unknown error",
        stack: whatsappError instanceof Error ? whatsappError.stack : undefined,
        name: whatsappError instanceof Error ? whatsappError.name : undefined,
      });

      // Return failure but include the generated code so client can auto-fill
      return NextResponse.json(
        {
          success: false,
          error:
            "Failed to send verification code via WhatsApp. Please try again later.",
          details:
            whatsappError instanceof Error
              ? whatsappError.message
              : "Unknown error",
          // Provide the generated OTP for client-side autofill
          demoCode: otpResult.code,
          expiresAt: otpResult.expiresAt,
        },
        { status: 503 }
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
