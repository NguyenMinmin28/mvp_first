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
  const pathname = usePathname();
  const lastPathname = useRef(pathname);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    // Only refresh if we've actually changed pages
    if (lastPathname.current !== pathname) {
      console.log("🔄 Page navigation detected, refreshing session...");

      setIsRefreshing(true);

      // Update session to get fresh data
      update().finally(() => {
        setIsRefreshing(false);
      });

      // Update the last pathname
      lastPathname.current = pathname;
    }
  }, [pathname, update]);

  return { session, update, isRefreshing };
}
