import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import {
  adminRoutes as adminRoutesConfig,
  userRoutes,
  publicRoutes as publicRoutesConfig,
} from "./core/config/routes";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Get token from cookie
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  console.log("🔍 Middleware - Pathname:", pathname, "Token:", !!token, "Role:", token?.role, "URL:", request.url);

  // Routes that require authentication (home is now public)
  const protectedRoutes = [userRoutes.PROFILE];

  // Routes that don't require profile completion check
  const publicRoutes = [
    userRoutes.SIGNIN,
    userRoutes.SIGNUP,
    userRoutes.PROFILE,
    "/role-selection", // Add role-selection to public routes
  ];

  // Check if current route requires authentication
  const isProtectedRoute = protectedRoutes.some((route: any) => pathname === route);
  const isPublicRoute = publicRoutes.some((route: any) =>
    pathname.startsWith(route)
  );
  const isAdminRoute = pathname.startsWith("/admin"); // Simplified admin route check

  // Handle admin routes
  if (isAdminRoute) {
    console.log("🔍 Middleware - Admin route detected");
    // For admin routes, check authentication and role
    if (!token) {
      console.log("🔍 Middleware - No token, redirecting to signin");
      return NextResponse.redirect(new URL("/auth/signin", request.url));
    }

    if (token?.role !== "ADMIN") {
      console.log("🔍 Middleware - User is not admin, redirecting to home");
      // Redirect non-admin users to home page instead of creating loops
      return NextResponse.redirect(new URL("/", request.url));
    }

    console.log("🔍 Middleware - Admin access granted");
    return NextResponse.next();
  }

  // If protected route and not logged in
  if (isProtectedRoute && !token) {
    const url = new URL("/auth/signin", request.url);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  // If logged in and accessing user auth pages, redirect based on role
  if (token && pathname.startsWith("/auth/")) {
    console.log("🔍 Middleware - Auth page with token, role:", token?.role);
    // Redirect authenticated users away from auth pages based on their role
    if (token?.role === "ADMIN") {
      console.log("🔍 Middleware - Admin user on auth page, redirecting to admin");
      return NextResponse.redirect(new URL("/admin", request.url));
    } else if (token?.role === "CLIENT") {
      return NextResponse.redirect(new URL("/client-dashboard", request.url));
    } else if (token?.role === "DEVELOPER") {
      return NextResponse.redirect(new URL("/inbox", request.url));
    } else {
      return NextResponse.redirect(new URL("/role-selection", request.url));
    }
  }

  // If user has token but no role and is not on role-selection page, redirect to role-selection
  // BUT EXCLUDE ADMIN ROUTES FROM THIS LOGIC
  if (token && !token?.role && pathname !== "/role-selection" && !pathname.startsWith("/admin/")) {
    return NextResponse.redirect(new URL("/role-selection", request.url));
  }

  // If user already has a role and is on role-selection, redirect based on role
  if (token && token?.role && pathname === "/role-selection") {
    // Only redirect if user has completed profile
    if (token?.isProfileCompleted) {
      if (token?.role === "CLIENT") {
        return NextResponse.redirect(new URL("/client-dashboard", request.url));
      } else if (token?.role === "DEVELOPER") {
        return NextResponse.redirect(new URL("/inbox", request.url));
      } else if (token?.role === "ADMIN") {
        return NextResponse.redirect(new URL("/admin", request.url));
      } else {
        return NextResponse.redirect(new URL("/", request.url));
      }
    }
    // If user has role but profile not completed, allow access to role-selection
    return NextResponse.next();
  }

  // Handle portal-specific redirects for authenticated users on home page
  if (token && token?.role && pathname === "/") {
    // Only redirect if user has completed profile
    if (token?.isProfileCompleted) {
      if (token?.role === "CLIENT") {
        return NextResponse.redirect(new URL("/client-dashboard", request.url));
      } else if (token?.role === "DEVELOPER") {
        return NextResponse.redirect(new URL("/inbox", request.url));
      } else if (token?.role === "ADMIN") {
        return NextResponse.redirect(new URL("/admin", request.url));
      }
    } else {
      // User has role but profile not completed, redirect to role-selection
      return NextResponse.redirect(new URL("/role-selection", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
