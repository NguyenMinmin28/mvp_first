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

  // Routes that require authentication
  const protectedRoutes = [userRoutes.HOME, userRoutes.PROFILE];

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

    // If accessing admin login page with token, redirect to admin dashboard
    if (isAdminPublicRoute && token) {
      return NextResponse.redirect(new URL("/admin", request.url));
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

  // If logged in and accessing login page
  if (token && pathname.startsWith("/auth/")) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // If user has token but no role and is not on role-selection page, redirect to role-selection
  if (token && !token.role && pathname !== "/role-selection") {
    return NextResponse.redirect(new URL("/role-selection", request.url));
  }

  // If user has role and isProfileCompleted and is on role-selection page, redirect to home
  if (token && token.role && token.isProfileCompleted && pathname === "/role-selection") {
    return NextResponse.next();
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
