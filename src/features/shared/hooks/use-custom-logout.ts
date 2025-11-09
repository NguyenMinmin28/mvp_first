import { signOut } from "next-auth/react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function useCustomLogout() {
  const { data: session } = useSession();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const logout = async (callbackUrl?: string) => {
    if (!mounted) return;
    
    try {
      // Fire-and-forget: update developer status in the background to keep UI snappy
      if (session?.user?.role === "DEVELOPER") {
        try {
          const payload = JSON.stringify({ action: "logout" });
          if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
            const blob = new Blob([payload], { type: "application/json" });
            navigator.sendBeacon("/api/auth/logout", blob);
          } else {
            fetch("/api/auth/logout", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: payload,
              keepalive: true,
            }).catch(() => {});
          }
        } catch {}
      }

      // Use window.location for logout to avoid React context issues
      const targetUrl = callbackUrl || "/";
      
      // Small delay before redirect to allow React to cleanup components
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Try signOut first, but fallback to direct navigation if it fails
      try {
        await signOut({
          callbackUrl: targetUrl,
          redirect: false, // Don't let NextAuth handle redirect
        });
        
        // Additional delay before redirect to ensure React cleanup completes
        await new Promise(resolve => setTimeout(resolve, 50));
        
        // Manual redirect to avoid context issues
        if (typeof window !== "undefined") {
          window.location.href = targetUrl;
        }
      } catch (signOutError) {
        console.warn("SignOut failed, using direct navigation:", signOutError);
        // Additional delay before redirect
        await new Promise(resolve => setTimeout(resolve, 50));
        // Direct navigation fallback
        if (typeof window !== "undefined") {
          window.location.href = targetUrl;
        }
      }
    } catch (error) {
      console.error("❌ Custom logout error:", error);
      // Final fallback - direct navigation
      if (typeof window !== "undefined") {
        window.location.href = callbackUrl || "/";
      }
    }
  };

  return { logout };
}
