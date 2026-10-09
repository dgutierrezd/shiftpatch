import { NextResponse, type NextRequest } from "next/server";

/**
 * UX only: send visitors without a session cookie to /login before rendering a signed-in
 * area. Real authentication and authorization happen in every API route handler.
 */
export function proxy(request: NextRequest) {
  if (!request.cookies.has("sp_session")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/nurse/:path*", "/agency/:path*", "/admin/:path*"],
};
