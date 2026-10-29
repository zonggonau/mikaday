import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session-token";

// Optimistic check only: every admin page and Server Action re-verifies with requireAdmin().
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isLogin = pathname === "/admin/login";
  const email = await verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value);

  if (!email && !isLogin) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }
  if (email && isLogin) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
