"use client";

import { ReactNode, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useSessionRefresh } from "@/core/hooks/use-session-refresh";
import { SessionRefreshNotice } from "@/ui/components/session-refresh-notice";

// Dynamically import Header to avoid SSR issues
const Header = dynamic(
  () => import("./header").then((mod) => ({ default: mod.Header })),
  {
    ssr: false,
    loading: () => (
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="h-8 w-8 bg-muted animate-pulse rounded" />
          <div className="h-8 w-8 bg-muted animate-pulse rounded" />
        </div>
      </header>
    ),
  }
);

interface UserLayoutProps {
  children: ReactNode;
  user: any;
  showFooter?: boolean;
}

export function UserLayout({
  children,
  user,
  showFooter = true,
}: UserLayoutProps) {
  const [mounted, setMounted] = useState(false);

  // Use session refresh hook to automatically refresh user data on navigation
  const { isRefreshing } = useSessionRefresh();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div>{children}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Session Refresh Notice */}
      <SessionRefreshNotice isRefreshing={isRefreshing} />

      {/* Header */}
      <Header user={user} />

      {/* Main Content */}
      <main>{children}</main>

      {/* Footer */}
      {showFooter && (
        <footer className="py-8 px-4 border-t border-gray-200 dark:border-gray-700">
          <div className="container mx-auto text-center text-gray-600 dark:text-gray-400">
            <p>&copy; 2024 Todo App. All rights reserved.</p>
          </div>
        </footer>
      )}
    </div>
  );
}
