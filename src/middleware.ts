import { NextRequest, NextResponse } from "next/server";

const sessionCookieName = "nk_session";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isAppRoute = pathname.startsWith("/dashboard") ||
    pathname.startsWith("/customers") ||
    pathname.startsWith("/appointments") ||
    pathname.startsWith("/campaigns") ||
    pathname.startsWith("/staff") ||
    pathname.startsWith("/services") ||
    pathname.startsWith("/sales") ||
    pathname.startsWith("/settings");

  if (!isAppRoute) {
    return NextResponse.next();
  }

  const hasSession = request.cookies.get(sessionCookieName)?.value;
  if (hasSession) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("next", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/customers/:path*",
    "/appointments/:path*",
    "/campaigns/:path*",
    "/staff/:path*",
    "/services/:path*",
    "/sales/:path*",
    "/settings/:path*",
  ],
};
