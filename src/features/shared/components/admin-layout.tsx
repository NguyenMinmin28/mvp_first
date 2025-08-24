"use client";

import { ReactNode, useState } from "react";
import { AdminHeader } from "./admin-header";
import { AdminSidebar } from "./admin-sidebar";
import { Role } from "@prisma/client";

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

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <AdminHeader user={user} onToggleSidebar={toggleSidebar} />

      {/* Sidebar */}
      <AdminSidebar
        user={user}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
      />

      {/* Main Content */}
      <main className="lg:ml-64 pt-20">
        <div className="container mx-auto px-4 py-8">{children}</div>
      </main>
    </div>
  );
}
