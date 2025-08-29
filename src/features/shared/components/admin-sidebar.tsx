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
} from "lucide-react";
import { adminRoutes } from "@/core/config/routes";
import { Role } from "@prisma/client";

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
}

const navigationItems = [
  {
    name: "Dashboard",
    href: adminRoutes.ADMIN,
    icon: LayoutDashboard,
    description: "Overview and statistics",
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
}: AdminSidebarProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  // Only use usePathname on the client side to avoid SSR issues
  const pathname = mounted ? usePathname() : null;
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
      await signOut({ redirect: false });
      router.push("/admin/login");
    } catch (error) {
      console.error("Sign out error:", error);
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
          "fixed left-0 top-0 z-40 h-full w-64 transform bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 shadow-lg transition-transform duration-300 ease-in-out lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Sidebar Header */}
        <div className="flex h-20 items-center gap-3 p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="w-10 h-10 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center">
            <Shield className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              Admin Panel
            </h2>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {user.name || user.email}
            </p>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="p-4 space-y-2">
          {navigationItems.map((item) => {
            const isActive = mounted && pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors duration-200 group",
                  isActive
                    ? "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border-r-2 border-red-500"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                )}
              >
                <item.icon
                  className={cn(
                    "w-5 h-5 transition-colors duration-200",
                    isActive
                      ? "text-red-600 dark:text-red-400"
                      : "text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300"
                  )}
                />
                <div className="flex-1">
                  <div className="font-medium">{item.name}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-500">
                    {item.description}
                  </div>
                </div>
                <ChevronRight
                  className={cn(
                    "w-4 h-4 transition-transform duration-200",
                    isActive ? "rotate-90" : "rotate-0"
                  )}
                />
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer - Logout Button */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleSignOut}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg border border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600" />
            ) : (
              <LogOut className="w-4 h-4" />
            )}
            <span className="font-medium">
              {isLoading ? "Signing out..." : "Sign Out"}
            </span>
          </button>
        </div>
      </aside>
    </>
  );
}
