"use client";

import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

/**
 * Custom hook to automatically refresh session when navigating between pages
 * This ensures user data is always fresh without requiring logout/login
 */
export function useSessionRefresh() {
  const { data: session, update } = useSession();
  const [mounted, setMounted] = useState(false);
  const lastPathname = useRef<string | null>(null);
  const isRefreshingRef = useRef(false);
  const isLoggingOutRef = useRef(false);
  
  // Must call hooks at top level - cannot be conditional
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
    
    // Detect if we're on a logout-related page
    return () => {
      // Cleanup on unmount
      isLoggingOutRef.current = true;
    };
  }, []);

  // Detect logout by checking if session becomes null or pathname changes to signin
  useEffect(() => {
    if (pathname?.includes('/auth/signin') || pathname === '/') {
      isLoggingOutRef.current = true;
    }
    if (!session && mounted) {
      isLoggingOutRef.current = true;
    }
  }, [session, mounted, pathname]);

  useEffect(() => {
    if (!mounted) return;
    if (isLoggingOutRef.current) return; // Don't refresh during logout
    if (!pathname) return;
    if (lastPathname.current === pathname) return;
    if (isRefreshingRef.current) return;
    
    // Skip if pathname indicates logout
    if (pathname.includes('/auth/signin') || pathname === '/') {
      isLoggingOutRef.current = true;
      return;
    }

    // Mark refreshing and trigger update once per navigation
    isRefreshingRef.current = true;
    lastPathname.current = pathname;
    console.log("🔄 Page navigation detected, refreshing session once...");

    update()
      .catch((e) => {
        // Silently handle errors during logout
        if (e?.message?.includes('context') || e?.message?.includes('null') || isLoggingOutRef.current) {
          return; // Ignore context errors during logout
        }
        console.warn("Session refresh error:", e);
      })
      .finally(() => {
        // Small timeout to debounce rapid route changes
        setTimeout(() => {
          isRefreshingRef.current = false;
        }, 500);
      });
  }, [pathname, update, mounted]);

  return { session, update, isRefreshing: isRefreshingRef.current };
}
