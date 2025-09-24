import { signOut } from "next-auth/react";
import { useSession } from "next-auth/react";

export function useCustomLogout() {
  const { data: session } = useSession();

  const logout = async (callbackUrl?: string) => {
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

      // Immediately sign out and redirect to give a smooth UX
      await signOut({
        callbackUrl: callbackUrl || "/",
        redirect: true,
      });
    } catch (error) {
      console.error("❌ Custom logout error:", error);
      // Fallback to regular signOut
      await signOut({ 
        callbackUrl: callbackUrl || "/",
        redirect: true 
      });
    }
  };

  return { logout };
}
