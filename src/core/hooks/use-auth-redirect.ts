"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { usePortal } from "@/features/shared/portal-context";

/**
 * Hook to handle authentication redirects based on user role and portal
 * This ensures users are redirected to the appropriate page after login
 */
export function useAuthRedirect() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const portalContext = usePortal();

  useEffect(() => {
    console.log("🔍 Auth Redirect - Status:", status, "Session:", !!session, "User:", session?.user?.email, "Role:", session?.user?.role);
    
    // Only run when session is loaded and user is authenticated
    if (status === "loading" || !session?.user) return;

    const user = session.user;
    const userRole = user.role as string | undefined;
    const isProfileCompleted = user.isProfileCompleted as boolean | undefined;
    const portal = searchParams.get("portal") as "client" | "freelancer" | null;
    const callbackUrl = searchParams.get("callbackUrl");

    console.log("🔍 Auth Redirect - User:", user.email, "Role:", userRole, "Profile Completed:", isProfileCompleted, "Portal:", portal, "Callback URL:", callbackUrl);

    // If there's a specific callback URL, use it
    if (callbackUrl) {
      console.log("🔍 Auth Redirect - Using callback URL:", callbackUrl);
      router.replace(callbackUrl);
      return;
    }

    // If user doesn't have a role, redirect to role selection
    if (!userRole) {
      console.log("🔍 Auth Redirect - No role assigned, redirecting to role selection");
      router.replace("/role-selection");
      return;
    }

    // If user has role but profile not completed, redirect to role selection
    if (userRole && !isProfileCompleted) {
      console.log("🔍 Auth Redirect - User has role but profile not completed, redirecting to role selection");
      router.replace("/role-selection");
      return;
    }

    // Check role and redirect accordingly (only if profile is completed)
    if (userRole === "ADMIN") {
      console.log("🔍 Auth Redirect - Admin user, redirecting to admin dashboard");
      try {
        console.log("🔍 Auth Redirect - About to call router.replace('/admin')");
        router.replace("/admin");
        console.log("🔍 Auth Redirect - router.replace('/admin') called successfully");
        
        // Add a fallback in case router doesn't work
        setTimeout(() => {
          if (window.location.pathname !== "/admin") {
            console.log("🔍 Auth Redirect - Router didn't work, using window.location fallback");
            window.location.href = "/admin";
          }
        }, 2000);
      } catch (error) {
        console.error("🔍 Auth Redirect - Error during redirect:", error);
        // Fallback to window.location
        console.log("🔍 Auth Redirect - Using window.location fallback");
        window.location.href = "/admin";
      }
      return;
    }

    if (userRole === "CLIENT") {
      console.log("🔍 Auth Redirect - Client user");
      // Auto-set portal to client for CLIENT role
      try {
        portalContext.setPortalAsLoggedIn("client");
      } catch (error) {
        console.warn("🔍 Auth Redirect - Failed to set portal:", error);
      }
      
      if (portal === "client") {
        // Client logging in to client portal
        router.replace("/client-dashboard");
      } else if (portal === "freelancer") {
        // Client trying to access freelancer portal - redirect to client dashboard with notice
        console.log("🔍 Auth Redirect - Client trying to access freelancer portal, redirecting to client dashboard");
        router.replace("/client-dashboard?roleMismatch=true&targetPortal=freelancer");
      } else {
        // No portal specified, default to client
        router.replace("/client-dashboard");
      }
      return;
    }

    if (userRole === "DEVELOPER") {
      console.log("🔍 Auth Redirect - Developer user");
      // Auto-set portal to freelancer for DEVELOPER role
      try {
        portalContext.setPortalAsLoggedIn("freelancer");
      } catch (error) {
        console.warn("🔍 Auth Redirect - Failed to set portal:", error);
      }
      
      if (portal === "freelancer") {
        // Developer logging in to freelancer portal
        router.replace("/inbox");
      } else if (portal === "client") {
        // Developer trying to access client portal - redirect to freelancer dashboard with notice
        console.log("🔍 Auth Redirect - Developer trying to access client portal, redirecting to freelancer dashboard");
        router.replace("/inbox?roleMismatch=true&targetPortal=client");
      } else {
        // No portal specified, default to freelancer
        router.replace("/inbox");
      }
      return;
    }

    // Fallback - redirect to role selection
    console.log("🔍 Auth Redirect - Fallback, redirecting to role selection");
    router.replace("/role-selection");
  }, [session, status, router, searchParams, portalContext]);
}
