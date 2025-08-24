"use client";

import { SessionProvider } from "next-auth/react";

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
      {children}
    </SessionProvider>
  );
}
