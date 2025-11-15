"use client";

import { useSession } from "next-auth/react";
import { useCallback, useEffect, useRef } from "react";

const KEEP_ALIVE_INTERVAL_MS = 4 * 60 * 1000; // 4 minutes
const DEBUG_SESSION = process.env.NEXT_PUBLIC_DEBUG_SESSION === "true";

/**
 * Keeps the NextAuth session warm to prevent unexpected logouts.
 * Pings the keep-alive endpoint on an interval and when the tab regains focus.
 */
export function SessionKeepAlive() {
  const { data: session, status, update } = useSession();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const abortRef = useRef(false);

  const clearHeartbeat = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const pingKeepAlive = useCallback(
    async (reason: string) => {
      if (status !== "authenticated" || !session?.user?.id || abortRef.current) {
        return;
      }

      try {
        const response = await fetch("/api/auth/keep-alive", {
          method: "POST",
          cache: "no-store",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        });

        if (!response.ok) {
          if (DEBUG_SESSION) {
            console.warn(
              `[session] Keep-alive failed (${reason})`,
              response.status
            );
          }

          // If server says session is invalid, request a refresh immediately
          if (response.status === 401) {
            try {
              await update?.();
            } catch (err) {
              if (DEBUG_SESSION) {
                console.error("[session] Refresh after keep-alive failed", err);
              }
            }
          }
        } else if (DEBUG_SESSION) {
          console.info(`[session] Keep-alive ok (${reason})`);
        }
      } catch (error) {
        if (DEBUG_SESSION) {
          console.error(`[session] Keep-alive error (${reason})`, error);
        }
      }
    },
    [session?.user?.id, status, update]
  );

  useEffect(() => {
    if (typeof window === "undefined" || typeof document === "undefined") {
      return;
    }

    const isAuthenticated = status === "authenticated" && !!session?.user?.id;

    if (!isAuthenticated) {
      abortRef.current = true;
      clearHeartbeat();
      return;
    }

    abortRef.current = false;
    pingKeepAlive("mount");

    clearHeartbeat();
    intervalRef.current = setInterval(() => {
      pingKeepAlive("interval");
    }, KEEP_ALIVE_INTERVAL_MS);

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        pingKeepAlive("visibilitychange");
      }
    };

    const handleFocus = () => {
      pingKeepAlive("focus");
    };

    window.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("focus", handleFocus);

    return () => {
      abortRef.current = true;
      clearHeartbeat();
      window.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("focus", handleFocus);
    };
  }, [pingKeepAlive, session?.user?.id, status]);

  return null;
}
