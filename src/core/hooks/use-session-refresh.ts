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
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  // Only use usePathname on the client side to avoid SSR issues
  const pathname = mounted ? usePathname() : null;
  const lastPathname = useRef<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Only refresh if we're mounted, have a pathname, and we've actually changed pages
    if (mounted && pathname && lastPathname.current !== pathname) {
      console.log("🔄 Page navigation detected, refreshing session...");

      setIsRefreshing(true);

      // Update session to get fresh data
      update().finally(() => {
        setIsRefreshing(false);
      });

      // Update the last pathname
      lastPathname.current = pathname;
    }
  }, [pathname, update, mounted]);

  return { session, update, isRefreshing };
}
