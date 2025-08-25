"use client";

import { signOut } from "next-auth/react";
import { Icons } from "@/features/shared/components/icons";
import { ModeToggle } from "@/features/shared/components/mode-toggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/ui/components/dropdown-menu";
import { Button } from "@/ui/components/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/ui/components/avatar";
import { LogOut, User, Settings, Plus, Inbox, DollarSign, FolderOpen } from "lucide-react";
import { User as UserType } from "next-auth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";

interface HeaderProps {
  user: UserType;
}

export function Header({ user }: HeaderProps) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const getUserInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <div className="flex items-center gap-6">
          <Link href="/">
            <Icons.logo className="h-8 w-8 text-primary" />
          </Link>
          
          {/* Navigation Links */}
                  {mounted && user?.role === "CLIENT" && (
          <nav className="hidden md:flex items-center gap-4">
            <Link href="/projects">
              <Button variant="ghost" size="sm" className="flex items-center gap-2">
                <FolderOpen className="h-4 w-4" />
                My Projects
              </Button>
            </Link>
            <Link href="/projects/new">
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Post Project
              </Button>
            </Link>
            <Link href="/pricing">
              <Button variant="ghost" size="sm" className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Pricing
              </Button>
            </Link>
          </nav>
        )}
          
          {mounted && user?.role === "DEVELOPER" && (
            <nav className="hidden md:flex items-center gap-4">
              <Link href="/inbox">
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <Inbox className="h-4 w-4" />
                  Inbox
                </Button>
              </Link>
            </nav>
          )}
        </div>

        {/* Right side - Mode toggle and User dropdown */}
        <div className="flex items-center gap-4">
          {/* Only render ModeToggle after mounting to prevent hydration issues */}
          {mounted && <ModeToggle />}

          {/* User Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="relative h-10 w-10 rounded-full"
              >
                <Avatar className="h-10 w-10">
                  <AvatarImage
                    src={user.image || undefined}
                    alt={user.name || user.email || "User"}
                  />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {user.name
                      ? getUserInitials(user.name)
                      : user.email?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <div className="flex items-center justify-start gap-2 p-2">
                <div className="flex flex-col space-y-1 leading-none">
                  {user.name && <p className="font-medium">{user.name}</p>}
                  <p className="w-[200px] truncate text-sm text-muted-foreground">
                    {user.email}
                  </p>
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push("/profile")}>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => signOut()}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
