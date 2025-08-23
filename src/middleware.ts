import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Các route cần authentication
  const protectedRoutes = ["/"];

  // Các route không cần check profile completion
  const publicRoutes = ["/auth/signin", "/auth/signup", "/complete-profile"];

  // Kiểm tra xem route hiện tại có cần authentication không
  const isProtectedRoute = protectedRoutes.some((route) => pathname === route);
  const isPublicRoute = publicRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Lấy token từ cookie
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // Nếu là protected route và chưa đăng nhập
  if (isProtectedRoute && !token) {
    const url = new URL("/auth/signin", request.url);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  // // Nếu đã đăng nhập nhưng chưa hoàn thành profile và không phải public route
  // if (token && !isPublicRoute && !token.isProfileCompleted) {
  //   return NextResponse.redirect(new URL("/complete-profile", request.url));
  // }

  // Nếu đã đăng nhập và truy cập trang đăng nhập
  if (token && pathname.startsWith("/auth/")) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Nếu đã hoàn thành profile và truy cập complete-profile
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
