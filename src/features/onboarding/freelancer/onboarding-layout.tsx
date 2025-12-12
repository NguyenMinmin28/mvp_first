"use client";

import { ReactNode, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import dynamic from "next/dynamic";
import { ErrorBoundary } from "@/features/shared/components/error-boundary";

// Dynamically import Header with SSR disabled to avoid useContext errors
const Header = dynamic(() => import("@/features/shared/components/header"), { 
  ssr: false,
  loading: () => <div className="h-16" /> // Placeholder to prevent layout shift
});

// Use require to avoid TS path extension issues
const ClientUserEnhancements = dynamic(
  async () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require("@/features/shared/components/user-layout.client");
    return mod.default || mod.ClientUserEnhancements;
  },
  { ssr: false }
);

interface OnboardingLayoutProps {
  children: ReactNode;
  user?: any; // accepted for compatibility with server pages that pass user
}

export function OnboardingLayout({ children, user: serverUser }: OnboardingLayoutProps) {
  const [mounted, setMounted] = useState(false);
  const { data: session, status } = useSession();
  
  useEffect(() => {
    setMounted(true);
  }, []);

  // Prioritize server user prop, fallback to session user
  // Use server user immediately if available, otherwise wait for session to load
  const user = serverUser || (status === "loading" ? undefined : (session?.user || undefined));
  
  // Debug log to check session state
  useEffect(() => {
    if (mounted) {
      console.log("🔍 OnboardingLayout - Server user prop:", serverUser);
      console.log("🔍 OnboardingLayout - Session status:", status);
      console.log("🔍 OnboardingLayout - Session user:", session?.user);
      console.log("🔍 OnboardingLayout - Final user:", user);
    }
  }, [mounted, status, session?.user, serverUser, user]);
  
  // Calculate header height: 64px (h-16) + 32px (welcome bar if authenticated) = 96px when authenticated, 64px otherwise
  const headerHeight = user ? '96px' : '64px';

  return (
    <ErrorBoundary>
      <div className="min-h-screen flex flex-col bg-white w-full m-0 p-0 overflow-x-hidden">
        {/* Header - Same as other user pages */}
        {mounted ? (
          <Header key={user?.id || 'no-user'} user={user} />
        ) : (
          <div className="h-16 bg-black" /> // Placeholder to prevent layout shift
        )}
        
        {/* Main Content */}
        <main className="flex-1 flex flex-col main-content dashboard-main bg-gradient-to-br from-blue-50 via-white to-indigo-50" style={{ paddingTop: mounted ? headerHeight : '64px' }}>
          <div className="container mx-auto px-4 py-8 w-full">{children}</div>
        </main>
        {/* Footer - Same as other user pages */}
        <footer className="bg-black text-white">
          <div className="container mx-auto px-4 sm:px-6 py-12">
            <div className="mb-10">
              <img
                src="/images/home/clervelogo.png"
                alt="Clevrs"
                className="h-8 w-auto mb-2"
              />
              <a
                href="/help"
                className="mt-2 inline-block underline text-sm text-gray-300"
              >
                Visit Help Center
              </a>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-gray-300 max-w-6xl">
              <div>
                <h4 className="font-semibold text-white mb-3">Company</h4>
                <ul className="space-y-2 text-sm">
                  <li>
                    <a href="/about" className="hover:underline">
                      About us
                    </a>
                  </li>
                  <li>
                    <a href="/ceo-letter" className="hover:underline">
                      Our offerings
                    </a>
                  </li>
                  <li>
                    <a href="/blog" className="hover:underline">
                      Newsroom
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:underline">
                      Investors
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:underline">
                      Careers
                    </a>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-3">Products</h4>
                <ul className="space-y-2 text-sm">
                  <li>
                    <a href="/client-dashboard" className="hover:underline">
                      Client
                    </a>
                  </li>
                  <li>
                    <a href="/dashboard-user" className="hover:underline">
                      Freelancer
                    </a>
                  </li>
                  <li>
                    <a href="/pricing" className="hover:underline">
                      Pricing
                    </a>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-3">Resources</h4>
                <ul className="space-y-2 text-sm">
                  <li>
                    <a href="#" className="hover:underline">
                      Privacy
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:underline">
                      Accessibility
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:underline">
                      Terms
                    </a>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-3">Social Links</h4>
                <div className="flex items-center gap-4 text-gray-300">
                  <a
                    href="#"
                    aria-label="Facebook"
                    className="hover:opacity-80 transition-opacity"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                  </a>
                  <a
                    href="#"
                    aria-label="X"
                    className="hover:opacity-80 transition-opacity"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                  </a>
                  <a
                    href="#"
                    aria-label="YouTube"
                    className="hover:opacity-80 transition-opacity"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                    </svg>
                  </a>
                  <a
                    href="#"
                    aria-label="LinkedIn"
                    className="hover:opacity-80 transition-opacity"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>

            {/* Bottom Section - Apps, Copyright, and Legal Links */}
            <div className="mt-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              {/* Left Side - Apps and Copyright */}
              <div className="flex flex-col gap-4">
                {/* Copyright - Bottom Left */}
                <p className="text-gray-400 text-sm text-nowrap">
                  © 2025 Clevrs
                </p>
              </div>

              {/* Partner logos strip */}
              <div className="mt-10 flex flex-wrap items-center justify-center gap-x-10 gap-y-6 opacity-90">
                <img
                  src="/images/partner/paypal.png"
                  alt="PayPal"
                  className="h-6 w-auto"
                />
                <img
                  src="/images/partner/escrow.png"
                  alt="Escrow.com"
                  className="h-6 w-auto"
                />
                <img
                  src="/images/partner/wise.png"
                  alt="Wise"
                  className="h-4 w-auto"
                />
                <img
                  src="/images/partner/razorpay.png"
                  alt="Razorpay"
                  className="h-5 w-auto"
                />

                <img
                  src="/images/partner/mix.png"
                  alt="Razorpay-Mix"
                  className="h-8 w-auto"
                />
              </div>
            </div>
          </div>
        </footer>

        {/* Client-only helpers: Toaster, prefetch, chunk guard */}
        <ClientUserEnhancements />
      </div>
    </ErrorBoundary>
  );
}


