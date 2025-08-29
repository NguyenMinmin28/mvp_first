"use client";

import { ReactNode, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Toaster } from "sonner";

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

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <main className="flex-1">{children}</main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <Header user={user} />

      {/* Main Content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      {showFooter && (
        <footer className="bg-black text-white">
          <div className="container mx-auto px-4 sm:px-6 py-12">
            <div className="mb-10">
              <div className="text-2xl font-extrabold">LOGO</div>
              <a href="/help" className="mt-2 inline-block underline text-sm text-gray-300">Visit Help Center</a>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-8 text-gray-300">
              <div>
                <h4 className="font-semibold text-white mb-3">Company</h4>
                <ul className="space-y-2 text-sm">
                  <li><a href="#" className="hover:underline">About us</a></li>
                  <li><a href="#" className="hover:underline">Our offerings</a></li>
                  <li><a href="#" className="hover:underline">Newsroom</a></li>
                  <li><a href="#" className="hover:underline">Investors</a></li>
                  <li><a href="#" className="hover:underline">Careers</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-3">Products</h4>
                <ul className="space-y-2 text-sm">
                  <li><a href="#" className="hover:underline">Client</a></li>
                  <li><a href="#" className="hover:underline">Freelancer</a></li>
                  <li><a href="#" className="hover:underline">Pricing</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-3">Global citizenship</h4>
                <ul className="space-y-2 text-sm">
                  <li><a href="#" className="hover:underline">Safety</a></li>
                  <li><a href="#" className="hover:underline">Sustainability</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-3">Travel</h4>
                <ul className="space-y-2 text-sm">
                  <li><a href="#" className="hover:underline">Reserve</a></li>
                  <li><a href="#" className="hover:underline">Airports</a></li>
                  <li><a href="#" className="hover:underline">Cities</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-3">Apps</h4>
                <div className="space-y-2 text-sm">
                  <a href="#" className="inline-block rounded border border-gray-700 px-3 py-2">Get it on Google Play</a>
                  <a href="#" className="inline-block rounded border border-gray-700 px-3 py-2">Download on the App Store</a>
                </div>
              </div>
            </div>

            <div className="mt-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-gray-400 text-sm">
              <div className="flex items-center gap-6 text-white text-xl">
                <a href="#" aria-label="Facebook"></a>
                <a href="#" aria-label="X">✕</a>
                <a href="#" aria-label="YouTube">▶</a>
                <a href="#" aria-label="LinkedIn">in</a>
                <a href="#" aria-label="Instagram">◎</a>
              </div>
              <div className="flex items-center gap-6">
                <a href="#" className="hover:underline">Privacy</a>
                <a href="#" className="hover:underline">Accessibility</a>
                <a href="#" className="hover:underline">Terms</a>
              </div>
              <p className="md:ml-auto">© 2025 Clevrs</p>
            </div>
          </div>
        </footer>
      )}

      {/* Toast Notifications */}
      <Toaster position="top-right" />
    </div>
  );
}
