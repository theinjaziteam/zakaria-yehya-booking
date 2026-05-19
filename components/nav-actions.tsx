"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/auth-provider";

export function NavActions() {
  const { user, loading, signOut } = useAuth();
  const pathname = usePathname();

  return (
    <div className="flex items-center gap-2 shrink-0">
      {/* My Bookings — goes to auth page if not signed in */}
      {!loading && (
        user ? (
          <Link
            href="/my-bookings"
            className="inline-flex h-8 items-center justify-center border border-fg px-3 sm:px-4 font-mono text-[0.7rem] uppercase tracking-widest text-fg transition-colors hover:bg-fg hover:text-canvas"
            style={{ borderRadius: "var(--radius-pill)" }}
          >
            My bookings
          </Link>
        ) : (
          <Link
            href={`/auth?from=/my-bookings`}
            className="inline-flex h-8 items-center justify-center border border-fg px-3 sm:px-4 font-mono text-[0.7rem] uppercase tracking-widest text-fg transition-colors hover:bg-fg hover:text-canvas"
            style={{ borderRadius: "var(--radius-pill)" }}
          >
            My bookings
          </Link>
        )
      )}

      {/* Sign in / out — hidden on mobile to keep nav clean */}
      {!loading && (
        user ? (
          <button
            onClick={() => signOut()}
            className="hidden sm:inline-flex h-8 items-center font-mono text-[0.65rem] uppercase tracking-widest text-muted-fg transition-opacity hover:opacity-70 px-1"
            title={`Signed in as ${user.email}`}
          >
            {user.email?.split("@")[0]} · sign out
          </button>
        ) : (
          <Link
            href={`/auth?from=${encodeURIComponent(pathname)}`}
            className="hidden sm:inline-flex h-8 items-center font-mono text-[0.65rem] uppercase tracking-widest text-muted-fg transition-opacity hover:opacity-70 px-1"
          >
            Sign in
          </Link>
        )
      )}
    </div>
  );
}
