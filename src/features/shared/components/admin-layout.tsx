// @ts-nocheck
"use client";

import { ReactNode, useState } from "react";

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
    name: string | null | undefined;
    email: string | null | undefined;
    image: string | null | undefined;
    phoneE164: string | undefined;
    role: Role | undefined;
    isProfileCompleted: boolean | undefined;
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

  // Use session refresh hook to automatically refresh user data on navigation
  const { isRefreshing } = useSessionRefresh();

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 overflow-x-hidden" style={{ minHeight: '100vh', overflowX: 'hidden' }}>
      {/* Header */}
      <AdminHeader user={user} onToggleSidebar={toggleSidebar} />
      <SessionRefreshNotice isRefreshing={isRefreshing} />
      {/* Sidebar */}
      <AdminSidebar
        user={user}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
      />

      {/* Main Content */}
      <main className="pt-20 lg:ml-64" style={{ display: 'block', paddingTop: '3rem', marginLeft: '15rem' }}>
        <div className="w-full max-w-6xl px-1 sm:px-2 lg:px-4 py-4" style={{ padding: '1rem 0.25rem', width: '100%' }}>
          {children}
        </div>
      </main>
    </div>
  );
}
