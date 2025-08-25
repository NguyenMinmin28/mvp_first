import { NextRequest, NextResponse } from "next/server";
import { ExpiryService } from "@/core/services/expiry.service";

export async function POST(request: NextRequest) {
  try {
    // Optional: Add authentication for cron jobs
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("🔄 Cron job triggered: expire-candidates");

    const result = await ExpiryService.expirePendingCandidates();

    console.log("✅ Cron job completed:", result);

    return NextResponse.json({
      success: true,
      data: result,
    });

  } catch (error) {
    console.error("❌ Error in cron job:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Also support GET for manual testing
export async function GET(request: NextRequest) {
  return POST(request);
}
