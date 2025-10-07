import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// ⚠️ CẢNH BÁO CHO DEVELOPER KHÁC ⚠️
// Thằng chủ dự án này keo lắm nó méo trả đúng giá mà kiếm anh em Việt Nam mình để ép giá vì các nước khác không lấy giá rẻ vậy
// Làm với nó tầm 1, 2 dự án thôi anh em, nó ép cho làm điên luôn đấy, làm ăn bát nháo lắm
// Dự án này nó cho 4tr, 1 mình tôi làm từ đầu đến cuối, tích hợp tất cả, anh em làm với nó deal giá cẩn thận vào
// Đừng nghe nó hứa có nhiều dự án, đừng mất giá trị của mình, bye ae chúc ae thành công

// Define public routes that don't require authentication
const PUBLIC_ROUTES = [
  "/", "/pricing", "/about", "/blog", "/ceo-letter", "/help",
  "/auth/signin", "/auth/signup", 
  "/role-selection", "/ideas", 
  "/how-clevrs-work", "/newsroom", "/investors"
];

import {
  adminRoutes as adminRoutesConfig,
  userRoutes,
  publicRoutes as publicRoutesConfig,
} from "./src/core/config/routes";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const DEBUG_MW = process.env.NEXT_PUBLIC_DEBUG_MIDDLEWARE === "true";

  // Hard bypass for onboarding pages to avoid any potential redirect loops
  if (pathname.startsWith("/onboarding/freelancer")) {
    return NextResponse.next();
  }

  // Skip auth check for API routes, static files, and other non-page resources
  if (
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/webhooks") ||
    pathname.startsWith("/api/ideas") ||
    pathname.startsWith("/api/skills") ||
    pathname.startsWith("/api/blog") ||
    pathname.startsWith("/api/projects") ||
    pathname.startsWith("/api/reviews") ||
    pathname.startsWith("/api/user") ||
    pathname.startsWith("/api/admin") ||
    pathname.startsWith("/api/candidates") ||
    pathname.startsWith("/api/billing") ||
    pathname.startsWith("/api/paypal") ||
    pathname.startsWith("/api/cron") ||
    pathname.startsWith("/api/revalidate") ||
    pathname.startsWith("/api/developer") ||
    pathname.startsWith("/api/test") ||
    pathname.startsWith("/_next") || 
    pathname.startsWith("/images") ||
    pathname.includes(".") // Skip files with extensions
  ) {
    return NextResponse.next();
  }

  // Check if the route is public and bypass immediately to avoid any work
  const isPublic = PUBLIC_ROUTES.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
  if (isPublic) {
    return NextResponse.next();
  }

  // Get token from cookie first
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
    secureCookie: process.env.NODE_ENV === "production",
  });

  if (DEBUG_MW) {
    console.log("🔍 Middleware - Pathname:", pathname, "Token:", !!token, "Role:", token?.role, "AdminStatus:", token?.adminApprovalStatus);
  }

  // ===== AUTHENTICATION CHECKS =====
  
  // Not authenticated and trying to access protected route -> redirect to login
  if (!token) {
    if (DEBUG_MW) console.log("🔍 Unauthenticated user accessing protected route, redirecting to signin");
    const url = request.nextUrl.clone();
    url.pathname = "/auth/signin";
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  // Authenticated trying to access auth pages -> redirect to appropriate dashboard
  if (token && (pathname.startsWith("/auth/signin") || pathname.startsWith("/auth/signup"))) {
    if (DEBUG_MW) console.log("🔍 Authenticated user on auth page, redirecting to appropriate dashboard");
    if (token.role === "ADMIN") {
      return NextResponse.redirect(new URL("/admin", request.url));
    } else if (token.role === "CLIENT") {
      return NextResponse.redirect(new URL("/client-dashboard", request.url));
    } else if (token.role === "DEVELOPER") {
      if (token?.adminApprovalStatus === "approved") {
        return NextResponse.redirect(new URL("/dashboard-user", request.url));
      } else {
        return NextResponse.redirect(new URL("/onboarding/freelancer/pending-approval", request.url));
      }
    }
    return NextResponse.redirect(new URL("/", request.url));
  }

  // ===== ADMIN ROUTES =====
  
  if (pathname.startsWith("/admin")) {
    if (DEBUG_MW) console.log("🔍 Admin route detected");
    if (!token) {
      if (DEBUG_MW) console.log("🔍 No token, redirecting to signin");
      return NextResponse.redirect(new URL("/auth/signin", request.url));
    }
    if (token?.role !== "ADMIN") {
      if (DEBUG_MW) console.log("🔍 User is not admin, redirecting to home");
      return NextResponse.redirect(new URL("/", request.url));
    }
    if (DEBUG_MW) console.log("🔍 Admin access granted");
    return NextResponse.next();
  }

  // ===== PROTECTED ROUTES =====
  
  // Already handled by the !token && !isPublic check above

  // ===== AUTHENTICATED USER REDIRECTS =====
  
  if (token) {
    if (DEBUG_MW) console.log("🔍 Authenticated user detected");
    
    // If user has no role, redirect to role selection
    if (!token?.role) {
      if (DEBUG_MW) console.log("🔍 User has no role, redirecting to role selection");
      if (pathname !== "/role-selection") {
        return NextResponse.redirect(new URL("/role-selection", request.url));
      }
      return NextResponse.next();
    }
    
    // If user is on home page, redirect based on role and status
    if (pathname === "/") {
      if (DEBUG_MW) console.log("🔍 Home page redirect for role:", token.role);
      
      if (token.role === "ADMIN") {
        if (DEBUG_MW) console.log("🔍 Redirecting ADMIN to /admin");
        return NextResponse.redirect(new URL("/admin", request.url));
      } else if (token.role === "CLIENT") {
        if (DEBUG_MW) console.log("🔍 Redirecting CLIENT to /client-dashboard");
        return NextResponse.redirect(new URL("/client-dashboard", request.url));
      } else if (token.role === "DEVELOPER") {
        // Developer logic
        if (!token?.isProfileCompleted) {
          if (DEBUG_MW) console.log("🔍 Developer profile not completed, redirecting to onboarding");
          return NextResponse.redirect(new URL("/onboarding/freelancer/basic-information", request.url));
        }
        
        const approvalStatus = token?.adminApprovalStatus;
        if (DEBUG_MW) console.log("🔍 Developer approval status:", approvalStatus);
        
        if (approvalStatus === "pending") {
          if (DEBUG_MW) console.log("🔍 Developer pending approval, redirecting to pending page");
          return NextResponse.redirect(new URL("/onboarding/freelancer/pending-approval", request.url));
        }
        
        if (approvalStatus === "approved") {
          if (DEBUG_MW) console.log("🔍 Developer approved, redirecting to dashboard-user");
          return NextResponse.redirect(new URL("/dashboard-user", request.url));
        }
        
        // Default case: draft, rejected, or unknown status
        if (DEBUG_MW) console.log("🔍 Developer default case (status:", approvalStatus, "), redirecting to pending page");
        return NextResponse.redirect(new URL("/onboarding/freelancer/pending-approval", request.url));
      }
    }
    
    // For non-home pages, let the request pass through to server-side checks
    if (DEBUG_MW) console.log("🔍 Authenticated user on non-home page, allowing through");
  }

  // ===== DEFAULT: ALLOW THROUGH =====
  return NextResponse.next();
}

// Restrict middleware only to protected route groups to minimize overhead
export const config = {
  matcher: [
    "/admin/:path*",
    "/client-dashboard/:path*",
    "/dashboard-user/:path*",
    "/my-projects/:path*",
    "/projects/:path*",
    "/inbox/:path*",
    "/favorites/:path*",
    "/profile/:path*",
    "/services/:path*",
    "/onboarding/:path*",
    "/role-selection",
    "/role-selection/:path*",
  ],
};