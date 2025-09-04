"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";

export function ForceRefreshSession() {
  const { data: session, update: updateSession } = useSession();

  useEffect(() => {
    // Force refresh session on mount
    const refreshSession = async () => {
      try {
        console.log("🔄 Force refreshing session...");
        await updateSession();
        console.log("✅ Session refreshed");
      } catch (error) {
        console.error("❌ Error refreshing session:", error);
      }
    };

    refreshSession();
  }, [updateSession]);

  // Don't render anything
  return null;
}
