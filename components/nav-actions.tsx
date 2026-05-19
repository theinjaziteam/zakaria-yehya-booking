"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/auth-provider";

// Shared pill class — btn-pill in globals.css handles :active fill on mobile
const pill =
  "btn-pill inline-flex h-8 items-center justify-center border border-fg px-3 sm:px-4 font-mono text-[0.7rem] uppercase tracking-widest text-fg transition-colors hover:bg-fg hover:text-canvas select-none";

export function NavActions() {
  const { user, loading, signOut } = useAuth();
  const pathname = usePathname();

  return (
    <div className="flex items-center gap-2 shrink-0">
      {!loading && (
        user ? (
          <Link href="/my-bookings" className={pill} style={{ borderRadius: "9999px" }}>
            My bookings
          </Link>
        ) : (
          <Link href="/auth?from=/my-bookings" className={pill} style={{ borderRadius: "9999px" }}>
            My bookings
          </Link>
        )
      )}

      {!loading && (
        user ? (
          <button
            onClick={() => signOut()}
            className="btn-pill hidden sm:inline-flex h-8 items-center px-2 font-mono text-[0.65rem] uppercase tracking-widest text-muted-fg transition-opacity hover:opacity-70 select-none"
            title={`Signed in as ${user.email}`}
          >
            {user.email?.split("@")[0]} · sign out
          </button>
        ) : (
          <Link
            href={`/auth?from=${encodeURIComponent(pathname)}`}
            className="hidden sm:inline-flex h-8 items-center px-2 font-mono text-[0.65rem] uppercase tracking-widest text-muted-fg transition-opacity hover:opacity-70 select-none"
          >
            Sign in
          </Link>
        )
      )}
    </div>
  );
}
