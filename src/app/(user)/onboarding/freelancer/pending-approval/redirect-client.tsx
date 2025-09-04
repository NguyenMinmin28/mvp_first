"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export default function PendingApprovalRedirectClient() {
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    // Only check approval status if already authenticated
    // Let middleware handle unauthenticated state
    if (status !== "authenticated" || !session?.user) {
      console.log("⏳ Not checking approval status - letting middleware handle auth");
      return;
    }
    
    // If user is already approved, redirect immediately
    if (session.user.adminApprovalStatus === "approved") {
      console.log("✅ User already approved, redirecting to inbox");
      router.push("/inbox");
      return;
    }
    
    // For pending users, start periodic checks in background
    console.log("🔍 Starting periodic approval checks for pending user");

    let cancelled = false;
    let checkCount = 0;
    
    const interval = setInterval(async () => {
      try {
        checkCount++;
        console.log(`🔍 Pending approval check #${checkCount}`);
        
        // Only check status, don't force session update unless needed
        const res = await fetch("/api/user/me");
        const data = await res.json();
        const status = data?.user?.adminApprovalStatus;
        
        console.log("🔍 Pending approval check:", { status, data: data?.user });
        
        if (status === "approved" && !cancelled) {
          console.log("✅ Profile approved, redirecting to inbox");
          // Don't force session update, just redirect
          // Use window.location to avoid router issues
          window.location.href = "/inbox";
        } else if (status === "rejected" && !cancelled) {
          console.log("❌ Profile rejected, staying on pending page");
          // Could redirect to a rejection page or show message
        }
      } catch (error) {
        console.error("Error checking approval status:", error);
      }
    }, 15000); // Check every 15 seconds to be less aggressive

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [router, session, status]);

  return null;
}


