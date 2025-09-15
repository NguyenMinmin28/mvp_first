// @ts-nocheck
"use client";

import { useState } from "react";
import { Button } from "@/ui/components/button";
import { Menu, ChevronLeft, ChevronRight, LogOut, User } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/ui/components/dropdown-menu";
import { signOut } from "next-auth/react";
import { Avatar, AvatarImage, AvatarFallback } from "@/ui/components/avatar";
import { cn } from "@/core/utils/utils";
import type { Prisma } from "@prisma/client";
type Role = Prisma.$Enums.Role;

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
  isSidebarOpen?: boolean;
  isCollapsed?: boolean;
  onToggleCollapsed?: () => void;
}

export function AdminHeader({
  user,
  onToggleSidebar,
  isSidebarOpen,
  isCollapsed,
  onToggleCollapsed,
}: AdminHeaderProps) {
  return (
    <header
      className={cn(
        "fixed top-0 right-0 left-0 z-50 bg-white/95 border-b border-gray-200 backdrop-blur-md overflow-x-hidden h-16",
        isCollapsed ? "lg:left-16" : "lg:left-64"
      )}
    >
      <div className="h-16">
        <div className="w-full px-1 sm:px-2 h-full">
          <div className="h-full flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                onClick={onToggleSidebar}
                variant="ghost"
                size="sm"
                className="p-2 hover:bg-gray-100 lg:hidden"
                aria-label="Toggle sidebar"
              >
                <Menu className="w-5 h-5 text-gray-700" />
              </Button>
              <Button
                onClick={onToggleCollapsed}
                variant="ghost"
                size="sm"
                className="p-2 hover:bg-gray-100 hidden lg:inline-flex"
                aria-label="Collapse sidebar"
              >
                {isCollapsed ? (
                  <ChevronRight className="w-5 h-5 text-gray-700" />
                ) : (
                  <ChevronLeft className="w-5 h-5 text-gray-700" />
                )}
              </Button>
            </div>
            <div className="flex items-center gap-3 pr-3 ml-auto">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="inline-flex items-center rounded-full p-0.5 hover:bg-gray-100 focus:outline-none">
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={user?.image || ""}
                        alt={user?.name || "User"}
                      />
                      <AvatarFallback>
                        <User className="w-4 h-4 text-gray-600" />
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="text-xs text-gray-500">
                    Signed in as
                  </DropdownMenuLabel>
                  <div className="px-2 pb-1 text-xs truncate">
                    {user?.email || user?.name}
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => signOut()}
                    className="cursor-pointer group"
                  >
                    <LogOut className="mr-2 h-4 w-4 group-hover:text-red-500" />
                    <span className="group-hover:text-red-500">Sign out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
