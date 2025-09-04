"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function SessionMonitor() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    console.log("🔍 Session Monitor - Status:", status, "Session:", !!session);
    
    // Only start monitoring if session is authenticated and stable
    if (status !== "authenticated" || !session?.user) {
      console.log("⏳ Session not ready for monitoring, waiting...");
      return;
    }

    console.log("✅ Session stable, starting keep-alive monitoring");

    // Keep session alive by calling keep-alive endpoint (less frequently)
    const keepAliveInterval = setInterval(async () => {
      try {
        // Double-check session is still valid before calling keep-alive
        if (status === "authenticated" && session?.user) {
          await fetch("/api/auth/keep-alive", { method: "POST" });
          console.log("🔍 Session kept alive");
        }
      } catch (error) {
        console.error("Error keeping session alive:", error);
      }
    }, 2 * 60 * 1000); // Every 2 minutes - less aggressive than SessionProvider

    return () => {
      clearInterval(keepAliveInterval);
    };
  }, [status, session]);

  // Don't render anything, just monitor
  return null;
}
