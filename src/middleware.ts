import { NextResponse, type NextRequest } from "next/server";

import { SESSION_COOKIE_NAME } from "@/server/auth/constants";

export function middleware(request: NextRequest): NextResponse {
  if (!request.cookies.has(SESSION_COOKIE_NAME)) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("returnTo", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/data/:path*", "/report/:path*"],
};
