/**
 * Script to test WhatsApp Business API connection
 * Run: pnpm tsx scripts/test-whatsapp.ts
 */

import {
  getWhatsAppService,
  WhatsAppService,
} from "../src/core/services/whatsapp.service";

async function testWhatsAppConnection() {
  console.log("🧪 Testing WhatsApp Business API Connection...\n");

  // Check environment variables
  console.log("📋 Environment Variables:");
  console.log(`  NODE_ENV: ${process.env.NODE_ENV}`);
  console.log(
    `  WHATSAPP_ACCESS_TOKEN: ${process.env.WHATSAPP_ACCESS_TOKEN ? "✅ Set" : "❌ Missing"}`
  );
  console.log(
    `  WHATSAPP_PHONE_NUMBER_ID: ${process.env.WHATSAPP_PHONE_NUMBER_ID ? "✅ Set" : "❌ Missing"}`
  );
  console.log(
    `  WHATSAPP_BUSINESS_ACCOUNT_ID: ${process.env.WHATSAPP_BUSINESS_ACCOUNT_ID ? "✅ Set" : "❌ Missing"}`
  );
  console.log(
    `  WHATSAPP_WEBHOOK_VERIFY_TOKEN: ${process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN ? "✅ Set" : "❌ Missing"}`
  );
  console.log(`  FORCE_WHATSAPP_TEST: ${process.env.FORCE_WHATSAPP_TEST}\n`);

  try {
    const whatsappService = getWhatsAppService();
    console.log("✅ WhatsApp service initialized successfully");

    // Test phone number validation
    const testPhones = [
      "+84865848439", // Số từ curl command
    ];

    console.log("\n📞 Testing phone number validation:");
    testPhones.forEach((phone) => {
      const isValid = WhatsAppService.validatePhoneNumber(phone);
      const formatted = WhatsAppService.formatPhoneNumber(phone);
      const forWhatsApp = WhatsAppService.formatPhoneForWhatsApp(phone);
      console.log(
        `  ${phone} → Valid: ${isValid ? "✅" : "❌"}, E.164: ${formatted}, For API: ${forWhatsApp}`
      );
    });

    // If we have real credentials, test a simple API call
    const hasCredentials =
      process.env.WHATSAPP_ACCESS_TOKEN &&
      process.env.WHATSAPP_PHONE_NUMBER_ID &&
      process.env.WHATSAPP_ACCESS_TOKEN !== "demo-token";

    if (hasCredentials) {
      console.log("\n🚀 Testing actual WhatsApp API call...");
      console.log("⚠️  Note: This will attempt to send a real message!");
      console.log("💡 Make sure to use a test phone number you control.");

      // Test với credentials thật từ curl command
      const testPhoneNumber = "+84865848439"; // Số từ curl command

      console.log(
        `\n🚀 Testing real WhatsApp message to ${testPhoneNumber}...`
      );

      try {
        // Test với template message hello_world
        const result = await whatsappService.sendVerificationCode(
          testPhoneNumber,
          "123456"
        );
        console.log("✅ Template message sent successfully!", result);
      } catch (templateError) {
        console.log(
          "⚠️  Template failed, trying text message...",
          templateError
        );

        try {
          // Fallback to text message
          const textResult = await whatsappService.sendTextMessage(
            testPhoneNumber,
            "Test message from WhatsApp API integration"
          );
          console.log("✅ Text message sent successfully!", textResult);
        } catch (textError) {
          console.error(
            "❌ Both template and text messages failed:",
            textError
          );
        }
      }

      console.log(
        "🔧 To test with different phone number, update testPhoneNumber in this script."
      );
    } else {
      console.log("\n🎭 Running in demo mode - no real API calls will be made");
      console.log(
        "💡 To test real WhatsApp API, set these environment variables:"
      );
      console.log(
        "   WHATSAPP_ACCESS_TOKEN=EAASrSQqusmsBPSXD0WPnfdjt7p2bC9g6QiyGANqWraY3AlPJaGlphZA5NNfuLC7O4rEI5ATD6CO7kSDyqo9saysUAHGKGgUy7dOuZAqZCbqOggKi0p1Js1iJORDA8bLcyfAZAITSUGxEKqkNGRW5MVZCfZBEq52lBc9VunRrvJ2Fc0qaqsf0pv515iKZAxgejZA19AxJMKzs0G4Bz4vL121hj6hQ0uaMaIVCNrdY4dAYDV9ZCDtkZD"
      );
      console.log("   WHATSAPP_PHONE_NUMBER_ID=733229343213829");
      console.log("   FORCE_WHATSAPP_TEST=true");
    }
  } catch (error) {
    console.error("❌ Error testing WhatsApp service:", error);
  }
}

// Run the test
testWhatsAppConnection()
  .then(() => {
    console.log("\n✨ Test completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Test failed:", error);
    process.exit(1);
  });
