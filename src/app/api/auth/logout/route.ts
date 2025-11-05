import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/features/auth/auth";
import { DeveloperStatusService } from "@/core/services/developer-status.service";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // If user is a developer, set status to offline
    if (session.user.role === "DEVELOPER") {
      try {
        console.log("🔄 Logout: Setting developer status to offline for user:", session.user.id);
        await DeveloperStatusService.setDeveloperOffline(session.user.id);
        console.log("✅ Developer status set to offline successfully");
      } catch (statusError) {
        console.error("❌ Failed to update developer status on logout:", statusError);
        // Don't fail the logout if status update fails
      }
    }

    // Clear the session cookie
    const response = NextResponse.json({
      success: true,
      message: "Logged out successfully"
    });

    // Clear the NextAuth session cookie
    response.cookies.set({
      name: `${process.env.NODE_ENV === "production" ? "__Secure-" : ""}next-auth.session-token`,
      value: "",
      expires: new Date(0),
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax"
    });

    return response;

  } catch (error) {
    console.error("Error during logout:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
