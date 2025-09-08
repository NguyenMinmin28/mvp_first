import { NextRequest, NextResponse } from "next/server";
import { getServerSessionUser } from "@/features/auth/auth-server";
import { NotificationService } from "@/core/services/notification.service";

export async function POST(request: NextRequest) {
  try {
    const user = await getServerSessionUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { batchId } = await request.json();
    
    if (!batchId) {
      return NextResponse.json({ error: "Batch ID is required" }, { status: 400 });
    }

    // Gửi notifications cho batch
    const result = await NotificationService.sendBatchNotifications(batchId);

    return NextResponse.json({
      success: result.success,
      message: `Notifications sent: ${result.sent} successful, ${result.failed} failed`,
      details: {
        sent: result.sent,
        failed: result.failed,
        errors: result.errors
      }
    });

  } catch (error) {
    console.error("Error sending batch notifications:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
