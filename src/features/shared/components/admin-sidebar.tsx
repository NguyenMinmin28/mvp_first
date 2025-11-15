// @ts-nocheck
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { cn } from "@/core/utils/utils";
import {
  LayoutDashboard,
  Users,
  Shield,
  Menu,
  X,
  ChevronRight,
  LogOut,
  CreditCard,
  Clock,
  List,
  Lightbulb,
  MessageSquare,
  TrendingUp,
} from "lucide-react";

import { adminRoutes } from "@/core/config/routes";
import type { Prisma } from "@prisma/client";
type Role = Prisma.$Enums.Role;

interface AdminSidebarProps {
  user: {
    id: string;
    name: string | null | undefined;
    email: string | null | undefined;
    image: string | null | undefined;
    phoneE164: string | undefined;
    role: Role | undefined;
    isProfileCompleted: boolean | undefined;
  };
  isOpen?: boolean;
  setIsOpen?: (open: boolean) => void;
  collapsed?: boolean;
}

const navigationItems = [
  {
    name: "Dashboard",
    href: adminRoutes.ADMIN,
    icon: LayoutDashboard,
    description: "Overview and statistics",
  },
  {
    name: "User Management",
    href: "/admin/users",
    icon: Users,
    description: "Manage all users and roles",
  },
  {
    name: "Developer Profile",
    href: adminRoutes.DEVELOPER_PROFILE,
    icon: Users,
    description: "Manage developer profiles",
  },
  {
    name: "Developer Approvals",
    href: "/admin/developers",
    icon: Users,
    description: "Review and approve developers",
  },
  {
    name: "Blog Management",
    href: "/admin/blog",
    icon: MessageSquare,
    description: "Create and manage blog posts",
  },
  {
    name: "IdeaSpark Management",
    href: "/admin/ideaspark",
    icon: Lightbulb,
    description: "Manage ideas, approvals & reports",
  },
  {
    name: "Transactions",
    href: "/admin/transactions",
    icon: CreditCard,
    description: "View all user payments (read-only)",
  },
  {
    name: "Usage Logs",
    href: "/admin/usage-transactions",
    icon: List,
    description: "Project/contact usage changes",
  },
  {
    name: "Cron Runs",
    href: "/admin/cron-runs",
    icon: Clock,
    description: "History of scheduled jobs",
  },
];

export function AdminSidebar({
  user,
  isOpen: externalIsOpen,
  setIsOpen: externalSetIsOpen,
  collapsed = false,
}: AdminSidebarProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Always call hooks in the same order
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Use external state if provided, otherwise use internal state
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;
  const setIsOpen = externalSetIsOpen || setInternalIsOpen;

  const toggleSidebar = () => setIsOpen(!isOpen);

  const handleSignOut = async () => {
    setIsLoading(true);
    try {
      // SignOut first and wait briefly to ensure session is cleared
      await signOut({ redirect: false });
      
      // Small delay to ensure NextAuth cleanup completes
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Use router.push for Next.js compatibility
      router.push("/admin/login");
    } catch (error) {
      console.error("Sign out error:", error);
      // Fallback redirect
      if (typeof window !== "undefined") {
        window.location.href = "/admin/login";
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Mobile Sidebar Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-full transform bg-white border-r border-gray-200 overflow-hidden transition-[transform,width] duration-500 ease-in-out lg:translate-x-0",
          collapsed ? "w-16" : "w-64",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Sidebar Header */}
        <div className="flex h-16 items-center gap-3 px-4 border-b border-gray-200">
          <div
            className={cn(
              "w-9 h-9 rounded-lg flex items-center justify-center",
              collapsed ? "bg-transparent" : "bg-blue-50"
            )}
          >
            <Shield className="w-5 h-5 text-blue-600" />
          </div>
          <div
            className={cn(
              "overflow-hidden transition-[max-width,opacity,transform] duration-400 ease-in-out",
              collapsed ? "max-w-0 opacity-0" : "max-w-[160px] opacity-100"
            )}
            aria-hidden={collapsed}
          >
            <h2 className="text-sm font-semibold tracking-wide text-gray-800 whitespace-nowrap will-change-transform">
              Admin Console
            </h2>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="px-2 py-3 space-y-3">
          {navigationItems.map((item) => {
            const isActive = mounted && pathname && pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md transition-colors duration-150 group h-[36px]",
                  isActive
                    ? "text-blue-600"
                    : "text-gray-700 hover:text-gray-900"
                )}
              >
                <item.icon
                  className={cn(
                    "w-4 h-4 group-hover:text-blue-500",
                    isActive ? "text-blue-600" : "text-gray-500"
                  )}
                />
                <div
                  className={cn(
                    "flex-1 overflow-hidden transition-[max-width,opacity,transform] duration-400 ease-in-out",
                    collapsed
                      ? "max-w-0 opacity-0 hidden"
                      : "max-w-[200px] opacity-100"
                  )}
                  aria-hidden={collapsed}
                >
                  <span
                    className={cn(
                      "block truncate text-sm group-hover:text-blue-500 will-change-transform",
                      isActive ? "font-medium" : "font-normal",
                      collapsed ? "translate-x-2" : "translate-x-0"
                    )}
                  >
                    {item.name}
                  </span>
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer removed: sign out moved to header */}
      </aside>
    </>
  );
}
