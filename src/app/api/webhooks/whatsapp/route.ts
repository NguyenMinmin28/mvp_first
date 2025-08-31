export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { WhatsAppService } from "@/core/services/whatsapp.service";

interface WhatsAppWebhookEntry {
  id: string;
  changes: {
    value: {
      messaging_product: string;
      metadata: {
        display_phone_number: string;
        phone_number_id: string;
      };
      contacts?: {
        profile: {
          name: string;
        };
        wa_id: string;
      }[];
      messages?: {
        from: string;
        id: string;
        timestamp: string;
        text?: {
          body: string;
        };
        type: string;
      }[];
      statuses?: {
        id: string;
        status: string;
        timestamp: string;
        recipient_id: string;
        conversation?: {
          id: string;
          origin: {
            type: string;
          };
        };
        pricing?: {
          billable: boolean;
          pricing_model: string;
          category: string;
        };
      }[];
    };
    field: string;
  }[];
}

interface WhatsAppWebhookPayload {
  object: string;
  entry: WhatsAppWebhookEntry[];
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  // Verify webhook subscription
  if (
    mode === "subscribe" &&
    token === process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN
  ) {
    console.log("Webhook verified successfully!");
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("x-hub-signature-256");

    // Verify webhook signature
    if (signature && process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN) {
      const isValid = WhatsAppService.verifyWebhookSignature(
        body,
        signature,
        process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN
      );

      if (!isValid) {
        console.error("Invalid webhook signature");
        return NextResponse.json(
          { error: "Invalid signature" },
          { status: 403 }
        );
      }
    }

    const payload: WhatsAppWebhookPayload = JSON.parse(body);

    // Process webhook payload
    if (payload.object === "whatsapp_business_account") {
      for (const entry of payload.entry) {
        for (const change of entry.changes) {
          if (change.field === "messages") {
            await processMessageUpdate(change.value);
          }
        }
      }
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

async function processMessageUpdate(
  value: WhatsAppWebhookEntry["changes"][0]["value"]
) {
  // Process incoming messages
  if (value.messages) {
    for (const message of value.messages) {
      console.log("Received message:", {
        from: message.from,
        id: message.id,
        type: message.type,
        text: message.text?.body,
        timestamp: message.timestamp,
      });

      // Handle different message types
      switch (message.type) {
        case "text":
          await handleTextMessage(message);
          break;
        default:
          console.log(`Unhandled message type: ${message.type}`);
      }
    }
  }

  // Process message statuses (delivery, read, etc.)
  if (value.statuses) {
    for (const status of value.statuses) {
      console.log("Message status update:", {
        messageId: status.id,
        status: status.status,
        recipientId: status.recipient_id,
        timestamp: status.timestamp,
      });

      // You can update your database with delivery status here
      await handleMessageStatus(status);
    }
  }

  // Process contacts info
  if (value.contacts) {
    for (const contact of value.contacts) {
      console.log("Contact info:", {
        waId: contact.wa_id,
        name: contact.profile.name,
      });
    }
  }
}

async function handleTextMessage(message: any) {
  // Handle incoming text messages
  // You can implement auto-replies, command processing, etc.
  console.log(
    `Processing text message from ${message.from}: ${message.text?.body}`
  );

  // Example: Auto-reply to specific keywords
  if (message.text?.body?.toLowerCase().includes("help")) {
    // You could send an auto-reply here
    console.log("Help keyword detected, could send auto-reply");
  }
}

async function handleMessageStatus(status: any) {
  // Handle message delivery status updates
  console.log(`Message ${status.id} status: ${status.status}`);

  // You can update your database with delivery status
  // For example, mark messages as delivered, read, failed, etc.

  switch (status.status) {
    case "sent":
      console.log("Message sent successfully");
      break;
    case "delivered":
      console.log("Message delivered to recipient");
      break;
    case "read":
      console.log("Message read by recipient");
      break;
    case "failed":
      console.log("Message failed to send");
      break;
    default:
      console.log(`Unknown status: ${status.status}`);
  }
}
