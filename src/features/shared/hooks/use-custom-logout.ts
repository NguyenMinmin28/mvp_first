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
    
    const targetUrl = callbackUrl || "/";
    
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

      // SignOut first and wait briefly to ensure session is cleared
      try {
        await signOut({
          callbackUrl: targetUrl,
          redirect: false,
        });
      } catch (error) {
        console.warn("SignOut error (continuing anyway):", error);
      }

      // Small delay to ensure NextAuth cleanup completes
      await new Promise(resolve => setTimeout(resolve, 100));

      // Use router.push for Next.js compatibility, fallback to window.location
      if (typeof window !== "undefined") {
        try {
          router.push(targetUrl);
          // Fallback to window.location if router.push doesn't work
          setTimeout(() => {
            if (window.location.pathname !== targetUrl) {
              window.location.href = targetUrl;
            }
          }, 200);
        } catch (error) {
          console.warn("Router push failed, using window.location:", error);
          window.location.href = targetUrl;
        }
      }
    } catch (error) {
      console.error("Logout error:", error);
      // Final fallback - direct navigation
      if (typeof window !== "undefined") {
        window.location.href = targetUrl;
      }
    }
  };

  return { logout };
}
