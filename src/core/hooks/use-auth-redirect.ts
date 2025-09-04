"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { usePortal } from "@/features/shared/portal-context";

/**
 * Hook to handle authentication redirects after successful login/signup
 * This is primarily used in callback pages after authentication
 * NOTE: Middleware handles most redirects, this is for specific post-auth flows
 */
export function useAuthRedirect() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const portalContext = usePortal();
  const [hasRedirected, setHasRedirected] = useState(false);

  useEffect(() => {
    console.log("🔍 Auth Redirect Hook - Status:", status, "Session:", !!session, "User:", session?.user?.email, "Role:", session?.user?.role, "HasRedirected:", hasRedirected);
    
    // Only run when session is loaded and user is authenticated
    if (status === "loading" || !session?.user || hasRedirected) return;

    // Only run on specific callback/signup pages, not on regular pages
    const currentPath = window.location.pathname;
    const isCallbackPage = currentPath.includes("/auth/") || currentPath.includes("/signup/callback");
    
    if (!isCallbackPage) {
      console.log("🔍 Auth Redirect Hook - Not on callback page, middleware will handle redirects");
      return;
    }

    console.log("🔍 Auth Redirect Hook - On callback page, processing redirect");

    const user = session.user;
    const userRole = user.role as string | undefined;
    const isProfileCompleted = user.isProfileCompleted as boolean | undefined;
    const portal = searchParams.get("portal") as "client" | "freelancer" | null;
    const callbackUrl = searchParams.get("callbackUrl");

    console.log("🔍 Auth Redirect Hook - User:", user.email, "Role:", userRole, "Profile Completed:", isProfileCompleted, "Portal:", portal, "Callback URL:", callbackUrl);

    // If there's a specific callback URL, use it
    if (callbackUrl) {
      console.log("🔍 Auth Redirect Hook - Using callback URL:", callbackUrl);
      setHasRedirected(true);
      router.replace(callbackUrl);
      return;
    }

    // For callback pages, simply redirect to home page and let middleware handle the role-based routing
    console.log("🔍 Auth Redirect Hook - Redirecting to home page, middleware will handle role-based routing");
    setHasRedirected(true);
    router.replace("/");
  }, [session, status, router, searchParams, portalContext, hasRedirected]);
}
