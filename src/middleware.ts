import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// Define public routes that don't require authentication
const PUBLIC_ROUTES = [
  "/", "/pricing", "/about", "/blog", "/ceo-letter", "/help",
  "/auth/signin", "/auth/signup", 
  "/role-selection"
];

import {
  adminRoutes as adminRoutesConfig,
  userRoutes,
  publicRoutes as publicRoutesConfig,
} from "./core/config/routes";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Hard bypass for onboarding pages to avoid any potential redirect loops
  if (pathname.startsWith("/onboarding/freelancer")) {
    return NextResponse.next();
  }

  // Skip auth check for API routes, static files, and other non-page resources
  if (
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/webhooks") ||
    pathname.startsWith("/_next") || 
    pathname.startsWith("/images") ||
    pathname.includes(".") // Skip files with extensions
  ) {
    return NextResponse.next();
  }

  // Check if the route is public
  const isPublic = PUBLIC_ROUTES.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );

  // Get token from cookie first
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
    secureCookie: process.env.NODE_ENV === "production",
  });

  console.log("🔍 Middleware - Pathname:", pathname, "Token:", !!token, "Role:", token?.role, "AdminStatus:", token?.adminApprovalStatus);
  console.log("🔍 Middleware - Token details:", {
    sub: token?.sub,
    email: token?.email,
    role: token?.role,
    isProfileCompleted: token?.isProfileCompleted,
    adminApprovalStatus: token?.adminApprovalStatus
  });

  // ===== AUTHENTICATION CHECKS =====
  
  // Not authenticated and trying to access protected route -> redirect to login
  if (!token && !isPublic) {
    console.log("🔍 Unauthenticated user accessing protected route, redirecting to signin");
    const url = request.nextUrl.clone();
    url.pathname = "/auth/signin";
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  // Authenticated trying to access auth pages -> redirect to appropriate dashboard
  if (token && (pathname.startsWith("/auth/signin") || pathname.startsWith("/auth/signup"))) {
    console.log("🔍 Authenticated user on auth page, redirecting to appropriate dashboard");
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
    console.log("🔍 Admin route detected");
    if (!token) {
      console.log("🔍 No token, redirecting to signin");
      return NextResponse.redirect(new URL("/auth/signin", request.url));
    }
    if (token?.role !== "ADMIN") {
      console.log("🔍 User is not admin, redirecting to home");
      return NextResponse.redirect(new URL("/", request.url));
    }
    console.log("🔍 Admin access granted");
    return NextResponse.next();
  }

  // ===== PROTECTED ROUTES =====
  
  // Already handled by the !token && !isPublic check above

  // ===== AUTHENTICATED USER REDIRECTS =====
  
  if (token) {
    console.log("🔍 Authenticated user detected");
    
    // If user has no role, redirect to role selection
    if (!token?.role) {
      console.log("🔍 User has no role, redirecting to role selection");
      if (pathname !== "/role-selection") {
        return NextResponse.redirect(new URL("/role-selection", request.url));
      }
      return NextResponse.next();
    }
    
    // If user is on home page, redirect based on role and status
    if (pathname === "/") {
      console.log("🔍 Home page redirect for role:", token.role);
      
      if (token.role === "ADMIN") {
        console.log("🔍 Redirecting ADMIN to /admin");
        return NextResponse.redirect(new URL("/admin", request.url));
      } else if (token.role === "CLIENT") {
        console.log("🔍 Redirecting CLIENT to /client-dashboard");
        return NextResponse.redirect(new URL("/client-dashboard", request.url));
      } else if (token.role === "DEVELOPER") {
        // Developer logic
        if (!token?.isProfileCompleted) {
          console.log("🔍 Developer profile not completed, redirecting to onboarding");
          return NextResponse.redirect(new URL("/onboarding/freelancer/basic-information", request.url));
        }
        
        const approvalStatus = token?.adminApprovalStatus;
        console.log("🔍 Developer approval status:", approvalStatus);
        
        if (approvalStatus === "pending") {
          console.log("🔍 Developer pending approval, redirecting to pending page");
          return NextResponse.redirect(new URL("/onboarding/freelancer/pending-approval", request.url));
        }
        
        if (approvalStatus === "approved") {
          console.log("🔍 Developer approved, redirecting to dashboard-user");
          return NextResponse.redirect(new URL("/dashboard-user", request.url));
        }
        
        // Default case: draft, rejected, or unknown status
        console.log("🔍 Developer default case (status:", approvalStatus, "), redirecting to pending page");
        return NextResponse.redirect(new URL("/onboarding/freelancer/pending-approval", request.url));
      }
    }
    
    // For non-home pages, let the request pass through to server-side checks
    console.log("🔍 Authenticated user on non-home page, allowing through");
  }

  // ===== DEFAULT: ALLOW THROUGH =====
  
  console.log("🔍 Default case - allowing through");
  return NextResponse.next();
}

// More specific matcher that properly excludes auth routes
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|images|api/auth|api/webhooks).*)",
  ],
};