"use client";

import { SessionProvider } from "next-auth/react";
import { PortalProvider } from "@/features/shared/portal-context";
import { SessionKeepAlive } from "@/features/shared/components/session-keep-alive";
import { ErrorBoundary } from "@/features/shared/components/error-boundary";

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ErrorBoundary>
      <SessionProvider
        // Reduce refresh frequency to prevent session instability
        refetchInterval={5 * 60} // 5 minutes - less aggressive
        refetchOnWindowFocus={false} // Disable to prevent constant refreshes
        refetchWhenOffline={false}
      >
        <PortalProvider>
          <SessionKeepAlive />
          {children}
        </PortalProvider>
      </SessionProvider>
    </ErrorBoundary>
  );
}
