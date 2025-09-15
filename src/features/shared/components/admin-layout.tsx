// @ts-nocheck
"use client";

import { ReactNode, useState } from "react";
import { cn } from "@/core/utils/utils";

import { AdminHeader } from "./admin-header";
import { AdminSidebar } from "./admin-sidebar";
import type { Prisma } from "@prisma/client";
type Role = Prisma.$Enums.Role;
import { useSessionRefresh } from "@/core/hooks/use-session-refresh";
import { SessionRefreshNotice } from "@/ui/components/session-refresh-notice";
// Removed ForceRefreshSession to prevent infinite session update loops

interface AdminLayoutProps {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    phoneE164?: string;
    role?: Role | string;
    isProfileCompleted?: boolean;
    adminApprovalStatus?: string;
  };
  children: ReactNode;
  title?: string;
  description?: string;
}

export function AdminLayout({
  user,
  children,
  title,
  description,
}: AdminLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    try {
      return localStorage.getItem("adminSidebarCollapsed") === "1";
    } catch {
      return false;
    }
  });

  // Use session refresh hook to automatically refresh user data on navigation
  const { isRefreshing } = useSessionRefresh();

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const toggleCollapsed = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("adminSidebarCollapsed", next ? "1" : "0");
      } catch {}
      return next;
    });
  };

  return (
    <div
      className="min-h-screen bg-white overflow-x-hidden"
      style={{ minHeight: "100vh", overflowX: "hidden" }}
    >
      {/* Header */}
      <AdminHeader
        user={user}
        onToggleSidebar={toggleSidebar}
        isSidebarOpen={isSidebarOpen}
        isCollapsed={isCollapsed}
        onToggleCollapsed={toggleCollapsed}
      />
      <SessionRefreshNotice isRefreshing={isRefreshing} />
      {/* Sidebar */}
      <AdminSidebar
        user={user}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        collapsed={isCollapsed}
      />

      {/* Main Content */}
      <main
        className={cn("pt-16", isCollapsed ? "lg:ml-16" : "lg:ml-64")}
        style={{ display: "block" }}
      >
        <div className="w-full px-1 sm:px-2 lg:px-6 py-4">{children}</div>
      </main>
    </div>
  );
}
