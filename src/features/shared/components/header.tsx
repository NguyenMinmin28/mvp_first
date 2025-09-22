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
import { LogOut, User, Settings, Plus, FolderOpen, Menu, X, Bell, ChevronDown, Zap, DollarSign, Briefcase } from "lucide-react";
import { User as UserType } from "next-auth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
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
  const [unread, setUnread] = useState<number>(0);
  const [openNotif, setOpenNotif] = useState(false);
  const [items, setItems] = useState<Array<{id:string; type:string; createdAt:string; payload:any; projectId?:string; read:boolean;}>>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const notifRef = useRef<HTMLDivElement | null>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [pendingLogoutPortal, setPendingLogoutPortal] = useState<"client" | "freelancer" | null>(null);
  const [userData, setUserData] = useState<any>(null);
  
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

  // Fetch user data with photoUrl
  useEffect(() => {
    const fetchUserData = async () => {
      if (user?.id) {
        try {
          const response = await fetch("/api/user/me", { credentials: 'include' });
          if (response.ok) {
            const data = await response.json();
            setUserData(data.user);
          }
        } catch (error) {
          console.error("Failed to fetch user data:", error);
        }
      }
    };
    
    fetchUserData();
  }, [user?.id]);

  // Listen for profile updates
  useEffect(() => {
    const handleProfileUpdate = () => {
      if (user?.id) {
        fetch("/api/user/me", { credentials: 'include' })
          .then(res => res.ok ? res.json() : null)
          .then(data => data && setUserData(data.user))
          .catch(err => console.error("Failed to refresh user data:", err));
      }
    };

    window.addEventListener('profile-updated', handleProfileUpdate);
    return () => window.removeEventListener('profile-updated', handleProfileUpdate);
  }, [user?.id]);

  // Function to refresh notification count
  const refreshNotificationCount = async () => {
    try {
      const res = await fetch(`/api/notifications?only=unread&limit=10&_=${Date.now()}` , { 
        cache: "no-store",
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      if (!res.ok) return;
      const data = await res.json();
      const items = Array.isArray(data.items) ? data.items : [];
      const serverUnread = typeof data.unreadCount === 'number' ? data.unreadCount : undefined;
      const localUnread = items.reduce((acc: number, it: any) => acc + (it.read ? 0 : 1), 0);
      setUnread(serverUnread && serverUnread > 0 ? serverUnread : localUnread);
      console.log('🔔 Notification count refreshed:', data.unreadCount);
    } catch (error) {
      console.error('🔔 Failed to refresh notification count:', error);
    }
  };

  // No polling: only load once on initial mount (handled below)

  // Refresh unread count immediately when user becomes authenticated
  useEffect(() => {
    if (user?.id) {
      refreshNotificationCount();
      // small debounce retry in case session becomes ready right after mount
      const t = setTimeout(() => refreshNotificationCount(), 1500);
      return () => clearTimeout(t);
    }
  }, [user?.id]);

  // No focus/visibility refresh: user requested only on full page load

  // No custom refresh events: load only once per page load

  // Close notifications dropdown on outside click / Esc
  useEffect(() => {
    if (!openNotif) return;
    const onClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (notifRef.current && !notifRef.current.contains(target)) {
        setOpenNotif(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenNotif(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [openNotif]);

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

  // Use a stable, locale-agnostic date formatter to avoid hydration mismatch
  const formatDateStable = (isoString: string) => {
    try {
      const d = new Date(isoString);
      // Format in UTC to be deterministic between server and client
      const yyyy = d.getUTCFullYear();
      const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
      const dd = String(d.getUTCDate()).padStart(2, '0');
      const hh = String(d.getUTCHours()).padStart(2, '0');
      const mi = String(d.getUTCMinutes()).padStart(2, '0');
      const ss = String(d.getUTCSeconds()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss} UTC`;
    } catch {
      return isoString;
    }
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
                <Button
                  variant="ghost"
                  size="sm"
                  className={`flex items-center gap-2 ${
                    (typeof window !== 'undefined' && window.location.pathname.startsWith('/my-projects'))
                      ? 'bg-black text-white hover:bg-black hover:text-white'
                      : (!isAuthenticated ? 'text-white hover:bg-white hover:text-black' : 'text-black hover:bg-black hover:text-white')
                  }`}
                >
                  <FolderOpen className="h-4 w-4" />
                  My Projects
                </Button>
              </Link>
              <Link href="/services?tab=people">
                <Button
                  variant="ghost"
                  size="sm"
                  className={`flex items-center gap-2 ${
                    (typeof window !== 'undefined' && window.location.pathname.startsWith('/services'))
                      ? 'bg-black text-white hover:bg-black hover:text-white'
                      : (!isAuthenticated ? 'text-white hover:bg-white hover:text-black' : 'text-black hover:bg-black hover:text-white')
                  }`}
                >
                  <Briefcase className="h-4 w-4" />
                  Services
                </Button>
              </Link>
              {/* Removed Post Project link as requested */}
              <Link href="/pricing">
                <Button
                  variant="ghost"
                  size="sm"
                  className={`flex items-center gap-2 ${
                    (typeof window !== 'undefined' && window.location.pathname.startsWith('/pricing'))
                      ? 'bg-black text-white hover:bg-black hover:text-white'
                      : (!isAuthenticated ? 'text-white hover:bg-white hover:text-black' : 'text-black hover:bg-black hover:text-white')
                  }`}
                >
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
                <Button
                  variant="ghost"
                  size="sm"
                  className={`flex items-center gap-2 ${
                    (typeof window !== 'undefined' && window.location.pathname.startsWith('/ideas'))
                      ? 'bg-black text-white hover:bg-black hover:text-white'
                      : (!isAuthenticated ? 'text-white hover:bg-white hover:text-black' : 'text-black hover:bg-black hover:text-white')
                  }`}
                >
                  <Zap className="h-4 w-4" />
                  Idea Spark
                </Button>
              </Link>
            </nav>
          )}
            
            {isAuthenticated && mounted && userRole === "DEVELOPER" && (
              <nav className="hidden md:flex items-center gap-4">
                <Link href="/services">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`flex items-center gap-2 ${
                      (typeof window !== 'undefined' && window.location.pathname.startsWith('/services'))
                        ? 'bg-black text-white hover:bg-black hover:text-white'
                        : (!isAuthenticated ? 'text-white hover:bg-white hover:text-black' : 'text-black hover:bg-black hover:text-white')
                    }`}
                  >
                    <FolderOpen className="h-4 w-4" />
                    Services
                  </Button>
                </Link>
                <Link href="/ideas">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`flex items-center gap-2 ${
                      (typeof window !== 'undefined' && window.location.pathname.startsWith('/ideas'))
                        ? 'bg-black text-white hover:bg-black hover:text-white'
                        : (!isAuthenticated ? 'text-white hover:bg-white hover:text-black' : 'text-black hover:bg-black hover:text-white')
                    }`}
                  >
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
                <Link href="/help" className="text-sm">Help</Link>
                <Link href="/auth/signin" className="text-sm">Log in</Link>
                <Link href="/auth/signup" className="inline-flex items-center h-9 px-4 rounded-full bg-white text-black text-sm">Sign up</Link>
              </div>
            )}

            {/* Authenticated right actions */}
            {isAuthenticated && (
              <div className="hidden md:flex items-center gap-6">
                <div className="relative">
                  <button
                    className="relative inline-flex items-center justify-center h-9 w-9 rounded-full hover:bg-white hover:text-black"
                    onClick={async () => {
                      const willOpen = !openNotif;
                      console.log('🔔 Bell icon clicked. Will open:', willOpen);
                      setOpenNotif(willOpen);
                      if (willOpen) {
                        console.log('🔔 Fetching notifications...');
                        try {
                          const res = await fetch(`/api/notifications?limit=10&_=${Date.now()}` , { 
                            cache: "no-store",
                            headers: {
                              'Cache-Control': 'no-cache, no-store, must-revalidate',
                              'Pragma': 'no-cache',
                              'Expires': '0'
                            }
                          });
                          console.log('🔔 Fetch response status:', res.status);
                          if (res.ok) {
                            const data = await res.json();
                            console.log('🔔 Notifications fetched:', data);
                            console.log('🔔 Items details:', data.items.map((item: any) => ({
                              id: item.id,
                              type: item.type,
                              read: item.read,
                              createdAt: item.createdAt,
                              payload: item.payload
                            })));
                            const items = data.items || [];
                            setItems(items);
                            setCursor(data.nextCursor || null);
                            // Fallback: if API unreadCount is missing/0 but we have unread items, compute locally
                            const localUnread = items.reduce((acc: number, it: any) => acc + (it.read ? 0 : 1), 0);
                            const serverUnread = typeof data.unreadCount === 'number' ? data.unreadCount : undefined;
                            setUnread(serverUnread && serverUnread > 0 ? serverUnread : localUnread);
                          } else {
                            console.error('🔔 Failed to fetch notifications:', res.status);
                          }
                        } catch (error) {
                          console.error('🔔 Fetch error:', error);
                        }
                      } else {
                        console.log('🔔 Closing notification dropdown');
                      }
                    }}
                  >
                    <Bell className="w-5 h-5" />
                    {unread > 0 && (
                      <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-red-600 text-white text-[10px] leading-4 text-center">
                        {unread}
                      </span>
                    )}
                  </button>
                  {openNotif && (
                    <>
                      {/* click-away overlay */}
                      <div className="fixed inset-0 z-40" onClick={() => setOpenNotif(false)} />
                      <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-auto bg-white border rounded-lg shadow-lg z-50">
                      <div className="flex items-center justify-between px-3 py-2 border-b">
                        <span className="text-sm font-medium">Notifications</span>
                        <button
                          className="text-xs underline"
                          onClick={async () => {
                            await fetch(`/api/notifications`, { method: 'POST', body: JSON.stringify({ action: 'read_all' }) });
                            setUnread(0);
                            setItems((prev) => prev.map((i) => ({ ...i, read: true })));
                          }}
                        >
                          Mark all as read
                        </button>
                      </div>
                      <ul className="divide-y">
                        {items.length === 0 && (
                          <li className="p-3 text-xs text-gray-500">No notifications</li>
                        )}
                        {items.map((n) => (
                          <li
                            key={n.id}
                            className="p-3 text-sm hover:bg-gray-50 cursor-pointer"
                            onClick={async () => {
                              if (!n.read) {
                                await fetch(`/api/notifications`, { method: 'POST', body: JSON.stringify({ action: 'read', ids: [n.id] }) });
                                setUnread((u) => Math.max(0, u - 1));
                                setItems((prev) => prev.map((i) => (i.id === n.id ? { ...i, read: true } : i)));
                              }
                              if (n.type === "quota.project_limit_reached") {
                                router.push("/pricing");
                              } else if (n.type === "assignment.manual_invite") {
                                // Navigate to dashboard with manual invitations filter
                                router.push("/dashboard-user?filter=MANUAL_INVITATIONS");
                              } else if (n.projectId) {
                                router.push(`/projects/${n.projectId}`);
                              }
                            }}
                          >
                            <div className="flex items-start gap-2">
                              <span className={`mt-1 h-2 w-2 rounded-full ${n.read ? 'bg-gray-300' : 'bg-blue-600'}`} />
                              <div className="flex-1">
                                <div className="font-medium text-gray-800">
                                  {n.type === "quota.project_limit_reached" 
                                    ? "Project Limit Reached" 
                                    : n.type === "assignment.invited"
                                    ? "New Project Assignment"
                                    : n.type === "assignment.manual_invite"
                                    ? "Manual Invitation Received"
                                    : n.type}
                                </div>
                                {n.type === "assignment.manual_invite" && (
                                  <>
                                    {n.payload?.clientMessage && (
                                      <div className="text-xs text-gray-600 italic">"{n.payload.clientMessage}"</div>
                                    )}
                                    {n.payload?.projectTitle && (
                                      <div className="text-xs text-gray-600">Project: {n.payload.projectTitle}</div>
                                    )}
                                    {n.payload?.clientName && (
                                      <div className="text-xs text-gray-500">From: {n.payload.clientName}</div>
                                    )}
                                    {n.payload?.budget && (
                                      <div className="text-xs text-green-600">Budget: {n.payload.budget}</div>
                                    )}
                                  </>
                                )}
                                {n.type !== "assignment.manual_invite" && n.payload?.message && (
                                  <div className="text-xs text-gray-600">{n.payload.message}</div>
                                )}
                                {n.type !== "assignment.manual_invite" && n.payload?.description && (
                                  <div className="text-xs text-gray-500 mt-1">{n.payload.description}</div>
                                )}
                                {n.type !== "assignment.manual_invite" && n.payload?.projectTitle && (
                                  <div className="text-xs text-gray-600">{n.payload.projectTitle}</div>
                                )}
                                <div className="text-[11px] text-gray-400">{formatDateStable(n.createdAt)}</div>
                              </div>
                            </div>
                          </li>
                        ))}
                        {cursor && (
                          <li className="p-2 text-center">
                            <button
                              className="text-xs underline"
                              onClick={async () => {
                                const res = await fetch(`/api/notifications?limit=10&cursor=${cursor}`);
                                if (res.ok) {
                                  const data = await res.json();
                                  setItems((prev) => [...prev, ...(data.items || [])]);
                                  setCursor(data.nextCursor || null);
                                }
                              }}
                            >
                              Load more
                            </button>
                          </li>
                        )}
                      </ul>
                      </div>
                    </>
                  )}
                </div>
                <Link href="/help" className="text-sm hover:bg-white hover:text-black px-3 py-1.5 rounded-full">Help</Link>
              </div>
            )}

            {/* User Dropdown - Only show if authenticated to current portal */}
            {isAuthenticated && user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10">
                      <AvatarImage 
                        src={userData?.photoUrl || user.image || undefined} 
                        alt={user.name || user.email || "User"} 
                      />
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
              <span className="opacity-80">Welcome back,</span>{" "}
              <span className="font-semibold text-white">{user.name || user.email || "there"}</span>
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
                  {/* Notifications Mobile */}
                  <div className="relative">
                    <button
                      className="flex items-center gap-2 py-2 text-gray-700 hover:text-black w-full text-left"
                      onClick={async () => {
                        const willOpen = !openNotif;
                        console.log('🔔 Bell icon clicked (mobile). Will open:', willOpen);
                        setOpenNotif(willOpen);
                        if (willOpen) {
                          console.log('🔔 Fetching notifications (mobile)...');
                          try {
                            const res = await fetch(`/api/notifications?limit=10&_=${Date.now()}` , { 
                              cache: "no-store",
                              headers: {
                                'Cache-Control': 'no-cache, no-store, must-revalidate',
                                'Pragma': 'no-cache',
                                'Expires': '0'
                              }
                            });
                            console.log('🔔 Fetch response status (mobile):', res.status);
                            if (res.ok) {
                              const data = await res.json();
                              console.log('🔔 Notifications data (mobile):', data);
                              setItems(data.items || []);
                              setCursor(data.nextCursor || null);
                              setUnread(data.unreadCount || 0);
                            }
                          } catch (error) {
                            console.error('🔔 Error fetching notifications (mobile):', error);
                          }
                        }
                      }}
                    >
                      <Bell className="h-4 w-4" />
                      <span>Notifications</span>
                      {unread > 0 && (
                        <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5 min-w-[20px] text-center">
                          {unread}
                        </span>
                      )}
                    </button>
                    
                    {/* Mobile Notifications Dropdown */}
                    {openNotif && (
                      <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
                        <div className="p-3 border-b border-gray-100">
                          <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-gray-900">Notifications</h3>
                            <button
                              onClick={() => setOpenNotif(false)}
                              className="text-gray-400 hover:text-gray-600"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                        <div className="max-h-80 overflow-y-auto">
                          {items.length === 0 ? (
                            <div className="p-4 text-center text-gray-500 text-sm">
                              No notifications yet
                            </div>
                          ) : (
                            <ul className="divide-y divide-gray-100">
                              {items.map((n) => (
                                <li key={n.id} className={`p-3 hover:bg-gray-50 ${!n.read ? 'bg-blue-50' : ''}`}>
                                  <div className="flex items-start gap-3">
                                    <div className="flex-shrink-0">
                                      <div className={`w-2 h-2 rounded-full ${!n.read ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="text-sm font-medium text-gray-900">
                                        {n.type === "assignment.auto_invite"
                                          ? "Auto Invitation Received"
                                          : n.type === "assignment.manual_invite"
                                          ? "Manual Invitation Received"
                                          : n.type}
                                      </div>
                                      {n.type === "assignment.manual_invite" && (
                                        <>
                                          {n.payload?.clientMessage && (
                                            <div className="text-xs text-gray-600 italic mt-1">"{n.payload.clientMessage}"</div>
                                          )}
                                          {n.payload?.projectTitle && (
                                            <div className="text-xs text-gray-600 mt-1">Project: {n.payload.projectTitle}</div>
                                          )}
                                          {n.payload?.clientName && (
                                            <div className="text-xs text-gray-500 mt-1">From: {n.payload.clientName}</div>
                                          )}
                                          {n.payload?.budget && (
                                            <div className="text-xs text-green-600 mt-1">Budget: {n.payload.budget}</div>
                                          )}
                                        </>
                                      )}
                                      {n.type !== "assignment.manual_invite" && n.payload?.message && (
                                        <div className="text-xs text-gray-600 mt-1">{n.payload.message}</div>
                                      )}
                                      {n.type !== "assignment.manual_invite" && n.payload?.description && (
                                        <div className="text-xs text-gray-500 mt-1">{n.payload.description}</div>
                                      )}
                                      {n.type !== "assignment.manual_invite" && n.payload?.projectTitle && (
                                        <div className="text-xs text-gray-600 mt-1">{n.payload.projectTitle}</div>
                                      )}
                                      <div className="text-[11px] text-gray-400 mt-1">{formatDateStable(n.createdAt)}</div>
                                    </div>
                                  </div>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  
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
                  {/* Notifications Mobile */}
                  <div className="relative">
                    <button
                      className="flex items-center gap-2 py-2 text-gray-700 hover:text-black w-full text-left"
                      onClick={async () => {
                        const willOpen = !openNotif;
                        console.log('🔔 Bell icon clicked (mobile). Will open:', willOpen);
                        setOpenNotif(willOpen);
                        if (willOpen) {
                          console.log('🔔 Fetching notifications (mobile)...');
                          try {
                            const res = await fetch(`/api/notifications?limit=10&_=${Date.now()}` , { 
                              cache: "no-store",
                              headers: {
                                'Cache-Control': 'no-cache, no-store, must-revalidate',
                                'Pragma': 'no-cache',
                                'Expires': '0'
                              }
                            });
                            console.log('🔔 Fetch response status (mobile):', res.status);
                            if (res.ok) {
                              const data = await res.json();
                              console.log('🔔 Notifications data (mobile):', data);
                              setItems(data.items || []);
                              setCursor(data.nextCursor || null);
                              setUnread(data.unreadCount || 0);
                            }
                          } catch (error) {
                            console.error('🔔 Error fetching notifications (mobile):', error);
                          }
                        }
                      }}
                    >
                      <Bell className="h-4 w-4" />
                      <span>Notifications</span>
                      {unread > 0 && (
                        <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5 min-w-[20px] text-center">
                          {unread}
                        </span>
                      )}
                    </button>
                    
                    {/* Mobile Notifications Dropdown */}
                    {openNotif && (
                      <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
                        <div className="p-3 border-b border-gray-100">
                          <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-gray-900">Notifications</h3>
                            <button
                              onClick={() => setOpenNotif(false)}
                              className="text-gray-400 hover:text-gray-600"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                        <div className="max-h-80 overflow-y-auto">
                          {items.length === 0 ? (
                            <div className="p-4 text-center text-gray-500 text-sm">
                              No notifications yet
                            </div>
                          ) : (
                            <ul className="divide-y divide-gray-100">
                              {items.map((n) => (
                                <li key={n.id} className={`p-3 hover:bg-gray-50 ${!n.read ? 'bg-blue-50' : ''}`}>
                                  <div className="flex items-start gap-3">
                                    <div className="flex-shrink-0">
                                      <div className={`w-2 h-2 rounded-full ${!n.read ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="text-sm font-medium text-gray-900">
                                        {n.type === "assignment.auto_invite"
                                          ? "Auto Invitation Received"
                                          : n.type === "assignment.manual_invite"
                                          ? "Manual Invitation Received"
                                          : n.type}
                                      </div>
                                      {n.type === "assignment.manual_invite" && (
                                        <>
                                          {n.payload?.clientMessage && (
                                            <div className="text-xs text-gray-600 italic mt-1">"{n.payload.clientMessage}"</div>
                                          )}
                                          {n.payload?.projectTitle && (
                                            <div className="text-xs text-gray-600 mt-1">Project: {n.payload.projectTitle}</div>
                                          )}
                                          {n.payload?.clientName && (
                                            <div className="text-xs text-gray-500 mt-1">From: {n.payload.clientName}</div>
                                          )}
                                          {n.payload?.budget && (
                                            <div className="text-xs text-green-600 mt-1">Budget: {n.payload.budget}</div>
                                          )}
                                        </>
                                      )}
                                      {n.type !== "assignment.manual_invite" && n.payload?.message && (
                                        <div className="text-xs text-gray-600 mt-1">{n.payload.message}</div>
                                      )}
                                      {n.type !== "assignment.manual_invite" && n.payload?.description && (
                                        <div className="text-xs text-gray-500 mt-1">{n.payload.description}</div>
                                      )}
                                      {n.type !== "assignment.manual_invite" && n.payload?.projectTitle && (
                                        <div className="text-xs text-gray-600 mt-1">{n.payload.projectTitle}</div>
                                      )}
                                      <div className="text-[11px] text-gray-400 mt-1">{formatDateStable(n.createdAt)}</div>
                                    </div>
                                  </div>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <Link href="/services" className="block py-2 text-gray-700 hover:text-black">
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4" />
                      Services
                    </div>
                  </Link>
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
