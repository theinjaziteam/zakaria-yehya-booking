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
        <Link
          href={user ? "/my-bookings" : "/auth?from=/my-bookings"}
          className={pill}
          style={{ borderRadius: "9999px" }}
        >
          My bookings
        </Link>
      )}
      {!loading && user && (
        <button
          onClick={() => signOut()}
          className="btn-pill inline-flex h-8 items-center gap-1 px-2 font-mono text-[0.65rem] uppercase tracking-widest text-muted-fg transition-opacity hover:opacity-70 select-none"
          title={`Signed in as ${user.email}`}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M14 22H5a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9"/>
            <polyline points="17 16 21 12 17 8"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          <span className="hidden sm:inline">{user.email?.split("@")[0]} · sign out</span>
        </button>
      )}
    </div>
  );
}
