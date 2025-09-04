"use client";

import { signOut } from "next-auth/react";
import { Icons } from "@/features/shared/components/icons";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/ui/components/dropdown-menu";
import { Button } from "@/ui/components/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/ui/components/avatar";
import { LogOut, User, Settings, Plus, FolderOpen, Menu, X, Bell, ChevronDown, Zap, DollarSign } from "lucide-react";
import { User as UserType } from "next-auth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePortal } from "@/features/shared/portal-context";
import { PortalLoginModal } from "@/features/shared/components/portal-login-modal";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/ui/components/dialog";

interface HeaderProps {
  user?: UserType;
}

export function Header({ user }: HeaderProps) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [pendingLogoutPortal, setPendingLogoutPortal] = useState<"client" | "freelancer" | null>(null);
  
  // Use portal context with fallback
  const portalContext = usePortal();

  const { 
    activePortal, 
    setActivePortal, 
    showLoginModal, 
    setShowLoginModal, 
    pendingPortal,
    setPendingPortal,
    showLoginModalForPortal
  } = portalContext;

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

  // Check if user is authenticated (using NextAuth session)
  const isAuthenticated = !!user?.id;
  
  // Get user role from session
  const userRole = user?.role as string | undefined;
  
  // Debug logging
  console.log("🔍 Header - User:", user);
  console.log("🔍 Header - User Role:", userRole);
  console.log("🔍 Header - Is Authenticated:", isAuthenticated);

  // Auto-sync portal with user role
  useEffect(() => {
    if (mounted && isAuthenticated && userRole) {
      if (userRole === "CLIENT" && activePortal !== "client") {
        setActivePortal("client");
      } else if (userRole === "DEVELOPER" && activePortal !== "freelancer") {
        setActivePortal("freelancer");
      }
    }
  }, [mounted, isAuthenticated, userRole, activePortal, setActivePortal]);

  const handleLoginClick = () => {
    console.log("Login clicked for portal:", pendingPortal);
    setShowLoginModal(false);
    setPendingPortal(null);
    // Redirect to login page with portal parameter
    router.push(`/auth/signin?portal=${pendingPortal}`);
  };

  const handlePortalSwitch = (targetPortal: "client" | "freelancer") => {
    if (!isAuthenticated) {
      // Case 4: Chưa đăng nhập -> chuyển về trang đăng nhập
      showLoginModalForPortal(targetPortal);
      return;
    }

    // Case 3: Đã có role và bấm vào role của chính họ -> chuyển về dashboard
    if (userRole === "CLIENT" && targetPortal === "client") {
      setActivePortal("client");
      router.push("/client-dashboard");
      return;
    } else if (userRole === "DEVELOPER" && targetPortal === "freelancer") {
      setActivePortal("freelancer");
      router.push("/dashboard-user");
      return;
    }

    // Case 1 & 2: Kiểm tra role và xử lý chuyển đổi
    const isClientRole = userRole === "CLIENT";
    const isDeveloperRole = userRole === "DEVELOPER";
    
    if (targetPortal === "client" && isDeveloperRole) {
      // Case 1: Developer bấm vào Client -> hiển thị modal xác nhận
      setPendingLogoutPortal("client");
      setShowLogoutConfirm(true);
      return;
    } else if (targetPortal === "freelancer" && isClientRole) {
      // Case 2: Client bấm vào Freelancer -> hiển thị modal xác nhận
      setPendingLogoutPortal("freelancer");
      setShowLogoutConfirm(true);
      return;
    } else if (targetPortal === "client" && isClientRole) {
      // Client bấm vào Client -> chuyển đổi portal và về dashboard
      setActivePortal("client");
      router.push("/client-dashboard");
    } else if (targetPortal === "freelancer" && isDeveloperRole) {
      // Developer bấm vào Freelancer -> chuyển đổi portal và về dashboard
      setActivePortal("freelancer");
      router.push("/dashboard-user");
    } else {
      // Role không khớp -> logout và chuyển về trang đăng nhập
      setActivePortal(targetPortal);
    }
  };

  const handleConfirmLogout = () => {
    setShowLogoutConfirm(false);
    if (pendingLogoutPortal) {
      setActivePortal(pendingLogoutPortal);
      setPendingLogoutPortal(null);
      signOut({ callbackUrl: `/auth/signin?portal=${pendingLogoutPortal}` });
    }
  };

  const handleCancelLogout = () => {
    setShowLogoutConfirm(false);
    setPendingLogoutPortal(null);
  };

  return (
    <>
      <header className={`sticky top-0 z-50 w-full ${!isAuthenticated ? "bg-black text-white" : "bg-white text-black border-b"}`}>
        <div className="container flex h-16 items-center justify-between px-4">
          {/* Logo */}
          <div className="flex items-center gap-6">
            <Link href="/">
              <img 
                src={!isAuthenticated ? "/images/home/clervelogo.png" : "/images/home/clervelogoblack.png"}
                alt="Clevrs" 
                className="h-8 w-auto"
              />
            </Link>
            
            {/* Portal Switch */}
            <div className="hidden md:flex items-center gap-2 text-sm">
              <button
                className={`px-3 py-1 rounded-full border ${activePortal === "client" ? "bg-black text-white" : !isAuthenticated ? "text-white border-white/40" : "text-black"}`}
                onClick={() => handlePortalSwitch("client")}
              >
                Client {user?.id && userRole === "CLIENT" && "✓"}
              </button>
              <button
                className={`px-3 py-1 rounded-full border ${activePortal === "freelancer" ? "bg-black text-white" : !isAuthenticated ? "text-white border-white/40" : "text-black"}`}
                onClick={() => handlePortalSwitch("freelancer")}
              >
                Freelancer {user?.id && userRole === "DEVELOPER" && "✓"}
              </button>
            </div>
            
            {/* Navigation Links - Show based on user role */}
            {isAuthenticated && mounted && userRole === "CLIENT" && (
            <nav className="hidden md:flex items-center gap-4">
              <Link href="/my-projects">
                <Button variant="ghost" size="sm" className={`flex items-center gap-2 ${!isAuthenticated ? "text-white hover:bg-white hover:text-black" : "text-black hover:bg-black hover:text-white"}`}>
                  <FolderOpen className="h-4 w-4" />
                  My Projects
                </Button>
              </Link>
              {/* Removed Post Project link as requested */}
              <Link href="/pricing">
                <Button variant="ghost" size="sm" className={`flex items-center gap-2 ${!isAuthenticated ? "text-white hover:bg-white hover:text-black" : "text-black hover:bg-black hover:text-white"}`}>
                  <DollarSign className="h-4 w-4" />
                  Pricing
                </Button>
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className={`flex items-center gap-2 ${!isAuthenticated ? "text-white hover:bg-white hover:text-black" : "text-black hover:bg-black hover:text-white"}`}>
                    About <ChevronDown className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  <DropdownMenuItem asChild>
                    <Link href="/about">About us</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/how-clevrs-work">How Clevrs Work</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/newsroom">Newsroom</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/investors">Investor Relation</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/blog">Blog</Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Link href="/ideas">
                <Button variant="ghost" size="sm" className={`flex items-center gap-2 ${!isAuthenticated ? "text-white hover:bg-white hover:text-black" : "text-black hover:bg-black hover:text-white"}`}>
                  <Zap className="h-4 w-4" />
                  Idea Spark
                </Button>
              </Link>
            </nav>
          )}
            
            {isAuthenticated && mounted && userRole === "DEVELOPER" && (
              <nav className="hidden md:flex items-center gap-4">
                <Link href="/ideas">
                  <Button variant="ghost" size="sm" className={`flex items-center gap-2 ${!isAuthenticated ? "text-white hover:bg-white hover:text-black" : "text-black hover:bg-black hover:text-white"}`}>
                    <Zap className="h-4 w-4" />
                    IdeaSpark
                  </Button>
                </Link>
                              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className={`flex items-center gap-2 ${!isAuthenticated ? "text-white hover:bg-white hover:text-black" : "text-black hover:bg-black hover:text-white"}`}>
                    About <ChevronDown className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  <DropdownMenuItem asChild>
                    <Link href="/about">About us</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/how-clevrs-work">How Clevrs Work</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/newsroom">Newsroom</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/investors">Investor Relation</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/blog">Blog</Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </nav>
          )}

            {!isAuthenticated && (
              <nav className="hidden md:flex items-center gap-8">
                <Link href="/ideas" className="text-sm hover:opacity-80">IdeaSpark</Link>
                <Link href="/pricing" className="text-sm hover:opacity-80">Price</Link>
                              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-1 text-sm">
                    About <ChevronDown className="w-4 h-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  <DropdownMenuItem asChild>
                    <Link href="/about">About us</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/how-clevrs-work">How Clevrs Work</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/newsroom">Newsroom</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/investors">Investor Relation</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/blog">Blog</Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              </nav>
            )}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-6">

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              className={`md:hidden ${!isAuthenticated ? "text-white" : "text-black"}`}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>

            {/* Public right actions */}
            {!isAuthenticated && (
              <div className="hidden md:flex items-center gap-6">
                <div className="relative">
                  <Bell className="w-5 h-5" />
                  <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-red-500" />
                </div>
                <Link href="/help" className="text-sm">Help</Link>
                <Link href="/auth/signin" className="text-sm">Log in</Link>
                <Link href="/auth/signup" className="inline-flex items-center h-9 px-4 rounded-full bg-white text-black text-sm">Sign up</Link>
              </div>
            )}

            {/* Authenticated right actions */}
            {isAuthenticated && (
              <div className="hidden md:flex items-center gap-6">
                <button className="relative inline-flex items-center justify-center h-9 w-9 rounded-full hover:bg-white hover:text-black">
                  <Bell className="w-5 h-5" />
                  <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-red-500" />
                </button>
                <Link href="/help" className="text-sm hover:bg-white hover:text-black px-3 py-1.5 rounded-full">Help</Link>
              </div>
            )}

            {/* User Dropdown - Only show if authenticated to current portal */}
            {isAuthenticated && user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.image || undefined} alt={user.name || user.email || "User"} />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {user.name ? getUserInitials(user.name) : user.email?.charAt(0).toUpperCase() || "U"}
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
                  <DropdownMenuItem onClick={async () => {
                    try {
                      await signOut({ callbackUrl: '/' });
                    } catch (error) {
                      console.error('Sign out error:', error);
                      router.push('/');
                    }
                  }}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        {/* Greeting bar when authenticated */}
        {isAuthenticated && user && (
          <div className="w-full bg-black text-white">
            <div className="container px-4 py-2 text-sm">
              {`Welcome back, ${user.name || user.email || "there"}`}
            </div>
          </div>
        )}

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-200">
            <div className="container px-4 py-4 space-y-4">
              {/* Portal Switch Mobile */}
              <div className="flex items-center gap-2 text-sm">
                <button
                  className={`px-3 py-2 rounded-full border ${activePortal === "client" ? "bg-black text-white" : "text-black border-gray-300"}`}
                  onClick={() => handlePortalSwitch("client")}
                >
                  Client {user?.id && userRole === "CLIENT" && "✓"}
                </button>
                <button
                  className={`px-3 py-2 rounded-full border ${activePortal === "freelancer" ? "bg-black text-white" : "text-black border-gray-300"}`}
                  onClick={() => handlePortalSwitch("freelancer")}
                >
                  Freelancer {user?.id && userRole === "DEVELOPER" && "✓"}
                </button>
              </div>

              {/* Navigation Links Mobile */}
              {isAuthenticated && userRole === "CLIENT" && (
                <nav className="space-y-2">
                  <Link href="/my-projects" className="block py-2 text-gray-700 hover:text-black">
                    <div className="flex items-center gap-2">
                      <FolderOpen className="h-4 w-4" />
                      My Projects
                    </div>
                  </Link>
                  <Link href="/pricing" className="block py-2 text-gray-700 hover:text-black">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Pricing
                    </div>
                  </Link>
                  <div className="py-2">
                    <div className="flex items-center gap-2 text-gray-700">
                      <span>About</span>
                    </div>
                    <div className="ml-6 mt-2 space-y-1">
                      <Link href="/about" className="block py-1 text-sm text-gray-600 hover:text-black">About us</Link>
                      <Link href="/how-clevrs-work" className="block py-1 text-sm text-gray-600 hover:text-black">How Clevrs Work</Link>
                      <Link href="/newsroom" className="block py-1 text-sm text-gray-600 hover:text-black">Newsroom</Link>
                      <Link href="/investors" className="block py-1 text-sm text-gray-600 hover:text-black">Investor Relation</Link>
                      <Link href="/blog" className="block py-1 text-sm text-gray-600 hover:text-black">Blog</Link>
                    </div>
                  </div>
                  <Link href="/ideas" className="block py-2 text-gray-700 hover:text-black">
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      Idea Spark
                    </div>
                  </Link>
                </nav>
              )}

              {isAuthenticated && userRole === "DEVELOPER" && (
                <nav className="space-y-2">
                  <Link href="/ideas" className="block py-2 text-gray-700 hover:text-black">
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      IdeaSpark
                    </div>
                  </Link>
                  <div className="py-2">
                    <div className="flex items-center gap-2 text-gray-700">
                      <span>About</span>
                    </div>
                    <div className="ml-6 mt-2 space-y-1">
                      <Link href="/about" className="block py-1 text-sm text-gray-600 hover:text-black">About us</Link>
                      <Link href="/how-clevrs-work" className="block py-1 text-sm text-gray-600 hover:text-black">How Clevrs Work</Link>
                      <Link href="/newsroom" className="block py-1 text-sm text-gray-600 hover:text-black">Newsroom</Link>
                      <Link href="/investors" className="block py-1 text-sm text-gray-600 hover:text-black">Investor Relation</Link>
                      <Link href="/blog" className="block py-1 text-sm text-gray-600 hover:text-black">Blog</Link>
                    </div>
                  </div>
                </nav>
              )}

              {!isAuthenticated && (
                <nav className="space-y-2">
                  <Link href="/ideas" className="block py-2 text-gray-700 hover:text-black">IdeaSpark</Link>
                  <Link href="/pricing" className="block py-2 text-gray-700 hover:text-black">Price</Link>
                  <div className="py-2">
                    <div className="text-gray-700">About</div>
                    <div className="ml-4 mt-2 space-y-1">
                      <Link href="/about" className="block py-1 text-sm text-gray-600 hover:text-black">About us</Link>
                      <Link href="/how-clevrs-work" className="block py-1 text-sm text-gray-600 hover:text-black">How Clevrs Work</Link>
                      <Link href="/newsroom" className="block py-1 text-sm text-gray-600 hover:text-black">Newsroom</Link>
                      <Link href="/investors" className="block py-1 text-sm text-gray-600 hover:text-black">Investor Relation</Link>
                      <Link href="/blog" className="block py-1 text-sm text-gray-600 hover:text-black">Blog</Link>
                    </div>
                  </div>
                  <Link href="/ideas" className="block py-2 text-gray-700 hover:text-black">
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      Idea Spark
                    </div>
                  </Link>
                </nav>
              )}

              {/* Mobile Actions */}
              {isAuthenticated && (
                <div className="pt-4 border-t border-gray-200 space-y-2">
                  <Link href="/help" className="block py-2 text-gray-700 hover:text-black">Help</Link>
                  <button className="w-full text-left py-2 text-gray-700 hover:text-black">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Profile
                    </div>
                  </button>
                  <button className="w-full text-left py-2 text-gray-700 hover:text-black">
                    <div className="flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      Settings
                    </div>
                  </button>
                  <button 
                    className="w-full text-left py-2 text-red-600 hover:text-red-800"
                    onClick={async () => {
                      try {
                        await signOut({ callbackUrl: '/' });
                      } catch (error) {
                        console.error('Sign out error:', error);
                        router.push('/');
                      }
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <LogOut className="h-4 w-4" />
                      Log out
                    </div>
                  </button>
                </div>
              )}

              {!isAuthenticated && (
                <div className="pt-4 border-t border-gray-200 space-y-2">
                  <Link href="/help" className="block py-2 text-gray-700 hover:text-black">Help</Link>
                  <Link href="/auth/signin" className="block py-2 text-gray-700 hover:text-black">Log in</Link>
                  <Link href="/auth/signup" className="block py-2 px-4 rounded-full bg-black text-white text-center">Sign up</Link>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Portal Login Modal */}
      {pendingPortal && (
        <PortalLoginModal
          isOpen={showLoginModal}
          onClose={() => {
            setShowLoginModal(false);
            setPendingPortal(null);
          }}
          portal={pendingPortal}
          onLogin={handleLoginClick}
        />
      )}

      {/* Logout Confirmation Modal */}
      <Dialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm logout</DialogTitle>
            <DialogDescription>
              Are you sure you want to logout and login with {pendingLogoutPortal === "client" ? "Client" : "Freelancer"} account?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={handleCancelLogout}>
              Cancel
            </Button>
            <Button onClick={handleConfirmLogout}>
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
