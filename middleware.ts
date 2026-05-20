import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";

const COOKIE = "yz_admin_session";

// [path_prefix, max_requests, window_ms]
// Most specific paths must come before broader ones.
const RATE_LIMITS: [string, number, number][] = [
  ["/api/auth/signup",      5,  60_000],  // signup — tightest, prevents account spam
  ["/api/admin/auth",       5,  60_000],  // admin login — brute-force protection
  ["/api/staff/auth",       5,  60_000],  // staff login — brute-force protection
  ["/api/bookings",        15,  60_000],  // create + lookup bookings
  ["/api/orders",          10,  60_000],  // create product order
  ["/api/customer",        20,  60_000],  // customer booking lookup
  ["/api/admin",           40,  60_000],  // admin ops (already cookie-guarded)
  ["/api/staff",           30,  60_000],  // staff ops
];

function clientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ── Admin cookie guard ────────────────────────────────────────────────
  if (pathname.startsWith("/admin")) {
    if (pathname.startsWith("/admin/login")) return NextResponse.next();

    const token = req.cookies.get(COOKIE)?.value;
    const pw = process.env.ADMIN_PASSWORD;
    const expected = pw ? btoa(pw) : null;

    if (!expected || token !== expected) {
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }
    return NextResponse.next();
  }

  // ── API rate limiting ─────────────────────────────────────────────────
  if (pathname.startsWith("/api/")) {
    const ip = clientIp(req);
    const match = RATE_LIMITS.find(([prefix]) => pathname.startsWith(prefix));

    if (match) {
      const [prefix, limit, windowMs] = match;
      const allowed = checkRateLimit(`${ip}:${prefix}`, limit, windowMs);
      if (!allowed) {
        return NextResponse.json(
          { error: "Too many requests. Please slow down and try again." },
          { status: 429, headers: { "Retry-After": "60" } },
        );
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/:path*"],
};
