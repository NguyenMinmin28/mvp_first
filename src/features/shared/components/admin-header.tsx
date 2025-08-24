"use client";

import { useState } from "react";
import { Button } from "@/ui/components/button";
import { ModeToggle } from "@/features/shared/components/mode-toggle";
import { Shield, Menu } from "lucide-react";
import { Role } from "@prisma/client";

interface AdminHeaderProps {
  user: {
    id: string;
    name: string | null | undefined;
    email: string | null | undefined;
    image: string | null | undefined;
    phoneE164: string | undefined;
    role: Role | undefined;
    isProfileCompleted: boolean | undefined;
  };
  onToggleSidebar?: () => void;
}

export function AdminHeader({ user, onToggleSidebar }: AdminHeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 dark:bg-gray-800/95 border-b border-gray-200 dark:border-gray-700 shadow-sm backdrop-blur-md">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Mobile Sidebar Toggle */}
            <Button
              onClick={onToggleSidebar}
              variant="ghost"
              size="sm"
              className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <Menu className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </Button>

            {/* Logo and Title */}
            <div className="w-10 h-10 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center">
              <Shield className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                Admin Dashboard
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Welcome back, {user.name || user.email}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <ModeToggle />
          </div>
        </div>
      </div>
    </header>
  );
}
