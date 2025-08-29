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

  // Routes that require authentication (home is now public)
  const protectedRoutes = [userRoutes.PROFILE];

  // Routes that don't require profile completion check
  const publicRoutes = [
    userRoutes.SIGNIN,
    userRoutes.SIGNUP,
    userRoutes.PROFILE,
    "/role-selection", // Add role-selection to public routes
  ];

  // Admin routes
  const adminRoutes = Object.values(adminRoutesConfig);
  const adminPublicRoutes = ["/admin/login"];

  // Check if current route requires authentication
  const isProtectedRoute = protectedRoutes.some((route) => pathname === route);
  const isPublicRoute = publicRoutes.some((route) =>
    pathname.startsWith(route)
  );
  const isAdminRoute = adminRoutes.some((route) => pathname.startsWith(route));
  const isAdminPublicRoute = adminPublicRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Get token from cookie
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // Handle admin routes
  if (isAdminRoute) {
    // If accessing admin login page without token, allow access
    if (isAdminPublicRoute && !token) {
      return NextResponse.next();
    }

    // If accessing admin login page with token, check if user is admin
    if (isAdminPublicRoute && token) {
      if (token.role === "ADMIN") {
        return NextResponse.redirect(new URL("/admin", request.url));
      } else {
        // Non-admin user trying to access admin login, redirect to appropriate dashboard
        if (token.role === "CLIENT") {
          return NextResponse.redirect(new URL("/client-dashboard", request.url));
        } else if (token.role === "DEVELOPER") {
          return NextResponse.redirect(new URL("/inbox", request.url));
        } else {
          return NextResponse.redirect(new URL("/", request.url));
        }
      }
    }

    // If accessing other admin routes without token, redirect to admin login
    if (!token) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }

    // If accessing admin route with token, check if user is admin
    if (token.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/", request.url));
    }

    return NextResponse.next();
  }

  // If protected route and not logged in
  if (isProtectedRoute && !token) {
    const url = new URL("/auth/signin", request.url);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  // If logged in and accessing auth pages (but not admin login), redirect based on role
  if (token && pathname.startsWith("/auth/") && !pathname.startsWith("/admin/")) {
    // Redirect authenticated users away from auth pages based on their role
    if (token.role === "ADMIN") {
      return NextResponse.redirect(new URL("/admin", request.url));
    } else if (token.role === "CLIENT") {
      return NextResponse.redirect(new URL("/client-dashboard", request.url));
    } else if (token.role === "DEVELOPER") {
      return NextResponse.redirect(new URL("/inbox", request.url));
    } else {
      return NextResponse.redirect(new URL("/role-selection", request.url));
    }
  }

  // If user has token but no role and is not on role-selection page, redirect to role-selection
  if (token && !token.role && pathname !== "/role-selection") {
    return NextResponse.redirect(new URL("/role-selection", request.url));
  }

  // If user already has a role and is on role-selection, redirect based on role
  if (token && token.role && pathname === "/role-selection") {
    // Only redirect if user has completed profile
    if (token.isProfileCompleted) {
      if (token.role === "CLIENT") {
        return NextResponse.redirect(new URL("/client-dashboard", request.url));
      } else if (token.role === "DEVELOPER") {
        return NextResponse.redirect(new URL("/inbox", request.url));
      } else if (token.role === "ADMIN") {
        return NextResponse.redirect(new URL("/admin", request.url));
      } else {
        return NextResponse.redirect(new URL("/", request.url));
      }
    }
    // If user has role but profile not completed, allow access to role-selection
    return NextResponse.next();
  }

  // Handle portal-specific redirects for authenticated users on home page
  if (token && token.role && pathname === "/") {
    // Only redirect if user has completed profile
    if (token.isProfileCompleted) {
      if (token.role === "CLIENT") {
        return NextResponse.redirect(new URL("/client-dashboard", request.url));
      } else if (token.role === "DEVELOPER") {
        return NextResponse.redirect(new URL("/inbox", request.url));
      } else if (token.role === "ADMIN") {
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
