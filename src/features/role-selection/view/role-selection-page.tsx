"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import RoleSelection from "../components/role-selection";
import { toast } from "sonner";
import Link from "next/link";
import Header from "@/features/shared/components/header";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/ui/components/dialog";
import { Button } from "@/ui/components/button";

type Step = "role-selection" | "client-form" | "developer-form";
type UserRole = "CLIENT" | "DEVELOPER";

interface User {
  id: string;
  name?: string;
  email?: string;
  role: UserRole;
  isProfileCompleted: boolean;
}

export default function CompleteProfilePage() {
  const { data: session, update: updateSession } = useSession();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<Step>("role-selection");
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showRoleRequiredDialog, setShowRoleRequiredDialog] = useState(false);
  const [isRedirectingAfterRoleSelect, setIsRedirectingAfterRoleSelect] = useState(false);

  // Redirect nếu profile đã hoàn thành
  useEffect(() => {
    console.log("🔍 Complete Profile - Current session:", session?.user);

    // Only proceed if we have session data
    if (!session?.user) {
      return;
    }

    // Skip redirect if we're in the process of redirecting after role selection
    if (isRedirectingAfterRoleSelect) {
      console.log("🔍 Currently redirecting after role select, skipping useEffect redirect");
      return;
    }

    if (session.user.role && session.user.isProfileCompleted) {
      // Check if user has saved form data from guest session
      const savedFormData = sessionStorage.getItem('guestProjectForm');
      
      // Redirect based on role instead of home
      if (session.user.role === "CLIENT") {
        // Check if this is a new role selection (just completed)
        // If user is still on role-selection page after completing, they just selected role
        // In this case, always redirect to pricing first (even if they have auto-created subscription)
        const isOnRoleSelectionPage = typeof window !== "undefined" && window.location.pathname === "/role-selection";
        if (isOnRoleSelectionPage) {
          // User just selected role, always redirect to pricing first
          console.log("🔍 User just selected CLIENT role, redirecting to /pricing");
          window.location.href = "/pricing";
          return;
        }
        
        // Otherwise, check if user has manually selected a plan (not auto-created from signup)
        const checkSubscription = async () => {
          try {
            const subRes = await fetch("/api/user/subscriptions", { cache: "no-store" });
            if (subRes.ok) {
              const subData = await subRes.json();
              const hasSubscription = subData.subscriptions && subData.subscriptions.length > 0;
              if (hasSubscription) {
                console.log("🔍 User has subscription, redirecting to client dashboard");
                window.location.href = "/client-dashboard";
              } else {
                console.log("🔍 User has no subscription, redirecting to pricing");
                window.location.href = "/pricing";
              }
            } else {
              window.location.href = "/pricing";
            }
          } catch (error) {
            console.error("Error checking subscription:", error);
            window.location.href = "/pricing";
          }
        };
        checkSubscription();
        return;
      } else if (session.user.role === "DEVELOPER") {
        window.location.href = "/inbox";
      } else if (session.user.role === "ADMIN") {
        window.location.href = "/admin";
      } else {
        window.location.href = "/role-selection";
      }
      return;
    }

    // Nếu user đã có role nhưng chưa hoàn thành profile, skip role selection
    if (session.user.role && session.user.role !== "ADMIN") {
      console.log("🔍 Complete Profile - User has role:", session.user.role);
      setSelectedRole(session.user.role as UserRole);
      setCurrentStep(
        session.user.role === "CLIENT" ? "client-form" : "developer-form"
      );
    } else {
      console.log(
        "🔍 Complete Profile - No role found, showing role selection"
      );
    }
  }, [session?.user?.id, session?.user?.role, session?.user?.isProfileCompleted, router, isRedirectingAfterRoleSelect]);

  // Intercept navigation clicks if user hasn't selected a role yet
  useEffect(() => {
    const hasRole = session?.user?.role;
    
    if (hasRole) {
      return; // User has role, no need to intercept
    }

    const handleHeaderLinkClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Find if click is on a link or button within header
      const link = target.closest('a[href], button');
      
      if (!link) return;

      // Check if it's within the header
      const header = document.querySelector('header');
      if (!header || !header.contains(link)) return;

      // Allow logout and user menu actions
      if (
        link.getAttribute('aria-label')?.toLowerCase().includes('user') ||
        link.closest('[data-user-menu]') ||
        link.textContent?.toLowerCase().includes('logout') ||
        link.textContent?.toLowerCase().includes('sign out') ||
        link.closest('[role="menuitem"]')
      ) {
        return; // Allow logout and user menu
      }

      // Check if it's a navigation link (not logo)
      const href = (link as HTMLAnchorElement).href;
      if (href && !href.includes('#') && link !== header.querySelector('button[onclick*="handleLogoClick"], button[onclick*="LogoClick"]')) {
        // Allow logo click to go home
        if (link.closest('button') && target.closest('img[alt*="Clevrs"], img[alt*="logo"]')) {
          return;
        }

        // Prevent navigation and show dialog
        e.preventDefault();
        e.stopPropagation();
        setShowRoleRequiredDialog(true);
      }
    };

    document.addEventListener('click', handleHeaderLinkClick, true);
    
    return () => {
      document.removeEventListener('click', handleHeaderLinkClick, true);
    };
  }, [session?.user?.role]);

  const handleRoleSelect = async (role: UserRole) => {
    // Prevent multiple clicks
    if (isLoading) {
      return;
    }
    
    setIsLoading(true);
    try {
      console.log("🔍 Starting role selection for:", role);
      
      // If user already has this role, skip API and just route
      if (session?.user?.role === role) {
        console.log("🔍 User already has role, skip update and redirect");
        // Keep loading state true - don't reset it before redirect
        if (role === "CLIENT") {
          // For clients, always check subscription - if they have one and selected before, go to dashboard
          // But for new role selection, always go to upgrade page first
          try {
            const subRes = await fetch("/api/user/subscriptions", { cache: "no-store" });
            if (subRes.ok) {
              const subData = await subRes.json();
              const hasSubscription = subData.subscriptions && subData.subscriptions.length > 0;
              // Check if subscription was manually selected (not auto-created from signup)
              // For now, if user just selected role, always send to pricing page
              // They can select Free plan there if they want
              console.log("🔄 Redirecting to /pricing page to let user confirm/select plan");
              window.location.href = "/pricing";
              // Don't reset loading - page is redirecting
              return;
            } else {
              console.log("🔄 Subscription check failed, redirecting to /pricing");
              window.location.href = "/pricing";
              // Don't reset loading - page is redirecting
              return;
            }
          } catch (error) {
            console.error("Error checking subscription:", error);
            window.location.href = "/pricing";
            // Don't reset loading - page is redirecting
            return;
          }
        } else if (role === "DEVELOPER") {
          window.location.href = "/onboarding/freelancer/basic-information";
          // Don't reset loading - page is redirecting
          return;
        } else {
          router.push("/");
          // Don't reset loading - page is redirecting
          return;
        }
      }
      
      // Update user role and create profile
      const response = await fetch("/api/user/update-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });

      console.log("🔍 API response status:", response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error("❌ API error:", errorData);
        throw new Error(
          errorData.error || "Failed to update role and create profile"
        );
      }

      const result = await response.json();
      console.log("✅ API success:", result);

      // Set flag to prevent useEffect from redirecting
      setIsRedirectingAfterRoleSelect(true);

      // Update session first, then redirect
      await updateSession();
      console.log("✅ Session updated");

      setSelectedRole(role);

      // Show success message
      toast.success(
        `Role ${role === "CLIENT" ? "Client" : "Developer"} selected successfully!`
      );

      // Immediately redirect without delay to prevent useEffect from running
      // Keep isLoading true - don't reset it, let the redirect happen while loading
      if (role === "CLIENT") {
        console.log("🔄 Redirecting CLIENT to /pricing page (new account)");
        // For new accounts, always redirect to /pricing page to let user choose plan
        // Use window.location.href to force hard redirect and avoid middleware issues
        window.location.href = "/pricing";
        // Don't set loading to false - page is redirecting
        return;
      } else if (role === "DEVELOPER") {
        console.log("🔄 Redirecting DEVELOPER to onboarding");
        // Use window.location.href for immediate redirect, keeping loading state
        window.location.href = "/onboarding/freelancer/basic-information";
        // Don't set loading to false - page is redirecting
        return;
      } else {
        router.push("/");
        // Don't set loading to false - page is redirecting
        return;
      }

    } catch (error) {
      console.error("❌ Error updating role and creating profile:", error);
      setIsLoading(false); // Only reset loading on error
      toast.error(
        error instanceof Error
          ? error.message
          : "An error occurred while updating role and creating profile"
      );
    }
  };


  // Loading state
  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header - Always show authenticated style with user info */}
      <Header user={session?.user || undefined} />

      {/* Dialog for role selection requirement */}
      <Dialog open={showRoleRequiredDialog} onOpenChange={setShowRoleRequiredDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Role Selection</DialogTitle>
            <DialogDescription>
              Please select your role (Client or Freelancer) to continue accessing other pages.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              onClick={() => {
                setShowRoleRequiredDialog(false);
                // Scroll to role selection cards
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="w-full"
            >
              Select Role Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Main Content */}
      <main className="flex-1">
        <RoleSelection
          onRoleSelect={handleRoleSelect}
          currentRole={selectedRole || undefined}
          isLoading={isLoading}
        />
      </main>

      {/* Footer */}
      <footer className="bg-black text-white mt-16">
        <div className="container mx-auto px-4 sm:px-6 py-12">
          <div className="mb-10">
            <img 
              src="/images/home/clervelogo.png" 
              alt="Clevrs" 
              className="h-8 w-auto mb-2"
            />
            <a href="/help" className="mt-2 inline-block underline text-sm text-gray-300">Visit Help Center</a>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-8 text-gray-300">
            <div>
              <h4 className="font-semibold text-white mb-3">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/about" className="hover:underline">About us</Link></li>
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
                <li><Link href="/pricing" className="hover:underline">Pricing</Link></li>
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
          </div>

          <div className="mt-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-gray-400 text-sm">
            <div className="flex items-center gap-6 text-white">
              {/* Facebook */}
              <a href="#" aria-label="Facebook" className="hover:opacity-80 transition-opacity">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
              
              {/* X (Twitter) */}
              <a href="#" aria-label="X" className="hover:opacity-80 transition-opacity">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
              
              {/* YouTube */}
              <a href="#" aria-label="YouTube" className="hover:opacity-80 transition-opacity">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </a>
              
              {/* LinkedIn */}
              <a href="#" aria-label="LinkedIn" className="hover:opacity-80 transition-opacity">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </a>
              
              {/* Instagram */}
              <a href="#" aria-label="Instagram" className="hover:opacity-80 transition-opacity">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 6.62 5.367 11.987 11.988 11.987 6.62 0 11.987-5.367 11.987-11.987C24.014 5.367 18.637.001 12.017.001zM8.449 16.988c-1.297 0-2.448-.49-3.323-1.297C4.198 14.895 3.708 13.744 3.708 12.447s.49-2.448 1.418-3.323c.875-.807 2.026-1.297 3.323-1.297s2.448.49 3.323 1.297c.928.875 1.418 2.026 1.418 3.323s-.49 2.448-1.418 3.244c-.875.807-2.026 1.297-3.323 1.297zm7.83-9.781c-.49 0-.928-.175-1.297-.49-.368-.315-.49-.753-.49-1.243 0-.49.122-.928.49-1.243.369-.315.807-.49 1.297-.49s.928.175 1.297.49c.368.315.49.753.49 1.243 0 .49-.122.928-.49 1.243-.369.315-.807.49-1.297.49z"/>
                </svg>
              </a>
            </div>
          </div>
          
          {/* Bottom Section - Apps, Copyright, and Legal Links */}
          <div className="mt-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            {/* Left Side - Apps and Copyright */}
            <div className="flex flex-col gap-4">
              {/* Apps Section */}
              <div className="flex justify-start">
                <a href="#" className="inline-block">
                  <img 
                    src="/images/home/picgoapp.png" 
                    alt="Download on Google Play and App Store" 
                    className="h-12 w-auto"
                  />
                </a>
              </div>
              
              {/* Copyright - Bottom Left */}
              <p className="text-gray-400 text-sm">© 2025 Clevrs</p>
            </div>

            {/* Right Side - Privacy, Accessibility, Terms */}
            <div className="flex items-center gap-6 text-sm">
              <a href="#" className="hover:underline text-gray-400">Privacy</a>
              <a href="#" className="hover:underline text-gray-400">Accessibility</a>
              <a href="#" className="hover:underline text-gray-400">Terms</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
