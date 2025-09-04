"use client";

import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

/**
 * Custom hook to automatically refresh session when navigating between pages
 * This ensures user data is always fresh without requiring logout/login
 */
export function useSessionRefresh() {
  const { data: session, update } = useSession();
  const pathname = usePathname();
  const lastPathname = useRef<string | null>(null);
  const isRefreshingRef = useRef(false);

  useEffect(() => {
    if (!pathname) return;
    if (lastPathname.current === pathname) return;
    if (isRefreshingRef.current) return;

    // Mark refreshing and trigger update once per navigation
    isRefreshingRef.current = true;
    lastPathname.current = pathname;
    console.log("🔄 Page navigation detected, refreshing session once...");

    update()
      .catch((e) => console.warn("Session refresh error:", e))
      .finally(() => {
        // Small timeout to debounce rapid route changes
        setTimeout(() => {
          isRefreshingRef.current = false;
        }, 500);
      });
  }, [pathname, update]);

  return { session, update, isRefreshing: isRefreshingRef.current };
}
