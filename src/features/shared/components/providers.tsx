"use client";

import { SessionProvider } from "next-auth/react";

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider
      // Reduce session polling for better performance
      refetchInterval={5 * 60} // 5 minutes
      refetchOnWindowFocus={false}
    >
      {children}
    </SessionProvider>
  );
}
