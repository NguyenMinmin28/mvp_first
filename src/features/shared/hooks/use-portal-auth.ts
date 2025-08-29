import { useState } from "react";
import { usePortal } from "@/features/shared/portal-context";

export function usePortalAuth() {
  const { getPortalToken, setPortalToken, clearPortalToken, isLoggedInToPortal, activePortal } = usePortal();
  const [isLoading, setIsLoading] = useState(false);

  const loginToPortal = async (portal: "client" | "freelancer", credentials: { email: string; password: string }) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/signin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...credentials,
          portal, // Add portal info to identify which type of login
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.token) {
          setPortalToken(portal, data.token);
          return { success: true };
        }
      }
      
      return { success: false, error: "Login failed" };
    } catch (error) {
      return { success: false, error: "Network error" };
    } finally {
      setIsLoading(false);
    }
  };

  const logoutFromPortal = (portal: "client" | "freelancer") => {
    clearPortalToken(portal);
  };

  const getCurrentPortalToken = () => {
    return getPortalToken(activePortal);
  };

  const isCurrentPortalLoggedIn = () => {
    return isLoggedInToPortal(activePortal);
  };

  return {
    loginToPortal,
    logoutFromPortal,
    getCurrentPortalToken,
    isCurrentPortalLoggedIn,
    isLoading,
    activePortal,
  };
}
