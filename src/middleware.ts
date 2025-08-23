import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Routes that require authentication
  const protectedRoutes = ["/"];

  // Routes that don't require profile completion check
  const publicRoutes = ["/auth/signin", "/auth/signup", "/complete-profile"];

  // Check if current route requires authentication
  const isProtectedRoute = protectedRoutes.some((route) => pathname === route);
  const isPublicRoute = publicRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Get token from cookie
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // If protected route and not logged in
  if (isProtectedRoute && !token) {
    const url = new URL("/auth/signin", request.url);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  // // If logged in but profile not completed and not public route
  // if (token && !isPublicRoute && !token.isProfileCompleted) {
  //   return NextResponse.redirect(new URL("/complete-profile", request.url));
  // }

  // If logged in and accessing login page
  if (token && pathname.startsWith("/auth/")) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // If profile completed and accessing complete-profile
  if (
    token &&
    token.isProfileCompleted &&
    pathname.startsWith("/complete-profile")
  ) {
    return NextResponse.redirect(new URL("/", request.url));
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
