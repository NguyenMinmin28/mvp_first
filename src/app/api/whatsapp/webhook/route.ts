import { NextRequest, NextResponse } from "next/server";
import { getWhatsAppService, WhatsAppService } from "@/core/services/whatsapp.service";
import { RotationService } from "@/core/services/rotation.service";
import { prisma } from "@/core/database/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Verify webhook signature (optional but recommended)
    const signature = request.headers.get("x-hub-signature-256");
    if (signature && process.env.WHATSAPP_WEBHOOK_SECRET) {
      const isValid = WhatsAppService.verifyWebhookSignature(
        JSON.stringify(body),
        signature,
        process.env.WHATSAPP_WEBHOOK_SECRET
      );
      
      if (!isValid) {
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
    }

    // Process webhook events
    if (body.object === "whatsapp_business_account") {
      for (const entry of body.entry || []) {
        for (const change of entry.changes || []) {
          if (change.field === "messages") {
            for (const message of change.value.messages || []) {
              await handleIncomingMessage(message);
            }
          }
        }
      }
    }

    return NextResponse.json({ status: "ok" });
  } catch (error) {
    console.error("WhatsApp webhook error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

async function handleIncomingMessage(message: any) {
  try {
    const phoneNumber = message.from;
    
    // Xử lý interactive button response
    if (message.type === "interactive" && message.interactive?.type === "button_reply") {
      const payload = message.interactive.button_reply.payload;
      
      if (payload.startsWith("ACCEPT_")) {
        const candidateId = payload.replace("ACCEPT_", "");
        await handleAcceptResponse(candidateId, phoneNumber);
      } else if (payload.startsWith("REJECT_")) {
        const candidateId = payload.replace("REJECT_", "");
        await handleRejectResponse(candidateId, phoneNumber);
      } else {
        await sendErrorMessage(phoneNumber, "Invalid response. Please use the buttons provided.");
      }
      return;
    }
    
    // Xử lý text message (fallback)
    const messageText = message.text?.body?.toUpperCase().trim();
    
    if (!messageText) {
      return;
    }

    // Tìm developer theo phone number
    const developer = await prisma.developerProfile.findFirst({
      where: {
        user: {
          phoneE164: phoneNumber
        },
        whatsappVerified: true
      },
      include: {
        user: true,
        assignmentCandidates: {
          where: {
            responseStatus: "pending",
            acceptanceDeadline: {
              gt: new Date() // Chỉ xử lý candidates chưa hết hạn
            }
          },
          include: {
            batch: {
              include: {
                project: true
              }
            }
          },
          orderBy: {
            assignedAt: "desc"
          },
          take: 1 // Lấy candidate mới nhất
        }
      }
    });

    if (!developer || developer.assignmentCandidates.length === 0) {
      await sendHelpMessage(phoneNumber);
      return;
    }

    const candidate = developer.assignmentCandidates[0];
    
    // Xử lý response
    if (messageText.includes("ACCEPT") || messageText.includes("YES") || messageText === "✅") {
      await handleAcceptResponse(candidate.id, phoneNumber);
    } else if (messageText.includes("REJECT") || messageText.includes("NO") || messageText === "❌") {
      await handleRejectResponse(candidate.id, phoneNumber);
    } else {
      await sendHelpMessage(phoneNumber);
    }
  } catch (error) {
    console.error("Error handling incoming message:", error);
  }
}

async function handleAcceptResponse(candidateId: string, phoneNumber: string) {
  try {
    // Tìm userId từ phoneNumber
    const developer = await prisma.developerProfile.findFirst({
      where: {
        user: {
          phoneE164: phoneNumber
        },
        whatsappVerified: true
      },
      include: {
        user: true
      }
    });

    if (!developer) {
      await sendErrorMessage(phoneNumber, "Developer not found or not verified.");
      return;
    }

    const result = await RotationService.acceptCandidate(candidateId, developer.user.id);
    
    if (result.success) {
      await sendConfirmationMessage(phoneNumber, "accepted", result.project);
    } else {
      await sendErrorMessage(phoneNumber, result.message);
    }
  } catch (error) {
    console.error("Error accepting candidate:", error);
    await sendErrorMessage(phoneNumber, "Failed to accept project. Please try again.");
  }
}

async function handleRejectResponse(candidateId: string, phoneNumber: string) {
  try {
    // Tìm userId từ phoneNumber
    const developer = await prisma.developerProfile.findFirst({
      where: {
        user: {
          phoneE164: phoneNumber
        },
        whatsappVerified: true
      },
      include: {
        user: true
      }
    });

    if (!developer) {
      await sendErrorMessage(phoneNumber, "Developer not found or not verified.");
      return;
    }

    const result = await RotationService.rejectCandidate(candidateId, developer.user.id);
    
    if (result.success) {
      await sendConfirmationMessage(phoneNumber, "rejected", null);
    } else {
      await sendErrorMessage(phoneNumber, result.message);
    }
  } catch (error) {
    console.error("Error rejecting candidate:", error);
    await sendErrorMessage(phoneNumber, "Failed to reject project. Please try again.");
  }
}

async function sendConfirmationMessage(phoneNumber: string, action: "accepted" | "rejected", project: any) {
  const whatsappService = getWhatsAppService();
  
  if (action === "accepted") {
    if (process.env.WHATSAPP_DISABLE_SENDING !== "true") {
      const templateName = process.env.WHATSAPP_TEMPLATE_ACCEPT_CONFIRMATION || "accept_confirmation";
      await whatsappService.sendTemplateMessage(
        phoneNumber,
        templateName,
        [project?.title || "the project"] // {{project_title}}
      );
    }
  } else {
    if (process.env.WHATSAPP_DISABLE_SENDING !== "true") {
      const templateName = process.env.WHATSAPP_TEMPLATE_REJECT_CONFIRMATION || "reject_confirmation";
      await whatsappService.sendTemplateMessage(
        phoneNumber,
        templateName,
        [] // No parameters needed for reject template
      );
    }
  }
}

async function sendErrorMessage(phoneNumber: string, errorMessage: string) {
  const whatsappService = getWhatsAppService();
  
  const message = `❌ *Error*

${errorMessage}

Please try again or contact support if the problem persists.

*Available commands:*
✅ ACCEPT - Accept the project
❌ REJECT - Decline the project

---
*Developer Connect Support*`;
  
  await whatsappService.sendTextMessage(phoneNumber, message);
}

async function sendHelpMessage(phoneNumber: string) {
  const whatsappService = getWhatsAppService();
  
  const message = `🤖 *Developer Connect Bot*

I didn't understand your message. Here are the available commands:

*For project assignments:*
✅ *ACCEPT* - Accept the current project
❌ *REJECT* - Decline the current project

*Other commands:*
📋 *STATUS* - Check your current assignments
❓ *HELP* - Show this help message

*Note:* You can only respond to active project assignments within the deadline.

---
*Developer Connect Team*`;
  
  if (process.env.WHATSAPP_DISABLE_SENDING !== "true") {
    await whatsappService.sendTextMessage(phoneNumber, message);
  }
}

// Handle GET request for webhook verification
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN) {
    return new NextResponse(challenge);
  }

  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}
