"use client";

import Link from "next/link";
import { useAuth } from "@/components/auth-provider";
import { useCart } from "@/components/cart-provider";

// Shared pill class — btn-pill in globals.css handles :active fill on mobile
const pill =
  "btn-pill inline-flex h-8 items-center justify-center border border-fg px-3 sm:px-4 font-mono text-[0.7rem] uppercase tracking-widest text-fg transition-colors hover:bg-fg hover:text-canvas select-none";

export function NavActions() {
  const { user, loading, signOut } = useAuth();
  const { itemCount } = useCart();

  return (
    <div className="flex items-center gap-2 shrink-0">
      {itemCount > 0 && (
        <Link
          href="/checkout"
          className={pill}
          style={{ borderRadius: "9999px" }}
          aria-label={`Cart — ${itemCount} item${itemCount !== 1 ? "s" : ""}`}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="mr-1">
            <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
            <line x1="3" y1="6" x2="21" y2="6"/>
            <path d="M16 10a4 4 0 0 1-8 0"/>
          </svg>
          <span>{itemCount}</span>
        </Link>
      )}
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
