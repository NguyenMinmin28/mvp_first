"use client";

import { SessionProvider } from "next-auth/react";
import { PortalProvider } from "@/features/shared/portal-context";

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider
      // Reduce refresh frequency to prevent session instability
      refetchInterval={5 * 60} // 5 minutes - less aggressive
      refetchOnWindowFocus={false} // Disable to prevent constant refreshes
      refetchWhenOffline={false}
    >
      <PortalProvider>{children}</PortalProvider>
    </SessionProvider>
  );
}
