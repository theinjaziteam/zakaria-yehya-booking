import { NextRequest, NextResponse } from "next/server";

const COOKIE = "yz_admin_session";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Only guard the admin section; let the login page and auth API through
  if (!pathname.startsWith("/admin")) return NextResponse.next();
  if (pathname.startsWith("/admin/login")) return NextResponse.next();

  const token = req.cookies.get(COOKIE)?.value;
  const expected = process.env.ADMIN_PASSWORD
    ? Buffer.from(process.env.ADMIN_PASSWORD).toString("base64")
    : null;

  if (!expected || token !== expected) {
    const loginUrl = new URL("/admin/login", req.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
