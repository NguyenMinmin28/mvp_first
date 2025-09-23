import { signOut } from "next-auth/react";
import { useSession } from "next-auth/react";

export function useCustomLogout() {
  const { data: session } = useSession();

  const logout = async (callbackUrl?: string) => {
    try {
      // Call our custom logout API to update developer status
      if (session?.user?.role === "DEVELOPER") {
        console.log("🔄 Custom logout: Calling logout API for developer");
        try {
          await fetch("/api/auth/logout", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
          });
          console.log("✅ Custom logout: Developer status updated to busy");
        } catch (apiError) {
          console.error("❌ Custom logout: Failed to call logout API:", apiError);
          // Continue with logout even if API call fails
        }
      }

      // Use NextAuth's signOut to clear the session
      await signOut({ 
        callbackUrl: callbackUrl || "/",
        redirect: true 
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
