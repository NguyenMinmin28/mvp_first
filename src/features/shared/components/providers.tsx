"use client";

import { SessionProvider } from "next-auth/react";
import { PortalProvider } from "@/features/shared/portal-context";

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider
      // Refresh session more frequently to get fresh user data
      refetchInterval={1 * 60} // 1 minute - more frequent updates
      refetchOnWindowFocus={true} // Refresh when user focuses on window
      refetchWhenOffline={false}
    >
      <PortalProvider>{children}</PortalProvider>
    </SessionProvider>
  );
}
