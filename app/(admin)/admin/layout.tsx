"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clientConfig } from "@/config/client";

const NAV = [
  { href: "/admin/bookings", label: "Bookings" },
  { href: "/admin/orders",   label: "Orders" },
  { href: "/admin/staff",    label: "Staff" },
  { href: "/admin/locations",label: "Locations" },
];

function DoorExitIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true">
      <path d="M14 22H5a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9"/>
      <polyline points="17 16 21 12 17 8"/>
      <line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  );
}

export default function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const router = useRouter();

  // Login page gets no nav — clean standalone page
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  async function handleSignOut() {
    await fetch("/api/admin/auth", { method: "DELETE" });
    router.replace("/admin/login");
  }

  return (
    <div className="min-h-screen bg-bg text-body">
      <nav
        className="sticky top-0 z-50 border-b border-border bg-bg/95"
        style={{ backdropFilter: "blur(8px)" }}
      >
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-sm px-4 sm:px-6">
          {/* Brand */}
          <Link
            href="/"
            className="font-display text-base uppercase tracking-widest text-fg shrink-0 transition-opacity hover:opacity-70"
          >
            {clientConfig.brand.shortName} Admin
          </Link>

          {/* Nav tabs */}
          <div className="flex items-center gap-1 overflow-x-auto">
            {NAV.map((item) => {
              const active = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="shrink-0 px-3 py-1.5 font-mono text-xs uppercase tracking-widest transition-opacity"
                  style={active
                    ? { background: "var(--ink)", color: "var(--canvas)" }
                    : { color: "var(--muted)" }}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* Sign out — icon only on mobile, icon+label on desktop */}
          <button
            onClick={handleSignOut}
            className="shrink-0 flex items-center gap-1.5 text-muted-fg transition-opacity hover:opacity-70"
            title="Sign out"
          >
            <DoorExitIcon />
            <span className="hidden sm:inline font-mono text-[0.6rem] uppercase tracking-widest">
              Out
            </span>
          </button>
        </div>
      </nav>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">{children}</div>
    </div>
  );
}
