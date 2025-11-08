import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// Define public routes that don't require authentication
const PUBLIC_ROUTES = [
  "/", "/pricing", "/about", "/blog", "/ceo-letter", "/help",
  "/auth/signin", "/auth/signup", "/auth/setup-password",
  "/role-selection", "/ideas", 
  "/how-clevrs-work", "/newsroom", "/investors",
  "/services"
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

  // Get token from cookie first (need to check token before checking public routes)
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
    secureCookie: process.env.NODE_ENV === "production",
  });

  // Check if the route is public
  const isPublic = PUBLIC_ROUTES.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );

  // Force authenticated users without a password to complete setup
  if (token && token.hasPassword === false) {
    const allowedPasswordSetupPages = ["/auth/setup-password"];
    const isPasswordSetupPage = allowedPasswordSetupPages.some(
      (page) => pathname === page || pathname.startsWith(page + "/")
    );

    if (!isPasswordSetupPage) {
      if (DEBUG_MW) console.log("🔍 Authenticated user without password, redirecting to setup-password");
      return NextResponse.redirect(new URL("/auth/setup-password", request.url));
    }
  }
  
  // If user is authenticated but has no role, they must select role first
  // Block access to public pages (except role-selection, auth pages, and services)
  if (token && !token?.role && isPublic) {
    const allowedPagesWithoutRole = [
      "/role-selection",
      "/auth/signin",
      "/auth/signup",
      "/auth/setup-password",
      "/services",
    ];
    const isAllowedPage = allowedPagesWithoutRole.some(
      (page) => pathname === page || pathname.startsWith(page + "/")
    );
    if (!isAllowedPage) {
      if (DEBUG_MW) console.log("🔍 Authenticated user without role trying to access public page, redirecting to role-selection");
      return NextResponse.redirect(new URL("/role-selection", request.url));
    }
  }
  
  // Allow public routes if user is not authenticated OR has a role
  if (isPublic && (!token || token?.role)) {
    return NextResponse.next();
  }
  
  // If public route but user has no role and it's not an allowed page, already redirected above

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

  // Allow setup-password page for authenticated users (they need to set password)
  if (token && pathname.startsWith("/auth/setup-password")) {
    if (DEBUG_MW) console.log("🔍 Authenticated user accessing setup-password, allowing");
    return NextResponse.next();
  }

  // Authenticated trying to access auth pages -> redirect to appropriate dashboard
  if (token && (pathname.startsWith("/auth/signin") || pathname.startsWith("/auth/signup"))) {
    if (DEBUG_MW) console.log("🔍 Authenticated user on auth page, redirecting to appropriate dashboard");
    if (token.role === "ADMIN") {
      return NextResponse.redirect(new URL("/admin", request.url));
    } else if (token.role === "CLIENT") {
      // Redirect CLIENT to pricing page - it will check subscription and redirect to dashboard if needed
      return NextResponse.redirect(new URL("/pricing", request.url));
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
    
    // If user has no role, force them to select role first
    // Only allow access to role-selection, auth pages, and setup-password
    if (!token?.role) {
      if (DEBUG_MW) console.log("🔍 User has no role, checking if they can access current page");
      
      // Allow only these pages when user has no role:
      const allowedPagesWithoutRole = [
        "/role-selection",
        "/auth/signin",
        "/auth/signup",
        "/auth/setup-password",
      ];
      
      const isAllowedPage = allowedPagesWithoutRole.some(
        (page) => pathname === page || pathname.startsWith(page + "/")
      );
      
      if (!isAllowedPage) {
        if (DEBUG_MW) console.log("🔍 User has no role, redirecting to role selection from:", pathname);
        return NextResponse.redirect(new URL("/role-selection", request.url));
      }
      
      if (DEBUG_MW) console.log("🔍 User has no role but accessing allowed page, allowing");
      return NextResponse.next();
    }
    
    // Allow /pricing page for CLIENT users (they need to select a plan)
    if (pathname === "/pricing" && token.role === "CLIENT") {
      if (DEBUG_MW) console.log("🔍 CLIENT accessing /pricing page, allowing");
      return NextResponse.next();
    }
    
    // If user is on home page, redirect based on role and status
    if (pathname === "/") {
      if (DEBUG_MW) console.log("🔍 Home page redirect for role:", token.role);
      
      if (token.role === "ADMIN") {
        if (DEBUG_MW) console.log("🔍 Redirecting ADMIN to /admin");
        return NextResponse.redirect(new URL("/admin", request.url));
      } else if (token.role === "CLIENT") {
        // Redirect CLIENT to pricing page - it will check subscription and redirect to dashboard if needed
        if (DEBUG_MW) console.log("🔍 Redirecting CLIENT from home page to /pricing");
        // Let the /pricing page handle the subscription check, redirect to dashboard from there
        return NextResponse.redirect(new URL("/pricing", request.url));
      } else if (token.role === "DEVELOPER") {
        // Developer logic
        if (!token?.isProfileCompleted) {
          if (DEBUG_MW) console.log("🔍 Developer profile not completed, redirecting to onboarding");
          return NextResponse.redirect(new URL("/onboarding/freelancer/basic-information", request.url));
        }
        
        const approvalStatus = token?.adminApprovalStatus;
        if (DEBUG_MW) console.log("🔍 Developer approval status:", approvalStatus);
        
        // All developers (pending, approved, draft, rejected) go to dashboard
        // Dashboard will handle showing appropriate message based on approval status
        if (DEBUG_MW) console.log("🔍 Developer redirecting to dashboard-user (status:", approvalStatus, ")");
        return NextResponse.redirect(new URL("/dashboard-user", request.url));
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
    "/services/create/:path*",
    "/onboarding/:path*",
    "/role-selection",
    "/role-selection/:path*",
    "/auth/setup-password",
    "/", // Include home page in matcher
  ],
};